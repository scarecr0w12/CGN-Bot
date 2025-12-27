/**
 * Distributed Session Storage
 * Manages user sessions across multiple bot instances using Redis
 * Provides session persistence, sharing, and automatic expiration
 *
 * @module Modules/DistributedSession
 */

const redisClient = require("./RedisClient");
const Logger = require("../Internals/Logger");
const logger = new Logger("DistributedSession");

/**
 * Session configuration
 * @typedef {Object} SessionConfig
 * @property {number} [ttl=86400] - Session TTL in seconds (default: 24 hours)
 * @property {string} [prefix='cgn:session:'] - Key prefix for sessions
 */

/**
 * DistributedSession class for managing user sessions across instances
 *
 * @class DistributedSession
 */
class DistributedSession {
	constructor () {
		this.config = {
			ttl: 86400, // 24 hours default
			prefix: "cgn:session:",
		};
	}

	/**
	 * Configure session settings
	 *
	 * @param {SessionConfig} config - Session configuration
	 */
	configure (config) {
		this.config = { ...this.config, ...config };
		logger.info("DistributedSession: Configured", this.config);
	}

	/**
	 * Create a new session
	 *
	 * @param {string} userId - User ID
	 * @param {Object} data - Session data
	 * @param {number} [ttl] - Custom TTL in seconds
	 * @returns {Promise<string>} Session ID
	 */
	async create (userId, data = {}, ttl) {
		const sessionId = this._generateSessionId(userId);
		const key = this.config.prefix + sessionId;
		const sessionTtl = ttl || this.config.ttl;

		const sessionData = {
			id: sessionId,
			userId,
			data,
			createdAt: Date.now(),
			lastAccessedAt: Date.now(),
			expiresAt: Date.now() + (sessionTtl * 1000),
		};

		try {
			await redisClient.setJSON(key, sessionData, sessionTtl);
			logger.debug("DistributedSession: Created", { userId, sessionId, ttl: sessionTtl });
			return sessionId;
		} catch (error) {
			logger.error("DistributedSession: Create error", { userId }, error);
			throw error;
		}
	}

	/**
	 * Get session data
	 *
	 * @param {string} sessionId - Session ID
	 * @param {boolean} [touch=true] - Update last accessed timestamp
	 * @returns {Promise<Object|null>} Session data or null if not found
	 */
	async get (sessionId, touch = true) {
		const key = this.config.prefix + sessionId;

		try {
			const session = await redisClient.getJSON(key);

			if (!session) {
				return null;
			}

			// Update last accessed timestamp
			if (touch) {
				session.lastAccessedAt = Date.now();
				await redisClient.setJSON(key, session, this.config.ttl);
			}

			logger.debug("DistributedSession: Retrieved", { sessionId, touch });
			return session;
		} catch (error) {
			logger.error("DistributedSession: Get error", { sessionId }, error);
			throw error;
		}
	}

	/**
	 * Update session data
	 *
	 * @param {string} sessionId - Session ID
	 * @param {Object} data - Data to merge into session
	 * @param {number} [ttl] - Optional new TTL
	 * @returns {Promise<boolean>} True if updated, false if not found
	 */
	async update (sessionId, data, ttl) {
		const key = this.config.prefix + sessionId;

		try {
			const session = await this.get(sessionId, false);

			if (!session) {
				return false;
			}

			session.data = { ...session.data, ...data };
			session.lastAccessedAt = Date.now();

			const sessionTtl = ttl || this.config.ttl;
			if (ttl) {
				session.expiresAt = Date.now() + (ttl * 1000);
			}

			await redisClient.setJSON(key, session, sessionTtl);
			logger.debug("DistributedSession: Updated", { sessionId });
			return true;
		} catch (error) {
			logger.error("DistributedSession: Update error", { sessionId }, error);
			throw error;
		}
	}

	/**
	 * Delete a session
	 *
	 * @param {string} sessionId - Session ID
	 * @returns {Promise<boolean>} True if deleted
	 */
	async delete (sessionId) {
		const key = this.config.prefix + sessionId;

		try {
			const result = await redisClient.del(key);
			logger.debug("DistributedSession: Deleted", { sessionId });
			return result === 1;
		} catch (error) {
			logger.error("DistributedSession: Delete error", { sessionId }, error);
			throw error;
		}
	}

	/**
	 * Check if session exists
	 *
	 * @param {string} sessionId - Session ID
	 * @returns {Promise<boolean>} True if exists
	 */
	async exists (sessionId) {
		const key = this.config.prefix + sessionId;

		try {
			return await redisClient.exists(key);
		} catch (error) {
			logger.error("DistributedSession: Exists check error", { sessionId }, error);
			throw error;
		}
	}

