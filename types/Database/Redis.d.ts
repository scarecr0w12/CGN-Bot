/**
 * Create and connect the main Redis client
 * @returns {Promise<Redis>} Connected Redis client
 */
export function createClient(): Promise<any>;
/**
 * Get the existing Redis client (does not create new connection)
 * @returns {Redis|null} Redis client or null if not connected
 */
export function getClient(): any | null;
/**
 * Create a separate Redis client for pub/sub subscriptions
 * @returns {Promise<Redis>} Subscriber Redis client
 */
export function getSubscriber(): Promise<any>;
/**
 * Gracefully disconnect all Redis clients
 */
export function disconnect(): Promise<void>;
/**
 * Check if Redis is configured (has host set in environment AND ioredis is available)
 * @returns {boolean} True if Redis is configured and available
 */
export function isEnabled(): boolean;
/**
 * Check if Redis client is connected and ready
 * @returns {boolean} True if client is ready
 */
export function isReady(): boolean;
/**
 * Ping Redis to check connectivity
 * @returns {Promise<boolean>} True if Redis responds
 */
export function ping(): Promise<boolean>;
/**
 * Get Redis connection info for monitoring
 * @returns {Object} Connection status info
 */
export function getInfo(): any;
//# sourceMappingURL=Redis.d.ts.map