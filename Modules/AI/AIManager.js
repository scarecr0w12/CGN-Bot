/**
 * AIManager - Central manager for AI operations
 * Handles provider resolution, chat operations, and coordination between components
 */

const ProviderFactory = require("./providers/ProviderFactory");
const ConversationMemory = require("./ConversationMemory");
const VectorMemory = require("./VectorMemory");
const RateLimiter = require("./RateLimiter");
const UsageTracker = require("./UsageTracker");
const ToolRegistry = require("./tools/ToolRegistry");

class AIManager {
	/**
	 * @param {Object} client - The Discord client instance
	 */
	constructor (client) {
		this.client = client;
		this.providerFactory = new ProviderFactory();
		this.memory = new ConversationMemory();
		this.vectorMemory = new VectorMemory();
		this.rateLimiter = new RateLimiter();
		this.usageTracker = new UsageTracker();
		this.toolRegistry = new ToolRegistry(this);

		// Model cache for provider model lists
		this._modelCache = new Map();
		// 5 minutes in ms
		this._modelCacheTTL = 300000;
	}

	/**
	 * Initialize the AI manager
	 */
	async initialize () {
		await this.toolRegistry.initialize();
		logger.info("AI Manager initialized");
	}

	/**
	 * Resolve provider and model configuration for a guild
	 * @param {Object} serverDocument - The server document from database
	 * @returns {Object} { providerName, model, providerConfig }
	 */
	async resolveProviderAndModel (serverDocument) {
		const aiConfig = serverDocument.config.ai || {};
		const globalConfig = configJSON.ai || {};

		// Get model configuration (guild overrides global)
		const model = aiConfig.model || globalConfig.defaultModel || {
			name: "gpt-4o-mini",
			provider: "openai",
		};

		// Get provider name
		const providerName = (typeof model === "object" ? model.provider : null) ||
			aiConfig.defaultProvider ||
			globalConfig.defaultProvider ||
			"openai";

		// Get provider configuration
		const guildProviders = aiConfig.providers || {};
		const globalProviders = globalConfig.providers || {};

		let providerConfig = {};

		// Merge global config first, then guild overrides
		if (globalProviders[providerName]) {
			providerConfig = { ...globalProviders[providerName] };
		}
		if (guildProviders[providerName]) {
			providerConfig = { ...providerConfig, ...guildProviders[providerName] };
		}

		return { providerName, model, providerConfig };
	}

	/**
	 * Build a provider instance from configuration
	 * @param {string} providerName - Name of the provider
	 * @param {Object} config - Provider configuration
	 * @returns {Object} Provider instance
	 */
	buildProvider (providerName, config) {
		return this.providerFactory.create(providerName, config);
	}

	/**
	 * Get available models for a provider (with caching)
	 * @param {string} providerName - Name of the provider
	 * @param {Object} providerConfig - Provider configuration
	 * @returns {Promise<string[]>} List of available models
	 */
	async getAvailableModels (providerName, providerConfig) {
		const cacheKey = `${providerName}:${JSON.stringify(providerConfig)}`;
		const cached = this._modelCache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < this._modelCacheTTL) {
			return cached.models;
		}

