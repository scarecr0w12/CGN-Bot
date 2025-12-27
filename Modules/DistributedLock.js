/**
 * Distributed Lock Manager
 * Implements distributed locking using Redis for coordinating operations across multiple bot instances
 *
 * @module Modules/DistributedLock
 */

const redisClient = require("./RedisClient");
const Logger = require("../Internals/Logger");
const logger = new Logger("DistributedLock");

/**
 * Lock options
 * @typedef {Object} LockOptions
 * @property {number} [ttl=10000] - Lock time-to-live in milliseconds
 * @property {number} [retry=3] - Number of retry attempts
 * @property {number} [retryDelay=100] - Delay between retries in milliseconds
 */

/**
 * DistributedLock class for coordinating operations across instances
 *
 * @class DistributedLock
 */
class DistributedLock {
	constructor () {
		this.locks = new Map(); // Track locks held by this instance
		this.lockPrefix = "cgn:lock:";
	}

	/**
	 * Acquire a distributed lock
	 *
	 * @param {string} resource - Resource name to lock
	 * @param {LockOptions} [options={}] - Lock options
	 * @returns {Promise<string|null>} Lock token if acquired, null if failed
	 */
	async acquire (resource, options = {}) {
		const {
			ttl = 10000,
			retry = 3,
			retryDelay = 100,
		} = options;

		const key = this.lockPrefix + resource;
		const token = this._generateToken();
		const ttlSeconds = Math.ceil(ttl / 1000);

		for (let attempt = 0; attempt <= retry; attempt++) {
			try {
				// Use SET with NX (only set if not exists) and EX (expiration)
				const result = await redisClient.execute(
					"set",
					key,
					token,
					"NX",
					"EX",
					ttlSeconds,
				);

				if (result === "OK") {
					// Lock acquired
					this.locks.set(resource, {
						token,
						key,
						acquiredAt: Date.now(),
						ttl,
					});

					logger.debug("DistributedLock: Acquired", { resource, ttl });
					return token;
				}

				// Lock not acquired, retry if attempts remaining
				if (attempt < retry) {
					await this._sleep(retryDelay);
				}
			} catch (error) {
				logger.error("DistributedLock: Acquire error", { resource, attempt }, error);
				if (attempt === retry) {
					throw error;
				}
			}
		}

		logger.debug("DistributedLock: Failed to acquire", { resource, retry });
		return null;
	}

	/**
	 * Release a distributed lock
	 *
	 * @param {string} resource - Resource name
	 * @param {string} token - Lock token from acquire()
	 * @returns {Promise<boolean>} True if released, false if not held
	 */
	async release (resource, token) {
		const lockInfo = this.locks.get(resource);

		if (!lockInfo || lockInfo.token !== token) {
			logger.warn("DistributedLock: Release failed - invalid token", { resource });
			return false;
		}

		try {
			// Use Lua script for atomic check-and-delete
			const script = `
				if redis.call("get", KEYS[1]) == ARGV[1] then
					return redis.call("del", KEYS[1])
				else
					return 0
				end
			`;

			const result = await redisClient.execute(
				"eval",
				script,
				1,
				lockInfo.key,
				token,
			);

			if (result === 1) {
				this.locks.delete(resource);
				logger.debug("DistributedLock: Released", { resource });
				return true;
			}

			logger.warn("DistributedLock: Release failed - lock expired or stolen", { resource });
			this.locks.delete(resource);
			return false;
		} catch (error) {
			logger.error("DistributedLock: Release error", { resource }, error);
			throw error;
		}
	}

