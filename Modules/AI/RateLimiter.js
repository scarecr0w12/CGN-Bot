/**
 * RateLimiter - Manages rate limiting for AI commands
 * Supports cooldowns, per-user limits, and per-channel limits
 * Uses Redis for cross-shard consistency when available, falls back to in-memory
 */

const Redis = require("../../Database/Redis");

class RateLimiter {
	constructor () {
		// Check if Redis is available for cross-shard rate limiting
		this._useRedis = Redis.isEnabled() && Redis.isReady();

		// Fallback in-memory stores (used when Redis unavailable)
		this._cooldowns = new Map();
		this._userRates = new Map();
		this._channelRates = new Map();

		// Only run cleanup for in-memory mode
		if (!this._useRedis) {
			this._cleanupInterval = setInterval(() => this._cleanup(), 60000);
		}
	}

	/**
	 * Check if user is on cooldown
	 * @param {string} guildId - The guild ID
	 * @param {string} userId - The user ID
	 * @param {number} cooldownSec - Cooldown duration in seconds
	 * @returns {Promise<string|null>} Error message if on cooldown, null if allowed
	 */
	async checkCooldown (guildId, userId, cooldownSec) {
		if (cooldownSec <= 0) return null;

		const key = `ai:cd:${guildId}:${userId}`;

		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				const lastUsed = await client.get(key);
				if (lastUsed) {
					const elapsed = (Date.now() - parseInt(lastUsed, 10)) / 1000;
					if (elapsed < cooldownSec) {
						const remaining = Math.ceil(cooldownSec - elapsed);
						return `Please wait ${remaining} second${remaining !== 1 ? "s" : ""} before using AI commands again.`;
					}
				}
				return null;
			} catch (err) {
				logger.warn("Redis cooldown check failed, falling back to memory", {}, err);
			}
		}

		// Fallback to in-memory
		const memKey = `${guildId}:${userId}`;
		const lastUsed = this._cooldowns.get(memKey);
		if (lastUsed) {
			const elapsed = (Date.now() - lastUsed) / 1000;
			if (elapsed < cooldownSec) {
				const remaining = Math.ceil(cooldownSec - elapsed);
				return `Please wait ${remaining} second${remaining !== 1 ? "s" : ""} before using AI commands again.`;
			}
		}
		return null;
	}

	/**
	 * Check per-user rate limit
	 * @param {string} guildId - The guild ID
	 * @param {string} userId - The user ID
	 * @param {number} perMinute - Max requests per minute
	 * @returns {Promise<string|null>} Error message if rate limited, null if allowed
	 */
	async checkUserRate (guildId, userId, perMinute) {
		if (perMinute <= 0) return null;

		const key = `ai:ur:${guildId}:${userId}`;

		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				const count = await client.get(key);
				if (count && parseInt(count, 10) >= perMinute) {
					const ttl = await client.ttl(key);
					return `You've reached your rate limit (${perMinute}/min). Please wait ${ttl > 0 ? ttl : 60} seconds.`;
				}
				return null;
			} catch (err) {
				logger.warn("Redis user rate check failed, falling back to memory", {}, err);
			}
		}

		// Fallback to in-memory
		const memKey = `${guildId}:${userId}`;
		const now = Date.now();
		const windowMs = 60000;
		let rate = this._userRates.get(memKey);
		if (!rate || now - rate.windowStart >= windowMs) {
			rate = { count: 0, windowStart: now };
		}
		if (rate.count >= perMinute) {
			const remaining = Math.ceil((rate.windowStart + windowMs - now) / 1000);
			return `You've reached your rate limit (${perMinute}/min). Please wait ${remaining} seconds.`;
		}
		return null;
	}

	/**
	 * Check per-channel rate limit
	 * @param {string} guildId - The guild ID
	 * @param {string} channelId - The channel ID
	 * @param {number} perMinute - Max requests per minute
	 * @returns {Promise<string|null>} Error message if rate limited, null if allowed
	 */
	async checkChannelRate (guildId, channelId, perMinute) {
		if (perMinute <= 0) return null;

		const key = `ai:cr:${guildId}:${channelId}`;

		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				const count = await client.get(key);
				if (count && parseInt(count, 10) >= perMinute) {
					const ttl = await client.ttl(key);
					return `This channel has reached its rate limit (${perMinute}/min). Please wait ${ttl > 0 ? ttl : 60} seconds.`;
				}
				return null;
			} catch (err) {
				logger.warn("Redis channel rate check failed, falling back to memory", {}, err);
			}
		}

		// Fallback to in-memory
		const memKey = `${guildId}:${channelId}`;
		const now = Date.now();
		const windowMs = 60000;
		let rate = this._channelRates.get(memKey);
		if (!rate || now - rate.windowStart >= windowMs) {
			rate = { count: 0, windowStart: now };
		}
		if (rate.count >= perMinute) {
			const remaining = Math.ceil((rate.windowStart + windowMs - now) / 1000);
			return `This channel has reached its rate limit (${perMinute}/min). Please wait ${remaining} seconds.`;
		}
		return null;
	}

	/**
	 * Record usage for rate limiting
	 * @param {string} guildId - The guild ID
	 * @param {string} userId - The user ID
	 * @param {string} channelId - The channel ID
	 * @returns {Promise<void>}
	 */
	async recordUsage (guildId, userId, channelId) {
		const now = Date.now();

		if (this._useRedis) {
			try {
				const client = Redis.getClient();
				const pipeline = client.pipeline();

				// Set cooldown (expires after 5 minutes)
				pipeline.set(`ai:cd:${guildId}:${userId}`, now, "EX", 300);

				// Increment user rate (1 minute window)
				const userKey = `ai:ur:${guildId}:${userId}`;
				pipeline.incr(userKey);
				pipeline.expire(userKey, 60);

				// Increment channel rate (1 minute window)
				const channelKey = `ai:cr:${guildId}:${channelId}`;
				pipeline.incr(channelKey);
				pipeline.expire(channelKey, 60);

				await pipeline.exec();
				return;
			} catch (err) {
				logger.warn("Redis usage recording failed, falling back to memory", {}, err);
			}
		}

		// Fallback to in-memory
		const windowMs = 60000;

		// Update cooldown
		this._cooldowns.set(`${guildId}:${userId}`, now);

		// Update user rate
		const userKey = `${guildId}:${userId}`;
		let userRate = this._userRates.get(userKey);
		if (!userRate || now - userRate.windowStart >= windowMs) {
			userRate = { count: 0, windowStart: now };
		}
		userRate.count++;
		this._userRates.set(userKey, userRate);

		// Update channel rate
		const channelKey = `${guildId}:${channelId}`;
		let channelRate = this._channelRates.get(channelKey);
		if (!channelRate || now - channelRate.windowStart >= windowMs) {
			channelRate = { count: 0, windowStart: now };
		}
		channelRate.count++;
		this._channelRates.set(channelKey, channelRate);
	}

	/**
	 * Check if user has bypass role
	 * @param {Object} member - Discord guild member
	 * @param {Array} bypassRoles - Array of role IDs that bypass rate limits
	 * @returns {boolean} True if user can bypass
	 */
	hasBypassRole (member, bypassRoles) {
		if (!bypassRoles || bypassRoles.length === 0) return false;
		return member.roles.cache.some(role => bypassRoles.includes(role.id));
	}

	/**
	 * Cleanup old entries
	 * @private
	 */
	_cleanup () {
		const now = Date.now();
		// 5 minutes
		const maxAge = 300000;

		// Cleanup cooldowns
		for (const [key, timestamp] of this._cooldowns.entries()) {
			if (now - timestamp > maxAge) {
				this._cooldowns.delete(key);
			}
		}

		// Cleanup rates
		for (const [key, rate] of this._userRates.entries()) {
			if (now - rate.windowStart > maxAge) {
				this._userRates.delete(key);
			}
		}

		for (const [key, rate] of this._channelRates.entries()) {
			if (now - rate.windowStart > maxAge) {
				this._channelRates.delete(key);
			}
		}
	}

	/**
	 * Destroy the rate limiter (cleanup interval)
	 */
	destroy () {
		if (this._cleanupInterval) {
			clearInterval(this._cleanupInterval);
			this._cleanupInterval = null;
		}
	}
}

module.exports = RateLimiter;
