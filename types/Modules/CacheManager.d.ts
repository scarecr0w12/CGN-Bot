/**
 * Get item from cache (Redis or memory fallback)
 * @param {string} key Cache key
 * @param {number} ttl TTL for memory cache check
 * @returns {Promise<Object|null>}
 */
export function getFromCache(key: string, ttl: number): Promise<any | null>;
/**
 * Set item in cache (Redis and memory)
 * @param {string} key Cache key
 * @param {Object} value Value to cache
 * @param {number} ttl TTL in seconds
 */
export function setInCache(key: string, value: any, ttl: number): Promise<void>;
/**
 * Invalidate cache entry
 * @param {string} key Cache key
 */
export function invalidate(key: string): Promise<void>;
/**
 * Invalidate cache entries by pattern
 * @param {string} pattern Key pattern (e.g., "cache:server:*")
 */
export function invalidatePattern(pattern: string): Promise<void>;
/**
 * Get server document with caching
 * @param {string} serverId Discord server/guild ID
 * @param {boolean} [skipCache=false] Skip cache and fetch fresh
 * @returns {Promise<Document|null>}
 */
export function getServer(serverId: string, skipCache?: boolean): Promise<Document | null>;
/**
 * Get user document with caching
 * @param {string} userId Discord user ID
 * @param {boolean} [skipCache=false] Skip cache and fetch fresh
 * @returns {Promise<Document|null>}
 */
export function getUser(userId: string, skipCache?: boolean): Promise<Document | null>;
/**
 * Get extension document with caching
 * @param {string} extensionId Extension ID
 * @param {boolean} [skipCache=false] Skip cache and fetch fresh
 * @returns {Promise<Document|null>}
 */
export function getExtension(extensionId: string, skipCache?: boolean): Promise<Document | null>;
/**
 * Invalidate server cache after update
 * @param {string} serverId Discord server/guild ID
 */
export function invalidateServer(serverId: string): Promise<void>;
/**
 * Invalidate user cache after update
 * @param {string} userId Discord user ID
 */
export function invalidateUser(userId: string): Promise<void>;
/**
 * Invalidate extension cache after update
 * @param {string} extensionId Extension ID
 */
export function invalidateExtension(extensionId: string): Promise<void>;
/**
 * Clear all caches
 */
export function clearAll(): Promise<void>;
/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getStats(): any;
/**
 * Warm up cache by preloading frequently accessed servers
 * @param {string[]} serverIds Array of server IDs to preload
 */
export function warmUpServers(serverIds: string[]): Promise<void>;
/**
 * Check if Redis caching is available
 * @returns {boolean}
 */
export function isRedisAvailable(): boolean;
export namespace TTL {
    let SERVER: number;
    let USER: number;
    let EXTENSION: number;
    let GALLERY: number;
}
export namespace KEYS {
    let SERVER_1: string;
    export { SERVER_1 as SERVER };
    let USER_1: string;
    export { USER_1 as USER };
    let EXTENSION_1: string;
    export { EXTENSION_1 as EXTENSION };
    let GALLERY_1: string;
    export { GALLERY_1 as GALLERY };
}
//# sourceMappingURL=CacheManager.d.ts.map