	/**
	 * Extend session TTL
	 *
	 * @param {string} sessionId - Session ID
	 * @param {number} additionalSeconds - Seconds to add to TTL
	 * @returns {Promise<boolean>} True if extended
	 */
	async extend (sessionId, additionalSeconds) {
		const key = this.config.prefix + sessionId;

		try {
			const session = await this.get(sessionId, false);

			if (!session) {
				return false;
			}

			session.expiresAt += additionalSeconds * 1000;
			const newTtl = Math.ceil((session.expiresAt - Date.now()) / 1000);

			await redisClient.setJSON(key, session, newTtl);
			logger.debug("DistributedSession: Extended", { sessionId, additionalSeconds });
			return true;
		} catch (error) {
			logger.error("DistributedSession: Extend error", { sessionId }, error);
			throw error;
		}
	}

	/**
	 * Get all sessions for a user
	 *
	 * @param {string} userId - User ID
	 * @returns {Promise<Array<Object>>} Array of sessions
	 */
	async getByUser (userId) {
		const pattern = `${this.config.prefix}*`;
		const sessions = [];

		try {
			for await (const key of redisClient.scan(pattern)) {
				const session = await redisClient.getJSON(key);
				if (session && session.userId === userId) {
					sessions.push(session);
				}
			}

			logger.debug("DistributedSession: Retrieved by user", { userId, count: sessions.length });
			return sessions;
		} catch (error) {
			logger.error("DistributedSession: Get by user error", { userId }, error);
			throw error;
		}
	}

	/**
	 * Delete all sessions for a user
	 *
	 * @param {string} userId - User ID
	 * @returns {Promise<number>} Number of sessions deleted
	 */
	async deleteByUser (userId) {
		try {
			const sessions = await this.getByUser(userId);
			const keys = sessions.map(s => this.config.prefix + s.id);

			if (keys.length === 0) {
				return 0;
			}

			const result = await redisClient.del(...keys);
			logger.info("DistributedSession: Deleted by user", { userId, count: result });
			return result;
		} catch (error) {
			logger.error("DistributedSession: Delete by user error", { userId }, error);
			throw error;
		}
	}

	/**
	 * Get session count
	 *
	 * @returns {Promise<number>} Total active sessions
	 */
	async count () {
		const pattern = `${this.config.prefix}*`;
		let count = 0;

		try {
			// eslint-disable-next-line no-unused-vars
			for await (const sessionKey of redisClient.scan(pattern)) {
				count++;
			}

			logger.debug("DistributedSession: Count", { count });
			return count;
		} catch (error) {
			logger.error("DistributedSession: Count error", {}, error);
			throw error;
		}
	}

	/**
	 * Clean up expired sessions (manual cleanup if needed)
	 * Note: Redis auto-expires keys, this is for manual intervention
	 *
	 * @returns {Promise<number>} Number of expired sessions cleaned
	 */
	async cleanup () {
		const pattern = `${this.config.prefix}*`;
		let cleaned = 0;

		try {
			const now = Date.now();

			for await (const sessionKey of redisClient.scan(pattern)) {
				const session = await redisClient.getJSON(sessionKey);

				if (session && session.expiresAt < now) {
					await redisClient.del(sessionKey);
					cleaned++;
				}
			}

			logger.info("DistributedSession: Cleanup complete", { cleaned });
			return cleaned;
		} catch (error) {
			logger.error("DistributedSession: Cleanup error", {}, error);
			throw error;
		}
	}

	/**
	 * Get statistics about sessions
	 *
	 * @returns {Promise<Object>} Session statistics
	 */
	async getStats () {
		const pattern = `${this.config.prefix}*`;
		const stats = {
			total: 0,
			byUser: {},
			oldestSession: null,
			newestSession: null,
		};

		try {
			for await (const key of redisClient.scan(pattern)) {
				const session = await redisClient.getJSON(key);

				if (session) {
					stats.total++;

					// Count by user
					stats.byUser[session.userId] = (stats.byUser[session.userId] || 0) + 1;

					// Track oldest/newest
					if (!stats.oldestSession || session.createdAt < stats.oldestSession.createdAt) {
						stats.oldestSession = session;
					}
					if (!stats.newestSession || session.createdAt > stats.newestSession.createdAt) {
						stats.newestSession = session;
					}
				}
			}

			logger.debug("DistributedSession: Stats retrieved", { total: stats.total });
			return stats;
		} catch (error) {
			logger.error("DistributedSession: Stats error", {}, error);
			throw error;
		}
	}

	/**
	 * Generate unique session ID
	 * @private
	 * @param {string} userId - User ID
	 * @returns {string} Session ID
	 */
	_generateSessionId (userId) {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `${userId}-${timestamp}-${random}`;
	}
}

// Export singleton instance
module.exports = new DistributedSession();
