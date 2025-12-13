/**
 * ConversationMemory - Manages conversation history for AI chat
 * Supports per-channel and per-user memory with configurable limits
 * Uses Redis for persistence when available, falls back to in-memory
 */

const Redis = require("../../Database/Redis");

class ConversationMemory {
	constructor () {
		// Check if Redis is available for persistent storage
		this._useRedis = Redis.isEnabled() && Redis.isReady();

		// In-memory cache fallback
		// Key format: "guildId:channelId" or "guildId:channelId:userId"
		this._cache = new Map();
		this._maxCacheSize = 1000;

		// Redis TTL for conversation history (24 hours)
		this._redisTTL = 86400;
	}

	/**
	 * Get conversation history from Redis
	 * @param {string} key - The Redis key
	 * @param {number} limit - Maximum messages to retrieve
	 * @returns {Promise<Array>} Array of message objects
	 * @private
	 */
	async _getRedisHistory (key, limit) {
		try {
			const client = Redis.getClient();
			// Get last N*2 entries (pairs of user/assistant messages)
			const raw = await client.lrange(key, 0, (limit * 2) - 1);
			return raw.map(msg => JSON.parse(msg)).reverse();
		} catch (err) {
			logger.warn("Redis getHistory failed, falling back to memory", {}, err);
			return null;
		}
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

		let channelHistory = [];
		let userHistory = [];

		if (this._useRedis) {
			// Try Redis first
			const channelKey = `conv:${guildId}:${channelId}`;
			channelHistory = await this._getRedisHistory(channelKey, limit) || [];

			if (perUserEnabled) {
				const userKey = `conv:${guildId}:${channelId}:${userId}`;
				userHistory = await this._getRedisHistory(userKey, perUserLimit) || [];
			}
		}

		// Fallback to in-memory if Redis failed or returned empty
		if (channelHistory.length === 0) {
			const channelKey = `${guildId}:${channelId}`;
			channelHistory = this._cache.get(channelKey) || [];
		}

		if (perUserEnabled && userHistory.length === 0) {
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

		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				const pipeline = client.pipeline();

				// Add to channel history (lpush adds to front, so newest first)
				const channelKey = `conv:${guildId}:${channelId}`;
				pipeline.lpush(channelKey, JSON.stringify({ role: "assistant", content: assistantMessage, timestamp }));
				pipeline.lpush(channelKey, JSON.stringify({ role: "user", content: userMessage, timestamp, userId }));
				pipeline.ltrim(channelKey, 0, (limit * 2) - 1);
				pipeline.expire(channelKey, this._redisTTL);

				// Add to user history if enabled
				if (perUserEnabled) {
					const userKey = `conv:${guildId}:${channelId}:${userId}`;
					pipeline.lpush(userKey, JSON.stringify({ role: "assistant", content: assistantMessage, timestamp }));
					pipeline.lpush(userKey, JSON.stringify({ role: "user", content: userMessage, timestamp }));
					pipeline.ltrim(userKey, 0, (perUserLimit * 2) - 1);
					pipeline.expire(userKey, this._redisTTL);
				}

				await pipeline.exec();
				return;
			} catch (err) {
				logger.warn("Redis remember failed, falling back to memory", {}, err);
			}
		}

		// Fallback to in-memory
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
		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				if (userId) {
					await client.del(`conv:${guildId}:${channelId}:${userId}`);
				} else {
					// Delete channel key and scan for user keys
					const channelKey = `conv:${guildId}:${channelId}`;
					await client.del(channelKey);

					// Scan for user keys matching this channel
					const pattern = `conv:${guildId}:${channelId}:*`;
					let cursor = "0";
					do {
						const [newCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
						cursor = newCursor;
						if (keys.length > 0) {
							await client.del(...keys);
						}
					} while (cursor !== "0");
				}
			} catch (err) {
				logger.warn("Redis clear failed", {}, err);
			}
		}

		// Also clear in-memory cache
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
		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				// Scan for all keys matching this guild
				const pattern = `conv:${guildId}:*`;
				let cursor = "0";
				do {
					const [newCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
					cursor = newCursor;
					if (keys.length > 0) {
						await client.del(...keys);
					}
				} while (cursor !== "0");
			} catch (err) {
				logger.warn("Redis clearGuild failed", {}, err);
			}
		}

		// Also clear in-memory cache
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
