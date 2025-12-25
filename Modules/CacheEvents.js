/**
 * @fileoverview Cache Invalidation Event System
 * Provides event-driven cache invalidation for distributed systems with pattern matching support.
 *
 * @module Modules/CacheEvents
 * @requires events
 *
 * @example
 * const { cacheEvents, invalidateServerCaches } = require('./Modules/CacheEvents');
 *
 * // Register a handler
 * cacheEvents.onInvalidate('server:123:config', (key, data) => {
 *   console.log(`Cache ${key} invalidated`, data);
 * });
 *
 * // Invalidate caches
 * invalidateServerCaches('123', ['config', 'permissions']);
 */

const EventEmitter = require("events");

// Performance monitoring (lazy-loaded to avoid circular dependency)
let metrics = null;
try {
	metrics = require("./Metrics");
} catch (err) {
	// Metrics module not available, continue without monitoring
}

// Distributed cache (lazy-loaded, optional)
let distributedCache = null;
let distributedCacheEnabled = false;
try {
	distributedCache = require("./DistributedCache");
	distributedCacheEnabled = process.env.ENABLE_DISTRIBUTED_CACHE !== "false";
} catch (err) {
	// Distributed cache not available
}

/**
 * CacheEvents class for managing cache invalidation across the system.
 * Extends EventEmitter to provide event-driven cache invalidation with handler registration.
 *
 * @class CacheEvents
 * @extends EventEmitter
 *
 * @example
 * const cacheEvents = new CacheEvents();
 * cacheEvents.onInvalidate('user:*:profile', (key, data) => {
 *   userCache.delete(key);
 * });
 */
class CacheEvents extends EventEmitter {
	/**
	 * Creates a new CacheEvents instance.
	 * Initializes the handlers map for storing registered invalidation handlers.
	 *
	 * @constructor
	 */
	constructor () {
		super();
		/**
		 * Map of cache keys to their registered handler functions
		 * @type {Map<string, Function[]>}
		 * @private
		 */
		this.handlers = new Map();
	}

	/**
	 * Register a cache invalidation handler for a specific cache key.
	 * Multiple handlers can be registered for the same key.
	 *
	 * @param {string} cacheKey - The cache key pattern to listen for (e.g., 'server:123:config')
	 * @param {Function} handler - Handler function called when cache is invalidated
	 * @param {string} handler.cacheKey - The cache key that was invalidated
	 * @param {Object} handler.data - Optional metadata about the invalidation
	 *
	 * @example
	 * cacheEvents.onInvalidate('server:123:config', (key, data) => {
	 *   console.log(`${key} invalidated because ${data.reason}`);
	 *   configCache.delete(key);
	 * });
	 */
	onInvalidate (cacheKey, handler) {
		if (!this.handlers.has(cacheKey)) {
			this.handlers.set(cacheKey, []);
		}
		this.handlers.get(cacheKey).push(handler);

		// Update handler count metric
		if (metrics) {
			const totalHandlers = Array.from(this.handlers.values()).reduce((sum, arr) => sum + arr.length, 0);
			metrics.updateCacheHandlerCount(totalHandlers);
		}
	}

	/**
	 * Invalidate a cache entry and notify all registered listeners.
	 * Emits both specific key events and wildcard events for pattern matching.
	 * Errors in handlers are caught and logged without interrupting other handlers.
	 *
	 * @param {string} cacheKey - The cache key to invalidate
	 * @param {Object} [data={}] - Optional metadata about the invalidation
	 * @param {string} [data.reason] - Reason for invalidation
	 * @param {string} [data.userId] - User who triggered the invalidation
	 * @param {*} [data.*] - Any additional metadata
	 *
	 * @fires CacheEvents#invalidate:${cacheKey}
	 * @fires CacheEvents#invalidate:*
	 *
	 * @example
	 * cacheEvents.invalidate('server:123:config', {
	 *   reason: 'config updated',
	 *   userId: '456'
	 * });
	 */
	invalidate (cacheKey, data = {}) {
		const start = process.hrtime.bigint();

		// Emit specific key event
		this.emit(`invalidate:${cacheKey}`, data);

		// Execute registered handlers
		const handlers = this.handlers.get(cacheKey) || [];
		handlers.forEach(handler => {
			try {
				handler(cacheKey, data);
			} catch (err) {
				logger.error(`CacheEvents: Handler error for ${cacheKey}`, {}, err);
			}
		});

		// Emit wildcard event for pattern matching
		this.emit("invalidate:*", cacheKey, data);

		// Broadcast to other instances if distributed cache is enabled
		if (distributedCacheEnabled && distributedCache && distributedCache.initialized) {
			distributedCache.invalidate(cacheKey, data).catch(err => {
				logger.error(`CacheEvents: Distributed invalidation failed for ${cacheKey}`, {}, err);
			});
		}

		// Record metrics
		if (metrics) {
			const duration = Number(process.hrtime.bigint() - start) / 1e9;
			metrics.recordCacheInvalidation(this._normalizeKeyPattern(cacheKey), "single");
			metrics.metrics.cacheInvalidationDuration.observe({ invalidation_type: "single" }, duration);
		}
	}

