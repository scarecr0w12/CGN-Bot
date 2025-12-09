/**
 * ConversationMemory - Manages conversation history for AI chat
 * Supports per-channel and per-user memory with configurable limits
 */

class ConversationMemory {
	constructor () {
		// In-memory cache for conversation history
		// Key format: "guildId:channelId" or "guildId:channelId:userId"
		this._cache = new Map();
		this._maxCacheSize = 1000;
	}

	/**
	 * Get conversation history for a channel/user
	 * @param {string} guildId - The guild ID
	 * @param {string} channelId - The channel ID
	 * @param {string} userId - The user ID
	 * @param {Object} config - Memory configuration
	 * @returns {Array} Array of message objects
	 */
	async getHistory (guildId, channelId, userId, config) {
		const messages = [];
		const limit = config.limit || 10;
		const perUserEnabled = config.perUserEnabled || false;
		const perUserLimit = config.perUserLimit || 5;
		const mergeStrategy = config.mergeStrategy || "append";

		// Get channel history
		const channelKey = `${guildId}:${channelId}`;
		const channelHistory = this._cache.get(channelKey) || [];

		// Get user history if enabled
		let userHistory = [];
		if (perUserEnabled) {
			const userKey = `${guildId}:${channelId}:${userId}`;
			userHistory = this._cache.get(userKey) || [];
		}

		// Merge histories based on strategy
		if (mergeStrategy === "user_first" && userHistory.length > 0) {
			// User history first, then channel history
			messages.push(...userHistory.slice(-perUserLimit));
			const remaining = limit - messages.length;
			if (remaining > 0) {
				messages.push(...channelHistory.slice(-remaining));
			}
		} else if (mergeStrategy === "interleave" && userHistory.length > 0) {
			// Interleave user and channel history
			const combined = [...channelHistory, ...userHistory]
				.sort((a, b) => a.timestamp - b.timestamp)
				.slice(-limit);
			messages.push(...combined.map(m => ({ role: m.role, content: m.content })));
		} else {
			// Default: append (channel history only, or user after channel)
			messages.push(...channelHistory.slice(-limit).map(m => ({ role: m.role, content: m.content })));
		}

		return messages;
	}

	/**
	 * Remember a conversation exchange
	 * @param {string} guildId - The guild ID
	 * @param {string} channelId - The channel ID
	 * @param {string} userId - The user ID
	 * @param {string} userMessage - The user's message
	 * @param {string} assistantMessage - The assistant's response
	 * @param {Object} config - Memory configuration
	 */
	async remember (guildId, channelId, userId, userMessage, assistantMessage, config) {
		const limit = config.limit || 10;
		const perUserEnabled = config.perUserEnabled || false;
		const perUserLimit = config.perUserLimit || 5;
		const timestamp = Date.now();

		// Add to channel history
		const channelKey = `${guildId}:${channelId}`;
		const channelHistory = this._cache.get(channelKey) || [];

		channelHistory.push(
			{ role: "user", content: userMessage, timestamp, userId },
			{ role: "assistant", content: assistantMessage, timestamp },
		);

		// Trim to limit (pairs, so limit * 2)
		while (channelHistory.length > limit * 2) {
			channelHistory.shift();
		}

		this._cache.set(channelKey, channelHistory);

		// Add to user history if enabled
		if (perUserEnabled) {
			const userKey = `${guildId}:${channelId}:${userId}`;
			const userHistory = this._cache.get(userKey) || [];

			userHistory.push(
				{ role: "user", content: userMessage, timestamp },
				{ role: "assistant", content: assistantMessage, timestamp },
			);

			// Trim to per-user limit
			while (userHistory.length > perUserLimit * 2) {
				userHistory.shift();
			}

			this._cache.set(userKey, userHistory);
		}

		// Cleanup old cache entries if needed
		this._cleanupCache();
	}

	/**
	 * Clear conversation history for a channel
	 * @param {string} guildId - The guild ID
	 * @param {string} channelId - The channel ID
	 * @param {string} userId - Optional user ID to clear only user history
	 */
	async clear (guildId, channelId, userId = null) {
		if (userId) {
			const userKey = `${guildId}:${channelId}:${userId}`;
			this._cache.delete(userKey);
		} else {
			const channelKey = `${guildId}:${channelId}`;
			this._cache.delete(channelKey);

			// Also clear all user histories for this channel
			for (const key of this._cache.keys()) {
				if (key.startsWith(`${guildId}:${channelId}:`)) {
					this._cache.delete(key);
				}
			}
		}
	}

	/**
	 * Clear all history for a guild
	 * @param {string} guildId - The guild ID
	 */
	async clearGuild (guildId) {
		for (const key of this._cache.keys()) {
			if (key.startsWith(`${guildId}:`)) {
				this._cache.delete(key);
			}
		}
	}

	/**
	 * Cleanup old cache entries to prevent memory bloat
	 * @private
	 */
	_cleanupCache () {
		if (this._cache.size > this._maxCacheSize) {
			// Remove oldest entries (first half)
			const entries = Array.from(this._cache.entries());
			const toRemove = Math.floor(entries.length / 2);

			for (let i = 0; i < toRemove; i++) {
				this._cache.delete(entries[i][0]);
			}
		}
	}

	/**
	 * Get cache statistics
	 * @returns {Object} Cache stats
	 */
	getStats () {
		return {
			size: this._cache.size,
			maxSize: this._maxCacheSize,
		};
	}
}

module.exports = ConversationMemory;
