export = ConversationMemory;
declare class ConversationMemory {
    _useRedis: boolean;
    _cache: Map<any, any>;
    _maxCacheSize: number;
    _redisTTL: number;
    /**
     * Get conversation history from Redis
     * @param {string} key - The Redis key
     * @param {number} limit - Maximum messages to retrieve
     * @returns {Promise<Array>} Array of message objects
     * @private
     */
    private _getRedisHistory;
    /**
     * Get conversation history for a channel/user
     * @param {string} guildId - The guild ID
     * @param {string} channelId - The channel ID
     * @param {string} userId - The user ID
     * @param {Object} config - Memory configuration
     * @returns {Array} Array of message objects
     */
    getHistory(guildId: string, channelId: string, userId: string, config: any): any[];
    /**
     * Remember a conversation exchange
     * @param {string} guildId - The guild ID
     * @param {string} channelId - The channel ID
     * @param {string} userId - The user ID
     * @param {string} userMessage - The user's message
     * @param {string} assistantMessage - The assistant's response
     * @param {Object} config - Memory configuration
     */
    remember(guildId: string, channelId: string, userId: string, userMessage: string, assistantMessage: string, config: any): Promise<void>;
    /**
     * Clear conversation history for a channel
     * @param {string} guildId - The guild ID
     * @param {string} channelId - The channel ID
     * @param {string} userId - Optional user ID to clear only user history
     */
    clear(guildId: string, channelId: string, userId?: string): Promise<void>;
    /**
     * Clear all history for a guild
     * @param {string} guildId - The guild ID
     */
    clearGuild(guildId: string): Promise<void>;
    /**
     * Cleanup old cache entries to prevent memory bloat
     * @private
     */
    private _cleanupCache;
    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats(): any;
}
//# sourceMappingURL=ConversationMemory.d.ts.map