	/**
	 * Invalidate multiple cache entries matching a regex pattern.
	 * Iterates through all registered cache keys and invalidates matching ones.
	 *
	 * @param {RegExp|string} pattern - Pattern to match cache keys (string is converted to RegExp)
	 * @param {Object} [data={}] - Optional metadata about the invalidation
	 *
	 * @fires CacheEvents#invalidate:pattern
	 *
	 * @example
	 * // Invalidate all server configs
	 * cacheEvents.invalidatePattern(/^server:.*:config$/, { reason: 'global update' });
	 *
	 * @example
	 * // String pattern (converted to RegExp)
	 * cacheEvents.invalidatePattern('user:123:.*', { reason: 'user updated' });
	 */
	invalidatePattern (pattern, data = {}) {
		const start = process.hrtime.bigint();
		const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

		for (const key of this.handlers.keys()) {
			if (regex.test(key)) {
				this.invalidate(key, data);
			}
		}

		// Emit pattern invalidation event
		this.emit("invalidate:pattern", pattern, data);

		// Broadcast pattern to other instances if distributed cache is enabled
		if (distributedCacheEnabled && distributedCache && distributedCache.initialized) {
			distributedCache.invalidatePattern(pattern, data).catch(err => {
				logger.error(`CacheEvents: Distributed pattern invalidation failed`, { pattern }, err);
			});
		}

		// Record metrics
		if (metrics) {
			const duration = Number(process.hrtime.bigint() - start) / 1e9;
			const patternStr = typeof pattern === "string" ? pattern : pattern.source;
			metrics.recordCacheInvalidation(this._normalizeKeyPattern(patternStr), "pattern");
			metrics.metrics.cacheInvalidationDuration.observe({ invalidation_type: "pattern" }, duration);
		}
	}

	/**
	 * Normalize cache key patterns to avoid high cardinality metrics
	 * @private
	 */
	_normalizeKeyPattern (key) {
		return key
			.replace(/:\d+:/g, ":*:")
			.replace(/^[^:]+:\d+/, (match) => match.replace(/\d+/, "*"))
			.substring(0, 50);
	}

	/**
	 * Clear all registered cache invalidation handlers and event listeners.
	 * Use with caution as this removes all invalidation handlers.
	 *
	 * @example
	 * // Clear all handlers (useful for testing)
	 * cacheEvents.clearHandlers();
	 */
	clearHandlers () {
		this.handlers.clear();
		this.removeAllListeners();
	}

	/**
	 * Get statistics about registered handlers.
	 * Useful for monitoring and debugging cache invalidation setup.
	 *
	 * @returns {Object} Statistics object
	 * @returns {number} return.handlerCount - Number of unique cache keys with handlers
	 * @returns {number} return.totalHandlers - Total number of registered handlers
	 * @returns {number} return.listenerCount - Number of wildcard event listeners
	 *
	 * @example
	 * const stats = cacheEvents.getStats();
	 * console.log(`Monitoring ${stats.handlerCount} cache keys with ${stats.totalHandlers} handlers`);
	 */
	getStats () {
		return {
			handlerCount: this.handlers.size,
			totalHandlers: Array.from(this.handlers.values()).reduce((sum, arr) => sum + arr.length, 0),
			listenerCount: this.listenerCount("invalidate:*"),
		};
	}
}

/**
 * Singleton instance of CacheEvents for application-wide cache invalidation.
 * @type {CacheEvents}
 */
const cacheEvents = new CacheEvents();

