export = RateLimiter;
declare class RateLimiter {
    _useRedis: boolean;
    _cooldowns: Map<any, any>;
    _userRates: Map<any, any>;
    _channelRates: Map<any, any>;
    _cleanupInterval: NodeJS.Timeout;
    /**
     * Check if user is on cooldown
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID
     * @param {number} cooldownSec - Cooldown duration in seconds
     * @returns {Promise<string|null>} Error message if on cooldown, null if allowed
     */
    checkCooldown(guildId: string, userId: string, cooldownSec: number): Promise<string | null>;
    /**
     * Check per-user rate limit
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID
     * @param {number} perMinute - Max requests per minute
     * @returns {Promise<string|null>} Error message if rate limited, null if allowed
     */
    checkUserRate(guildId: string, userId: string, perMinute: number): Promise<string | null>;
    /**
     * Check per-channel rate limit
     * @param {string} guildId - The guild ID
     * @param {string} channelId - The channel ID
     * @param {number} perMinute - Max requests per minute
     * @returns {Promise<string|null>} Error message if rate limited, null if allowed
     */
    checkChannelRate(guildId: string, channelId: string, perMinute: number): Promise<string | null>;
    /**
     * Record usage for rate limiting
     * @param {string} guildId - The guild ID
     * @param {string} userId - The user ID
     * @param {string} channelId - The channel ID
     * @returns {Promise<void>}
     */
    recordUsage(guildId: string, userId: string, channelId: string): Promise<void>;
    /**
     * Check if user has bypass role
     * @param {Object} member - Discord guild member
     * @param {Array} bypassRoles - Array of role IDs that bypass rate limits
     * @returns {boolean} True if user can bypass
     */
    hasBypassRole(member: any, bypassRoles: any[]): boolean;
    /**
     * Cleanup old entries
     * @private
     */
    private _cleanup;
    /**
     * Destroy the rate limiter (cleanup interval)
     */
    destroy(): void;
}
//# sourceMappingURL=RateLimiter.d.ts.map