		try {
			const provider = this.buildProvider(providerName, providerConfig);
			const models = await provider.listModels();
			this._modelCache.set(cacheKey, { models, timestamp: Date.now() });
			return models;
		} catch (error) {
			logger.warn(`Failed to fetch models for ${providerName}: ${error.message}`);
			return [];
		}
	}

	/**
	 * Check if a model is allowed by guild policy
	 * @param {Object} serverDocument - The server document
	 * @param {string} providerName - Provider name
	 * @param {string} modelName - Model name
	 * @returns {string|null} Error message if not allowed, null if allowed
	 */
	async isModelAllowed (serverDocument, providerName, modelName) {
		const aiConfig = serverDocument.config.ai || {};
		const policyConfig = aiConfig.policy || {};
		const policy = policyConfig.models || {};
		const allowList = policy.allow || {};
		const denyList = policy.deny || {};
		const allow = allowList[providerName] || [];
		const deny = denyList[providerName] || [];

		if (deny.includes(modelName)) {
			return "Model is denied by server policy.";
		}
		if (allow.length > 0 && !allow.includes(modelName)) {
			return "Model is not in the allowed list.";
		}
		return null;
	}

	/**
	 * Check rate limits and record usage
	 * @param {Object} serverDocument - The server document
	 * @param {Object} channel - The Discord channel
	 * @param {Object} user - The Discord user
	 * @returns {string|null} Error message if rate limited, null if allowed
	 */
	async checkAndRecordUsage (serverDocument, channel, user) {
		const aiConfig = serverDocument.config.ai || {};
		const rateLimits = aiConfig.rateLimits || {};

		// Check cooldown
		const cooldownError = this.rateLimiter.checkCooldown(
			serverDocument._id,
			user.id,
			rateLimits.cooldownSec || 10,
		);
		if (cooldownError) return cooldownError;

		// Check per-user rate limit
		const userRateError = this.rateLimiter.checkUserRate(
			serverDocument._id,
			user.id,
			rateLimits.perUserPerMin || 6,
		);
		if (userRateError) return userRateError;

		// Check per-channel rate limit
		const channelRateError = this.rateLimiter.checkChannelRate(
			serverDocument._id,
			channel.id,
			rateLimits.perChannelPerMin || 20,
		);
		if (channelRateError) return channelRateError;

		// Check budget limits
		const budgetError = await this.checkBudget(serverDocument, user);
		if (budgetError) return budgetError;

		// Record usage
		this.rateLimiter.recordUsage(serverDocument._id, user.id, channel.id);

		return null;
	}

	/**
	 * Check budget limits for a user
	 * @param {Object} serverDocument - The server document
	 * @param {Object} user - The Discord user
	 * @returns {string|null} Error message if over budget, null if allowed
	 */
	async checkBudget (serverDocument, user) {
		const aiConfig = serverDocument.config.ai || {};
		const governance = aiConfig.governance || {};
		const budget = governance.budget || {};
		const usage = aiConfig.usage || {};

		// Check per-user daily token limit
		const perUserDailyTokens = budget.perUserDailyTokens || 0;
		if (perUserDailyTokens > 0) {
			const perUser = usage.perUser || {};
			const userUsage = perUser[user.id] || {};
			const dayStart = userUsage.tokensDayStart || 0;
			const dayTotal = userUsage.tokensDayTotal || 0;

			// Reset if new day
			const now = Date.now();
			if (now - dayStart >= 86400000) {
				// Will be reset on next usage record
			} else if (dayTotal >= perUserDailyTokens) {
				return `You have reached your daily token limit (${perUserDailyTokens} tokens).`;
			}
		}

		// Check guild daily budget
		const guildBudget = budget.perGuild || {};
		if (guildBudget.unit === "tokens" && guildBudget.dailyTokens > 0) {
			const guildUsage = usage.budget || {};
			const dayStart = guildUsage.tokensDayStart || 0;
			const dayTotal = guildUsage.tokensDayTotal || 0;

			const now = Date.now();
			if (now - dayStart < 86400000 && dayTotal >= guildBudget.dailyTokens) {
				return "This server has reached its daily AI token budget.";
			}
		}

		return null;
	}

	/**
	 * Build conversation context from memory
	 * @param {Object} serverDocument - The server document
	 * @param {string} channelId - The channel ID
	 * @param {Object} user - The Discord user
	 * @param {string} currentMessage - The current user message for vector search
	 * @returns {Array} Array of ChatMessage objects
	 */
	async buildContext (serverDocument, channelId, user, currentMessage = null) {
		const aiConfig = serverDocument.config.ai || {};
		const memoryConfig = aiConfig.memory || {};
		const vectorConfig = aiConfig.vectorMemory || {};

		// Get system prompt
		let systemPrompt = aiConfig.systemPrompt ||
			"You are a helpful AI assistant in a Discord server. Be concise and helpful.";

		// Inject vector memory context if enabled
		if (vectorConfig.enabled && vectorConfig.injectContext && currentMessage) {
			const vectorContext = await this.searchVectorMemory(serverDocument, channelId, user.id, currentMessage);
			if (vectorContext && vectorContext.length > 0) {
				const contextPrefix = vectorConfig.contextPrefix || "Relevant context from memory:";
				const contextText = vectorContext.map(m => `- ${m.content}`).join("\n");
				systemPrompt += `\n\n${contextPrefix}\n${contextText}`;
			}
		}

		const messages = [{ role: "system", content: systemPrompt }];

		// Get conversation history
		const history = await this.memory.getHistory(
			serverDocument._id,
			channelId,
			user.id,
			memoryConfig,
		);

		messages.push(...history);

		return messages;
	}

	/**
	 * Search vector memory for relevant context
	 * @param {Object} serverDocument - The server document
	 * @param {string} channelId - The channel ID
	 * @param {string} userId - The user ID
	 * @param {string} query - The search query
	 * @returns {Promise<Array>} Array of relevant memories
	 */
	async searchVectorMemory (serverDocument, channelId, userId, query) {
		const aiConfig = serverDocument.config.ai || {};
		const vectorConfig = aiConfig.vectorMemory || {};

		if (!vectorConfig.enabled || !vectorConfig.url) {
			return [];
		}

		try {
			// Generate embedding for query
			const embedding = await this.vectorMemory.generateEmbedding(this, serverDocument, query);
			if (!embedding) {
				return [];
			}

			// Search vector memory
			const results = await this.vectorMemory.search({
				guildId: serverDocument._id,
				embedding: embedding,
				// Search across all channels for broader context
				channelId: null,
				limit: vectorConfig.searchLimit || 5,
				scoreThreshold: vectorConfig.scoreThreshold || 0.7,
				config: vectorConfig,
			});

			return results;
		} catch (error) {
			logger.warn(`Vector memory search failed for guild ${serverDocument._id}: ${error.message}`);
			return [];
		}
	}

	/**
	 * Store a message in vector memory
	 * @param {Object} serverDocument - The server document
	 * @param {string} channelId - The channel ID
	 * @param {string} userId - The user ID
	 * @param {string} content - The content to store
	 * @param {string} type - Type of memory (message, fact, summary)
	 * @param {Object} metadata - Additional metadata
	 * @returns {Promise<string|null>} Point ID or null
	 */
	async storeInVectorMemory (serverDocument, channelId, userId, content, type = "message", metadata = {}) {
		const aiConfig = serverDocument.config.ai || {};
		const vectorConfig = aiConfig.vectorMemory || {};

		if (!vectorConfig.enabled || !vectorConfig.url) {
			return null;
		}

		// Check if this type should be stored
		if (type === "message" && !vectorConfig.storeMessages) {
			return null;
		}
		if (type === "fact" && !vectorConfig.storeFacts) {
			return null;
		}

		try {
			// Generate embedding
			const embedding = await this.vectorMemory.generateEmbedding(this, serverDocument, content);
			if (!embedding) {
				return null;
			}

			// Store in vector memory
			return await this.vectorMemory.store({
				guildId: serverDocument._id,
				channelId: channelId,
				userId: userId,
				content: content,
				type: type,
				metadata: metadata,
				embedding: embedding,
				config: vectorConfig,
			});
		} catch (error) {
			logger.warn(`Failed to store in vector memory for guild ${serverDocument._id}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Get vector memory statistics for a guild
	 * @param {Object} serverDocument - The server document
	 * @returns {Promise<Object|null>} Stats object or null
	 */
	async getVectorMemoryStats (serverDocument) {
		const aiConfig = serverDocument.config.ai || {};
		const vectorConfig = aiConfig.vectorMemory || {};

		if (!vectorConfig.url) {
			return null;
		}

		return this.vectorMemory.getStats(serverDocument._id, vectorConfig);
	}

	/**
	 * Test vector memory connection
	 * @param {Object} config - Qdrant configuration
	 * @returns {Promise<Object>} Connection test result
	 */
	async testVectorMemoryConnection (config) {
		return this.vectorMemory.testConnection(config);
	}

	/**
	 * Clear vector memory for a guild
	 * @param {Object} serverDocument - The server document
	 * @param {Object} options - Clear options (channelId, userId, olderThan)
	 * @returns {Promise<boolean>} Whether deletion was successful
	 */
	async clearVectorMemory (serverDocument, options = {}) {
		const aiConfig = serverDocument.config.ai || {};
		const vectorConfig = aiConfig.vectorMemory || {};

		if (!vectorConfig.url) {
			return false;
		}

		return this.vectorMemory.delete({
			guildId: serverDocument._id,
			...options,
			config: vectorConfig,
		});
	}

	/**
	 * Perform a chat completion
	 * @param {Object} options - Chat options
	 * @param {Object} options.serverDocument - The server document
	 * @param {Object} options.channel - The Discord channel
	 * @param {Object} options.user - The Discord user
	 * @param {string} options.message - The user's message
	 * @param {boolean} options.stream - Whether to stream the response
	 * @returns {AsyncGenerator|Promise} Response or stream
	 */
	async chat ({ serverDocument, channel, user, message, stream = false }) {
		const { providerName, model, providerConfig } = await this.resolveProviderAndModel(serverDocument);

		if (!providerConfig || !providerConfig.apiKey) {
			throw new Error("AI provider not configured. Ask an admin to set up an API key.");
		}

		const provider = this.buildProvider(providerName, providerConfig);
		const modelName = typeof model === "object" ? model.name : model;

		// Check model policy
		const policyError = await this.isModelAllowed(serverDocument, providerName, modelName);
		if (policyError) {
			throw new Error(policyError);
		}

		// Resolve variables in message
		const resolvedMessage = this.resolveVariables(message, serverDocument, channel, user);

		// Build context (pass current message for vector memory search)
		const messages = await this.buildContext(serverDocument, channel.id, user, resolvedMessage);
		messages.push({ role: "user", content: resolvedMessage });

		// Perform chat
		if (stream) {
			return this._streamChat(provider, modelName, messages, serverDocument, channel, user, resolvedMessage, providerName);
		} else {
			return this._singleChat(provider, modelName, messages, serverDocument, channel, user, resolvedMessage, providerName);
		}
	}

	/**
	 * Perform a single (non-streaming) chat completion
	 * @private
	 */
	async _singleChat (provider, modelName, messages, serverDocument, channel, user, originalMessage, providerName) {
		const response = await provider.chat({ model: modelName, messages, stream: false });

		// Record usage
		const usage = provider.getLastUsage();
		if (usage) {
			await this.usageTracker.recordUsage(serverDocument, user, channel, usage, providerName, modelName);
		}

		// Remember conversation
		const aiConfigMem = serverDocument.config.ai || {};
		await this.memory.remember(
			serverDocument._id,
			channel.id,
			user.id,
			originalMessage,
			response,
			aiConfigMem.memory || {},
		);

		// Store in vector memory (async, non-blocking)
		this.storeInVectorMemory(
			serverDocument,
			channel.id,
			user.id,
			`User: ${originalMessage}\nAssistant: ${response}`,
			"message",
			{ role: "exchange" },
		).catch(err => logger.debug(`Vector memory store failed: ${err.message}`));

		return response;
	}

	/**
	 * Perform a streaming chat completion
	 * @private
	 */
	async *_streamChat (provider, modelName, messages, serverDocument, channel, user, originalMessage, providerName) {
		let fullResponse = "";

		for await (const chunk of provider.chat({ model: modelName, messages, stream: true })) {
			fullResponse += chunk;
			yield chunk;
		}

		// Record usage
		const usage = provider.getLastUsage();
		if (usage) {
			await this.usageTracker.recordUsage(serverDocument, user, channel, usage, providerName, modelName);
		}

		// Remember conversation
		const aiConfigStream = serverDocument.config.ai || {};
		await this.memory.remember(
			serverDocument._id,
			channel.id,
			user.id,
			originalMessage,
			fullResponse,
			aiConfigStream.memory || {},
		);

		// Store in vector memory (async, non-blocking)
		this.storeInVectorMemory(
			serverDocument,
			channel.id,
			user.id,
			`User: ${originalMessage}\nAssistant: ${fullResponse}`,
			"message",
			{ role: "exchange" },
		).catch(err => logger.debug(`Vector memory store failed: ${err.message}`));
	}

	/**
	 * Resolve template variables in a message
	 * @param {string} message - The message with variables
	 * @param {Object} serverDocument - The server document
	 * @param {Object} channel - The Discord channel
	 * @param {Object} user - The Discord user
	 * @returns {string} Message with variables resolved
	 */
	resolveVariables (message, serverDocument, channel, user) {
		const variables = {
			"{{user}}": user.username,
			"{{user.id}}": user.id,
			"{{user.mention}}": `<@${user.id}>`,
			"{{user.tag}}": user.tag || user.username,
			"{{channel}}": channel.name,
			"{{channel.id}}": channel.id,
			"{{server}}": serverDocument._id,
			"{{date}}": new Date().toLocaleDateString(),
			"{{time}}": new Date().toLocaleTimeString(),
			"{{datetime}}": new Date().toLocaleString(),
		};

		let result = message;
		for (const [key, value] of Object.entries(variables)) {
			result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
		}

		return result;
	}

	/**
	 * Get available variables help text
	 * @returns {string} Help text describing available variables
	 */
	getVariablesHelp () {
		return `**Available Variables:**
• \`{{user}}\` - Your username
• \`{{user.id}}\` - Your user ID
• \`{{user.mention}}\` - Mentions you
• \`{{user.tag}}\` - Your full tag
• \`{{channel}}\` - Current channel name
• \`{{channel.id}}\` - Current channel ID
• \`{{server}}\` - Server ID
• \`{{date}}\` - Current date
• \`{{time}}\` - Current time
• \`{{datetime}}\` - Current date and time`;
	}
}

module.exports = AIManager;