/**
 * Helper function to create standardized cache key for server-specific data.
 *
 * @function serverCacheKey
 * @param {string} serverId - Discord server/guild ID
 * @param {string} type - Type of cached data (e.g., 'config', 'permissions', 'roles')
 * @returns {string} Formatted cache key in format 'server:${serverId}:${type}'
 *
 * @example
 * const key = serverCacheKey('123456789', 'config');
 * // Returns: 'server:123456789:config'
 */
const serverCacheKey = (serverId, type) => `server:${serverId}:${type}`;

/**
 * Helper function to create standardized cache key for user-specific data.
 *
 * @function userCacheKey
 * @param {string} userId - Discord user ID
 * @param {string} type - Type of cached data (e.g., 'profile', 'permissions', 'points')
 * @returns {string} Formatted cache key in format 'user:${userId}:${type}'
 *
 * @example
 * const key = userCacheKey('987654321', 'profile');
 * // Returns: 'user:987654321:profile'
 */
const userCacheKey = (userId, type) => `user:${userId}:${type}`;

/**
 * Helper function to create standardized cache key for extension-specific data.
 *
 * @function extensionCacheKey
 * @param {string} extensionId - Extension ID from database
 * @param {string} type - Type of cached data (e.g., 'code', 'config', 'stats')
 * @returns {string} Formatted cache key in format 'extension:${extensionId}:${type}'
 *
 * @example
 * const key = extensionCacheKey('ext_abc123', 'code');
 * // Returns: 'extension:ext_abc123:code'
 */
const extensionCacheKey = (extensionId, type) => `extension:${extensionId}:${type}`;

/**
 * Invalidate multiple server-related caches for a specific server.
 * Common types: 'config', 'permissions', 'roles', 'channels', 'members'
 *
 * @function invalidateServerCaches
 * @param {string} serverId - Discord server/guild ID
 * @param {string[]} [types=['config', 'permissions', 'roles']] - Array of cache types to invalidate
 *
 * @example
 * // Invalidate default server caches
 * invalidateServerCaches('123456789');
 *
 * @example
 * // Invalidate specific cache types
 * invalidateServerCaches('123456789', ['config', 'channels']);
 */
const invalidateServerCaches = (serverId, types = ["config", "permissions", "roles"]) => {
	types.forEach(type => {
		cacheEvents.invalidate(serverCacheKey(serverId, type), { serverId, type });
	});
};

/**
 * Invalidate multiple user-related caches for a specific user.
 * Common types: 'profile', 'permissions', 'points', 'settings', 'subscriptions'
 *
 * @function invalidateUserCaches
 * @param {string} userId - Discord user ID
 * @param {string[]} [types=['profile', 'permissions', 'points']] - Array of cache types to invalidate
 *
 * @example
 * // Invalidate default user caches
 * invalidateUserCaches('987654321');
 *
 * @example
 * // Invalidate after user profile update
 * invalidateUserCaches('987654321', ['profile', 'settings']);
 */
const invalidateUserCaches = (userId, types = ["profile", "permissions", "points"]) => {
	types.forEach(type => {
		cacheEvents.invalidate(userCacheKey(userId, type), { userId, type });
	});
};

/**
 * Invalidate multiple extension-related caches for a specific extension.
 * Common types: 'code', 'config', 'stats', 'permissions', 'installations'
 *
 * @function invalidateExtensionCaches
 * @param {string} extensionId - Extension ID from database
 * @param {string[]} [types=['code', 'config', 'stats']] - Array of cache types to invalidate
 *
 * @example
 * // Invalidate default extension caches
 * invalidateExtensionCaches('ext_abc123');
 *
 * @example
 * // Invalidate after code update
 * invalidateExtensionCaches('ext_abc123', ['code', 'stats']);
 */
const invalidateExtensionCaches = (extensionId, types = ["code", "config", "stats"]) => {
	types.forEach(type => {
		cacheEvents.invalidate(extensionCacheKey(extensionId, type), { extensionId, type });
	});
};

/**
 * Module exports
 * @exports Modules/CacheEvents
 */
module.exports = {
	/** Singleton CacheEvents instance */
	cacheEvents,
	/** Server cache key generator */
	serverCacheKey,
	/** User cache key generator */
	userCacheKey,
	/** Extension cache key generator */
	extensionCacheKey,
	/** Server cache invalidation helper */
	invalidateServerCaches,
	/** User cache invalidation helper */
	invalidateUserCaches,
	/** Extension cache invalidation helper */
	invalidateExtensionCaches,
};
