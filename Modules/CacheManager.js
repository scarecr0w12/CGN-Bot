/**
 * CacheManager - Redis-backed caching layer for frequent database queries
 *
 * Provides cached access to server configs, user data, and other frequently
 * accessed documents to reduce database load.
 *
 * Usage:
 *   const CacheManager = require('./Modules/CacheManager');
 *   const server = await CacheManager.getServer(serverId);
 *   const user = await CacheManager.getUser(userId);
 */

let Redis = null;
try {
	Redis = require("../Database/Redis");
} catch (err) {
	// Redis not available
}

// Cache TTLs (in seconds)
const TTL = {
	SERVER: 300, // 5 minutes for server configs
	USER: 300, // 5 minutes for user data
	EXTENSION: 600, // 10 minutes for extension data
	GALLERY: 900, // 15 minutes for gallery items
};

// Cache key prefixes
const KEYS = {
	SERVER: "cache:server:",
	USER: "cache:user:",
	EXTENSION: "cache:extension:",
	GALLERY: "cache:gallery:",
};

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map();
const memoryCacheTimestamps = new Map();

/**
 * Check if Redis caching is available
 * @returns {boolean}
 */
const isRedisAvailable = () => Redis && Redis.isEnabled() && Redis.isReady();

/**
 * Get item from cache (Redis or memory fallback)
 * @param {string} key Cache key
 * @param {number} ttl TTL for memory cache check
 * @returns {Promise<Object|null>}
 */
const getFromCache = async (key, ttl) => {
	if (isRedisAvailable()) {
		try {
			const cached = await Redis.getClient().get(key);
			if (cached) {
				return JSON.parse(cached);
			}
		} catch (err) {
			logger.warn("CacheManager: Redis get failed, falling back to memory", { key }, err);
		}
	}

	// Memory fallback
	if (memoryCache.has(key)) {
		const timestamp = memoryCacheTimestamps.get(key) || 0;
		if (Date.now() - timestamp < ttl * 1000) {
			return memoryCache.get(key);
		}
		// Expired - clean up
		memoryCache.delete(key);
		memoryCacheTimestamps.delete(key);
	}

	return null;
};

/**
 * Set item in cache (Redis and memory)
 * @param {string} key Cache key
 * @param {Object} value Value to cache
 * @param {number} ttl TTL in seconds
 */
const setInCache = async (key, value, ttl) => {
	// Always set in memory as fallback
	memoryCache.set(key, value);
	memoryCacheTimestamps.set(key, Date.now());

	// Limit memory cache size
	if (memoryCache.size > 1000) {
		const oldestKey = memoryCache.keys().next().value;
		memoryCache.delete(oldestKey);
		memoryCacheTimestamps.delete(oldestKey);
	}

	if (isRedisAvailable()) {
		try {
			await Redis.getClient().setex(key, ttl, JSON.stringify(value));
		} catch (err) {
			logger.warn("CacheManager: Redis set failed", { key }, err);
		}
	}
};

/**
 * Invalidate cache entry
 * @param {string} key Cache key
 */
const invalidate = async (key) => {
	memoryCache.delete(key);
	memoryCacheTimestamps.delete(key);

	if (isRedisAvailable()) {
		try {
			await Redis.getClient().del(key);
		} catch (err) {
			logger.warn("CacheManager: Redis del failed", { key }, err);
		}
	}
};

/**
 * Invalidate cache entries by pattern
 * @param {string} pattern Key pattern (e.g., "cache:server:*")
 */
const invalidatePattern = async (pattern) => {
	// Clear matching memory cache entries
	const prefix = pattern.replace("*", "");
	for (const key of memoryCache.keys()) {
		if (key.startsWith(prefix)) {
			memoryCache.delete(key);
			memoryCacheTimestamps.delete(key);
		}
	}

	if (isRedisAvailable()) {
		try {
			const client = Redis.getClient();
			const keys = await client.keys(pattern);
			if (keys.length > 0) {
				await client.del(...keys);
			}
		} catch (err) {
			logger.warn("CacheManager: Redis pattern invalidation failed", { pattern }, err);
		}
	}
};

/**
 * Get server document with caching
 * @param {string} serverId Discord server/guild ID
 * @param {boolean} [skipCache=false] Skip cache and fetch fresh
 * @returns {Promise<Document|null>}
 */
