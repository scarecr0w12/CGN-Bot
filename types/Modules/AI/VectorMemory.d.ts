export = VectorMemory;
declare class VectorMemory {
    _clients: Map<any, any>;
    _collectionPrefix: string;
    /**
     * Get or create a Qdrant client for a guild
     * @param {string} guildId - The guild ID
     * @param {Object} config - Qdrant configuration
     * @returns {QdrantClient|null} Qdrant client or null if not configured
     */
    getClient(guildId: string, config: any): QdrantClient | null;
    /**
     * Get collection name for a guild
     * @param {string} guildId - The guild ID
     * @returns {string} Collection name
     */
    getCollectionName(guildId: string): string;
    /**
     * Ensure the collection exists for a guild
     * @param {string} guildId - The guild ID
     * @param {Object} config - Qdrant configuration
     * @returns {Promise<boolean>} Whether the collection exists or was created
     */
    ensureCollection(guildId: string, config: any): Promise<boolean>;
    /**
     * Generate embeddings for text using the AI provider
     * @param {Object} aiManager - The AI manager instance
     * @param {Object} serverDocument - The server document
     * @param {string} text - Text to embed
     * @returns {Promise<number[]|null>} Embedding vector or null
     */
    generateEmbedding(aiManager: any, serverDocument: any, text: string): Promise<number[] | null>;
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
    store({ guildId, channelId, userId, content, type, metadata, embedding, config }: {
        guildId: string;
        channelId: string;
        userId: string;
        content: string;
        type: string;
        metadata: any;
        embedding: number[];
        config: any;
    }): Promise<string | null>;
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
    search({ guildId, embedding, channelId, userId, type, limit, scoreThreshold, config }: {
        guildId: string;
        embedding: number[];
        channelId: string;
        userId: string;
        type: string;
        limit: number;
        scoreThreshold: number;
        config: any;
    }): Promise<any[]>;
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
    delete({ guildId, channelId, userId, olderThan, config }: {
        guildId: string;
        channelId: string;
        userId: string;
        olderThan: number;
        config: any;
    }): Promise<boolean>;
    /**
     * Get collection statistics
     * @param {string} guildId - The guild ID
     * @param {Object} config - Qdrant configuration
     * @returns {Promise<Object|null>} Collection stats or null
     */
    getStats(guildId: string, config: any): Promise<any | null>;
    /**
     * Test connection to Qdrant
     * @param {Object} config - Qdrant configuration
     * @returns {Promise<Object>} Connection test result
     */
    testConnection(config: any): Promise<any>;
    /**
     * Clear client cache (useful when config changes)
     * @param {string} guildId - Optional guild ID to clear specific client
     */
    clearCache(guildId?: string): void;
}
import { QdrantClient } from "@qdrant/js-client-rest";
//# sourceMappingURL=VectorMemory.d.ts.map