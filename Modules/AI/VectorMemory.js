/**
 * VectorMemory - Manages vector-based semantic memory using Qdrant
 * Enables semantic search and long-term memory for AI conversations
 */

const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");

// Default embedding dimension (OpenAI text-embedding-3-small)
const DEFAULT_VECTOR_SIZE = 1536;

class VectorMemory {
	constructor () {
		// Cache of Qdrant clients per guild
		this._clients = new Map();
		// Collection name prefix
		this._collectionPrefix = "skynet_memory_";
	}

	/**
	 * Get or create a Qdrant client for a guild
	 * @param {string} guildId - The guild ID
	 * @param {Object} config - Qdrant configuration
	 * @returns {QdrantClient|null} Qdrant client or null if not configured
	 */
	getClient (guildId, config) {
		if (!config || !config.enabled || !config.url) {
			return null;
		}

		const cacheKey = `${guildId}:${config.url}`;

		if (this._clients.has(cacheKey)) {
			return this._clients.get(cacheKey);
		}

		try {
			const clientConfig = {
				url: config.url,
			};

			// Add API key if provided
			if (config.apiKey) {
				clientConfig.apiKey = config.apiKey;
			}

			const client = new QdrantClient(clientConfig);
			this._clients.set(cacheKey, client);
			return client;
		} catch (error) {
			logger.warn(`Failed to create Qdrant client for guild ${guildId}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Get collection name for a guild
	 * @param {string} guildId - The guild ID
	 * @returns {string} Collection name
	 */
	getCollectionName (guildId) {
		return `${this._collectionPrefix}${guildId}`;
	}

	/**
	 * Ensure the collection exists for a guild
	 * @param {string} guildId - The guild ID
	 * @param {Object} config - Qdrant configuration
	 * @returns {Promise<boolean>} Whether the collection exists or was created
	 */
	async ensureCollection (guildId, config) {
		const client = this.getClient(guildId, config);
		if (!client) return false;

		const collectionName = this.getCollectionName(guildId);
		const vectorSize = config.vectorSize || DEFAULT_VECTOR_SIZE;

		try {
			// Check if collection exists
			const collections = await client.getCollections();
			const exists = collections.collections.some(c => c.name === collectionName);

			if (!exists) {
				// Create collection with appropriate vector size
				await client.createCollection(collectionName, {
					vectors: {
						size: vectorSize,
						distance: "Cosine",
					},
					optimizers_config: {
						default_segment_number: 2,
					},
					replication_factor: 1,
				});

				// Create payload index for efficient filtering
				await client.createPayloadIndex(collectionName, {
					field_name: "channel_id",
					field_schema: "keyword",
				});

				await client.createPayloadIndex(collectionName, {
					field_name: "user_id",
					field_schema: "keyword",
				});

				await client.createPayloadIndex(collectionName, {
					field_name: "type",
					field_schema: "keyword",
				});

				await client.createPayloadIndex(collectionName, {
					field_name: "timestamp",
					field_schema: "integer",
				});

				logger.info(`Created Qdrant collection ${collectionName} for guild ${guildId}`);
			}

			return true;
		} catch (error) {
			logger.warn(`Failed to ensure Qdrant collection for guild ${guildId}: ${error.message}`);
			return false;
		}
	}

	/**
	 * Generate embeddings for text using the AI provider
	 * @param {Object} aiManager - The AI manager instance
	 * @param {Object} serverDocument - The server document
	 * @param {string} text - Text to embed
	 * @returns {Promise<number[]|null>} Embedding vector or null
	 */
	async generateEmbedding (aiManager, serverDocument, text) {
		try {
			const aiConfig = serverDocument.config.ai || {};
			const vectorConfig = aiConfig.vectorMemory || {};
			const providers = aiConfig.providers || {};

			const providerName = vectorConfig.embeddingProvider || "openai";
			const embeddingModel = vectorConfig.embeddingModel || "text-embedding-3-small";

			// For OpenAI Compatible provider
			if (providerName === "openai_compatible") {
				const providerConfig = providers.openai_compatible;
				if (providerConfig && providerConfig.baseUrl) {
					const provider = aiManager.buildProvider("openai_compatible", providerConfig);
					if (typeof provider.embed === "function") {
						return await provider.embed(text, embeddingModel);
					}
				}
			}

			// Fallback/Default: Use OpenAI embeddings
			const openaiConfig = providers.openai;

			if (openaiConfig && openaiConfig.apiKey) {
				const OpenAI = require("openai");
				const openai = new OpenAI({ apiKey: openaiConfig.apiKey });

				const response = await openai.embeddings.create({
					model: embeddingModel,
					input: text,
				});

				return response.data[0].embedding;
			}

			return null;
		} catch (error) {
			logger.warn(`Failed to generate embedding: ${error.message}`);
			return null;
		}
	}

	/**
	 * Store a memory in the vector database
	 * @param {Object} options - Storage options
	 * @param {string} options.guildId - The guild ID
	 * @param {string} options.channelId - The channel ID
	 * @param {string} options.userId - The user ID
	 * @param {string} options.content - The content to store
	 * @param {string} options.type - Type of memory (message, fact, summary)
	 * @param {Object} options.metadata - Additional metadata
	 * @param {number[]} options.embedding - Pre-computed embedding vector
	 * @param {Object} options.config - Qdrant configuration
	 * @returns {Promise<string|null>} Point ID or null if failed
	 */
	async store ({ guildId, channelId, userId, content, type = "message", metadata = {}, embedding, config }) {
		const client = this.getClient(guildId, config);
		if (!client || !embedding) return null;

		const collectionName = this.getCollectionName(guildId);
		const pointId = uuidv4();

		try {
			await this.ensureCollection(guildId, config);

			await client.upsert(collectionName, {
				wait: true,
				points: [
					{
						id: pointId,
						vector: embedding,
						payload: {
							channel_id: channelId,
							user_id: userId,
							content: content,
							type: type,
							timestamp: Date.now(),
							...metadata,
						},
					},
				],
			});

			return pointId;
		} catch (error) {
			logger.warn(`Failed to store memory in Qdrant for guild ${guildId}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Search for similar memories
	 * @param {Object} options - Search options
	 * @param {string} options.guildId - The guild ID
	 * @param {number[]} options.embedding - Query embedding vector
	 * @param {string} options.channelId - Optional channel filter
	 * @param {string} options.userId - Optional user filter
	 * @param {string} options.type - Optional type filter
	 * @param {number} options.limit - Maximum results (default: 5)
	 * @param {number} options.scoreThreshold - Minimum similarity score (default: 0.7)
	 * @param {Object} options.config - Qdrant configuration
	 * @returns {Promise<Array>} Array of matching memories
	 */
	async search ({ guildId, embedding, channelId, userId, type, limit = 5, scoreThreshold = 0.7, config }) {
		const client = this.getClient(guildId, config);
		if (!client || !embedding) return [];

		const collectionName = this.getCollectionName(guildId);

		try {
			// Build filter
			const filter = { must: [] };

			if (channelId) {
				filter.must.push({
					key: "channel_id",
					match: { value: channelId },
				});
			}

			if (userId) {
				filter.must.push({
					key: "user_id",
					match: { value: userId },
				});
			}

			if (type) {
				filter.must.push({
					key: "type",
					match: { value: type },
				});
			}

			const searchParams = {
				vector: embedding,
				limit: limit,
				score_threshold: scoreThreshold,
				with_payload: true,
			};

			if (filter.must.length > 0) {
				searchParams.filter = filter;
			}

			const results = await client.search(collectionName, searchParams);

			return results.map(result => ({
				id: result.id,
				score: result.score,
				content: result.payload.content,
				channelId: result.payload.channel_id,
				userId: result.payload.user_id,
				type: result.payload.type,
				timestamp: result.payload.timestamp,
				metadata: result.payload,
			}));
		} catch (error) {
			// Collection might not exist yet
			if (error.status === 404) {
				return [];
			}
			logger.warn(`Failed to search Qdrant for guild ${guildId}: ${error.message}`);
			return [];
		}
	}

	/**
	 * Delete memories by filter
	 * @param {Object} options - Delete options
	 * @param {string} options.guildId - The guild ID
	 * @param {string} options.channelId - Optional channel filter
	 * @param {string} options.userId - Optional user filter
	 * @param {number} options.olderThan - Delete memories older than this timestamp
	 * @param {Object} options.config - Qdrant configuration
	 * @returns {Promise<boolean>} Whether deletion was successful
	 */
	async delete ({ guildId, channelId, userId, olderThan, config }) {
		const client = this.getClient(guildId, config);
		if (!client) return false;

		const collectionName = this.getCollectionName(guildId);

		try {
			const filter = { must: [] };

			if (channelId) {
				filter.must.push({
					key: "channel_id",
					match: { value: channelId },
				});
			}

			if (userId) {
				filter.must.push({
					key: "user_id",
					match: { value: userId },
				});
			}

			if (olderThan) {
				filter.must.push({
					key: "timestamp",
					range: { lt: olderThan },
				});
			}

			if (filter.must.length === 0) {
				// Delete entire collection
				await client.deleteCollection(collectionName);
				logger.info(`Deleted Qdrant collection ${collectionName}`);
			} else {
				await client.delete(collectionName, {
					filter: filter,
				});
			}

			return true;
		} catch (error) {
			logger.warn(`Failed to delete from Qdrant for guild ${guildId}: ${error.message}`);
			return false;
		}
	}

	/**
	 * Get collection statistics
	 * @param {string} guildId - The guild ID
	 * @param {Object} config - Qdrant configuration
	 * @returns {Promise<Object|null>} Collection stats or null
	 */
	async getStats (guildId, config) {
		const client = this.getClient(guildId, config);
		if (!client) return null;

		const collectionName = this.getCollectionName(guildId);

		try {
			const info = await client.getCollection(collectionName);
			return {
				vectorsCount: info.vectors_count,
				pointsCount: info.points_count,
				segmentsCount: info.segments_count,
				status: info.status,
				vectorSize: (info.config && info.config.params && info.config.params.vectors && info.config.params.vectors.size) || DEFAULT_VECTOR_SIZE,
			};
		} catch (error) {
			if (error.status === 404) {
				return {
					vectorsCount: 0,
					pointsCount: 0,
					segmentsCount: 0,
					status: "not_created",
					vectorSize: config.vectorSize || DEFAULT_VECTOR_SIZE,
				};
			}
			logger.warn(`Failed to get Qdrant stats for guild ${guildId}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Test connection to Qdrant
	 * @param {Object} config - Qdrant configuration
	 * @returns {Promise<Object>} Connection test result
	 */
	async testConnection (config) {
		if (!config || !config.url) {
			return { success: false, error: "No URL configured" };
		}

		try {
			const clientConfig = { url: config.url };
			if (config.apiKey) {
				clientConfig.apiKey = config.apiKey;
			}

			const client = new QdrantClient(clientConfig);
			const collections = await client.getCollections();

			return {
				success: true,
				collectionsCount: collections.collections.length,
				message: `Connected successfully. Found ${collections.collections.length} collections.`,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * Clear client cache (useful when config changes)
	 * @param {string} guildId - Optional guild ID to clear specific client
	 */
	clearCache (guildId = null) {
		if (guildId) {
			for (const key of this._clients.keys()) {
				if (key.startsWith(`${guildId}:`)) {
					this._clients.delete(key);
				}
			}
		} else {
			this._clients.clear();
		}
	}
}

module.exports = VectorMemory;