	/**
	 * Extend lock TTL
	 *
	 * @param {string} resource - Resource name
	 * @param {string} token - Lock token
	 * @param {number} additionalTtl - Additional TTL in milliseconds
	 * @returns {Promise<boolean>} True if extended, false if not held
	 */
	async extend (resource, token, additionalTtl) {
		const lockInfo = this.locks.get(resource);

		if (!lockInfo || lockInfo.token !== token) {
			logger.warn("DistributedLock: Extend failed - invalid token", { resource });
			return false;
		}

		try {
			const newTtlSeconds = Math.ceil((lockInfo.ttl + additionalTtl) / 1000);

			// Use Lua script for atomic check-and-extend
			const script = `
				if redis.call("get", KEYS[1]) == ARGV[1] then
					return redis.call("expire", KEYS[1], ARGV[2])
				else
					return 0
				end
			`;

			const result = await redisClient.execute(
				"eval",
				script,
				1,
				lockInfo.key,
				token,
				newTtlSeconds,
			);

			if (result === 1) {
				lockInfo.ttl += additionalTtl;
				logger.debug("DistributedLock: Extended", { resource, additionalTtl });
				return true;
			}

			logger.warn("DistributedLock: Extend failed - lock expired", { resource });
			this.locks.delete(resource);
			return false;
		} catch (error) {
			logger.error("DistributedLock: Extend error", { resource }, error);
			throw error;
		}
	}

	/**
	 * Execute function with automatic lock management
	 *
	 * @param {string} resource - Resource name
	 * @param {Function} fn - Async function to execute
	 * @param {LockOptions} [options={}] - Lock options
	 * @returns {Promise<any>} Function result
	 * @throws {Error} If lock cannot be acquired or function fails
	 */
	async withLock (resource, fn, options = {}) {
		const token = await this.acquire(resource, options);

		if (!token) {
			throw new Error(`Failed to acquire lock for resource: ${resource}`);
		}

		try {
			const result = await fn();
			return result;
		} finally {
			await this.release(resource, token);
		}
	}

	/**
	 * Check if a lock is currently held
	 *
	 * @param {string} resource - Resource name
	 * @returns {Promise<boolean>} True if locked
	 */
	async isLocked (resource) {
		const key = this.lockPrefix + resource;

		try {
			const exists = await redisClient.exists(key);
			return exists;
		} catch (error) {
			logger.error("DistributedLock: isLocked error", { resource }, error);
			throw error;
		}
	}

	/**
	 * Force release a lock (admin operation)
	 * WARNING: Only use when absolutely necessary
	 *
	 * @param {string} resource - Resource name
	 * @returns {Promise<boolean>} True if released
	 */
	async forceRelease (resource) {
		const key = this.lockPrefix + resource;

		try {
			const result = await redisClient.del(key);
			this.locks.delete(resource);

			logger.warn("DistributedLock: Force released", { resource });
			return result === 1;
		} catch (error) {
			logger.error("DistributedLock: Force release error", { resource }, error);
			throw error;
		}
	}

	/**
	 * Get all active locks held by this instance
	 *
	 * @returns {Array<Object>} Lock information
	 */
	getActiveLocks () {
		const locks = [];

		for (const [resource, info] of this.locks.entries()) {
			locks.push({
				resource,
				token: info.token,
				acquiredAt: info.acquiredAt,
				ttl: info.ttl,
				age: Date.now() - info.acquiredAt,
			});
		}

		return locks;
	}

	/**
	 * Release all locks held by this instance
	 * Useful for cleanup on shutdown
	 *
	 * @returns {Promise<void>}
	 */
	async releaseAll () {
		const resources = Array.from(this.locks.keys());

		for (const resource of resources) {
			const lockInfo = this.locks.get(resource);
			try {
				await this.release(resource, lockInfo.token);
			} catch (error) {
				logger.error("DistributedLock: releaseAll error", { resource }, error);
			}
		}

		logger.info("DistributedLock: Released all locks", { count: resources.length });
	}

	/**
	 * Generate unique lock token
	 * @private
	 * @returns {string} Token
	 */
	_generateToken () {
		return `${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	}

	/**
	 * Sleep for specified milliseconds
	 * @private
	 * @param {number} ms - Milliseconds
	 * @returns {Promise<void>}
	 */
	_sleep (ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// Export singleton instance
module.exports = new DistributedLock();