const getServer = async (serverId, skipCache = false) => {
	const key = KEYS.SERVER + serverId;

	if (!skipCache) {
		const cached = await getFromCache(key, TTL.SERVER);
		if (cached) {
			logger.debug("CacheManager: Server cache hit", { svrid: serverId });
			// Return as-is for cached data (already a plain object)
			return cached;
		}
	}

	// Fetch from database
	const server = await Servers.findOne(serverId);
	if (server) {
		// Cache the plain object representation
		const serverData = server.toObject ? server.toObject() : server;
		await setInCache(key, serverData, TTL.SERVER);
		logger.debug("CacheManager: Server cached", { svrid: serverId });
	}

	return server;
};

/**
 * Get user document with caching
 * @param {string} userId Discord user ID
 * @param {boolean} [skipCache=false] Skip cache and fetch fresh
 * @returns {Promise<Document|null>}
 */
const getUser = async (userId, skipCache = false) => {
	const key = KEYS.USER + userId;

	if (!skipCache) {
		const cached = await getFromCache(key, TTL.USER);
		if (cached) {
			logger.debug("CacheManager: User cache hit", { usrid: userId });
			return cached;
		}
	}

	// Fetch from database
	const user = await Users.findOne(userId);
	if (user) {
		const userData = user.toObject ? user.toObject() : user;
		await setInCache(key, userData, TTL.USER);
		logger.debug("CacheManager: User cached", { usrid: userId });
	}

	return user;
};

/**
 * Get extension document with caching
 * @param {string} extensionId Extension ID
 * @param {boolean} [skipCache=false] Skip cache and fetch fresh
 * @returns {Promise<Document|null>}
 */
const getExtension = async (extensionId, skipCache = false) => {
	const key = KEYS.EXTENSION + extensionId;

	if (!skipCache) {
		const cached = await getFromCache(key, TTL.EXTENSION);
		if (cached) {
			logger.debug("CacheManager: Extension cache hit", { extid: extensionId });
			return cached;
		}
	}

	// Fetch from database
	const extension = await Gallery.findOne(extensionId);
	if (extension) {
		const extData = extension.toObject ? extension.toObject() : extension;
		await setInCache(key, extData, TTL.EXTENSION);
		logger.debug("CacheManager: Extension cached", { extid: extensionId });
	}

	return extension;
};

/**
 * Invalidate server cache after update
 * @param {string} serverId Discord server/guild ID
 */
const invalidateServer = async (serverId) => {
	await invalidate(KEYS.SERVER + serverId);
	logger.debug("CacheManager: Server cache invalidated", { svrid: serverId });
};

/**
 * Invalidate user cache after update
 * @param {string} userId Discord user ID
 */
const invalidateUser = async (userId) => {
	await invalidate(KEYS.USER + userId);
	logger.debug("CacheManager: User cache invalidated", { usrid: userId });
};

/**
 * Invalidate extension cache after update
 * @param {string} extensionId Extension ID
 */
const invalidateExtension = async (extensionId) => {
	await invalidate(KEYS.EXTENSION + extensionId);
	logger.debug("CacheManager: Extension cache invalidated", { extid: extensionId });
};

/**
 * Clear all caches
 */
const clearAll = async () => {
	memoryCache.clear();
	memoryCacheTimestamps.clear();

	if (isRedisAvailable()) {
		try {
			await invalidatePattern("cache:*");
		} catch (err) {
			logger.warn("CacheManager: Failed to clear all caches", {}, err);
		}
	}

	logger.info("CacheManager: All caches cleared");
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
const getStats = () => ({
	redisAvailable: isRedisAvailable(),
	memoryCacheSize: memoryCache.size,
	ttls: TTL,
});

/**
 * Warm up cache by preloading frequently accessed servers
 * @param {string[]} serverIds Array of server IDs to preload
 */
const warmUpServers = async (serverIds) => {
	const promises = serverIds.map(id => getServer(id, true));
	await Promise.allSettled(promises);
	logger.info("CacheManager: Warmed up server cache", { count: serverIds.length });
};

module.exports = {
	// Core cache operations
	getFromCache,
	setInCache,
	invalidate,
	invalidatePattern,

	// High-level cached getters
	getServer,
	getUser,
	getExtension,

	// Invalidation helpers
	invalidateServer,
	invalidateUser,
	invalidateExtension,
	clearAll,

	// Utilities
	getStats,
	warmUpServers,
	isRedisAvailable,

	// Constants
	TTL,
	KEYS,
};
