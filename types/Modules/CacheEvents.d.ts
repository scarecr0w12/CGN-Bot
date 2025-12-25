/**
 * Singleton instance of CacheEvents for application-wide cache invalidation.
 * @type {CacheEvents}
 */
export const cacheEvents: CacheEvents;
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
export function serverCacheKey(serverId: string, type: string): string;
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
export function userCacheKey(userId: string, type: string): string;
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
export function extensionCacheKey(extensionId: string, type: string): string;
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
export function invalidateServerCaches(serverId: string, types?: string[]): void;
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
export function invalidateUserCaches(userId: string, types?: string[]): void;
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
export function invalidateExtensionCaches(extensionId: string, types?: string[]): void;
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
declare class CacheEvents extends EventEmitter<any> {
    /**
     * Creates a new CacheEvents instance.
     * Initializes the handlers map for storing registered invalidation handlers.
     *
     * @constructor
     */
    constructor();
    /**
     * Map of cache keys to their registered handler functions
     * @type {Map<string, Function[]>}
     * @private
     */
    private handlers;
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
    onInvalidate(cacheKey: string, handler: Function): void;
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
    invalidate(cacheKey: string, data?: {
        reason?: string;
        userId?: string;
        ?: any;
    }): void;
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
    invalidatePattern(pattern: RegExp | string, data?: any): void;
    /**
     * Clear all registered cache invalidation handlers and event listeners.
     * Use with caution as this removes all invalidation handlers.
     *
     * @example
     * // Clear all handlers (useful for testing)
     * cacheEvents.clearHandlers();
     */
    clearHandlers(): void;
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
    getStats(): any;
}
import EventEmitter = require("node:events");
export {};
//# sourceMappingURL=CacheEvents.d.ts.map