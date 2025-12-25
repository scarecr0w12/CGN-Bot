/**
 * Invalidate the settings cache (call after updates)
 */
export function invalidateCache(): Promise<void>;
/**
 * Get site settings with caching (Redis > in-memory > database)
 * @returns {Promise<Object>}
 */
export function getSiteSettings(): Promise<any>;
/**
 * Get all configured tiers
 * @returns {Promise<Array>}
 */
export function getTiers(): Promise<any[]>;
/**
 * Get a specific tier by ID
 * @param {string} tierId
 * @returns {Promise<Object|null>}
 */
export function getTier(tierId: string): Promise<any | null>;
/**
 * Get the default tier (usually "free")
 * @returns {Promise<Object|null>}
 */
export function getDefaultTier(): Promise<any | null>;
/**
 * Get all configured features
 * @returns {Promise<Array>}
 */
export function getFeatures(): Promise<any[]>;
/**
 * Get a specific feature by ID
 * @param {string} featureId
 * @returns {Promise<Object|null>}
 */
export function getFeature(featureId: string): Promise<any | null>;
/**
 * Get server's current tier
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<Object>}
 */
export function getServerTier(serverId: string): Promise<any>;
/**
 * Get server's effective features (tier features + granted - revoked)
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<Set<string>>}
 */
export function getServerFeatures(serverId: string): Promise<Set<string>>;
/**
 * Get server's subscription data
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<Object|null>}
 */
export function getServerSubscription(serverId: string): Promise<any | null>;
/**
 * Check if a server can access a specific feature
 * @param {string} serverId - Discord server/guild ID
 * @param {string} featureKey - Feature ID to check
 * @returns {Promise<boolean>}
 */
export function canAccess(serverId: string, featureKey: string): Promise<boolean>;
/**
 * Check if server has at least a certain tier level
 * @param {string} serverId - Discord server/guild ID
 * @param {number} requiredLevel - Minimum tier level required
 * @returns {Promise<boolean>}
 */
export function hasMinimumTierLevel(serverId: string, requiredLevel: number): Promise<boolean>;
/**
 * Set server's tier
 * @param {string} serverId - Discord server/guild ID
 * @param {string} tierId - Tier ID to assign
 * @param {string} source - Source of assignment ('manual', 'stripe', etc.)
 * @param {Date|null} expiresAt - Expiration date (null for lifetime)
 * @param {string} reason - Reason for change
 * @param {string|null} purchasedBy - User ID who purchased this subscription
 * @returns {Promise<Object>}
 */
export function setServerTier(serverId: string, tierId: string, source?: string, expiresAt?: Date | null, reason?: string, purchasedBy?: string | null): Promise<any>;
/**
 * Grant a specific feature to a server
 * @param {string} serverId - Discord server/guild ID
 * @param {string} featureKey - Feature ID to grant
 * @returns {Promise<Object>}
 */
export function grantFeature(serverId: string, featureKey: string): Promise<any>;
/**
 * Revoke a specific feature from a server
 * @param {string} serverId - Discord server/guild ID
 * @param {string} featureKey - Feature ID to revoke
 * @returns {Promise<Object>}
 */
export function revokeFeature(serverId: string, featureKey: string): Promise<any>;
/**
 * Check and handle expired subscriptions for a server
 * @param {string} serverId - Discord server/guild ID
 * @returns {Promise<boolean>} - True if subscription was expired
 */
export function checkExpiration(serverId: string): Promise<boolean>;
/**
 * Cancel server's subscription
 * @param {string} serverId - Discord server/guild ID
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<Object>}
 */
export function cancelSubscription(serverId: string, reason?: string): Promise<any>;
/**
 * Get OAuth provider configuration
 * @param {string} provider - Provider name ('google', 'github', 'twitch', 'patreon')
 * @returns {Promise<Object|null>}
 */
export function getOAuthProvider(provider: string): Promise<any | null>;
/**
 * Get payment provider configuration
 * @param {string} provider - Provider name ('stripe', 'paypal', 'btcpay')
 * @returns {Promise<Object|null>}
 */
export function getPaymentProvider(provider: string): Promise<any | null>;
/**
 * Find tier by payment product/plan ID
 * @param {string} provider - Provider name
 * @param {string} productId - Product or plan ID from provider
 * @returns {Promise<Object|null>}
 */
export function getTierByPaymentProduct(provider: string, productId: string): Promise<any | null>;
/**
 * Link a server's payment customer ID
 * @param {string} serverId - Discord server/guild ID
 * @param {string} provider - Payment provider
 * @param {string} customerId - Customer ID from provider
 * @returns {Promise<Object>}
 */
export function linkPaymentCustomer(serverId: string, provider: string, customerId: string): Promise<any>;
/**
 * Find server by payment customer ID
 * @param {string} provider - Payment provider
 * @param {string} customerId - Customer ID from provider
 * @returns {Promise<Object|null>}
 */
export function findServerByPaymentCustomer(provider: string, customerId: string): Promise<any | null>;
/**
 * @deprecated Use getServerTier instead - premium is now per-server, not per-user.
 * This function is kept for backward compatibility but will be removed in a future version.
 * Migration: Replace getUserTier(userId) with getServerTier(serverId)
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} User's tier (defaults to free tier)
 */
export function getUserTier(userId: string): Promise<any>;
/**
 * @deprecated Use getServerFeatures instead - premium is now per-server, not per-user.
 * This function is kept for backward compatibility but will be removed in a future version.
 * Migration: Replace getUserFeatures(userId) with getServerFeatures(serverId)
 * @param {string} userId - Discord user ID
 * @returns {Promise<Set<string>>} User's available features
 */
export function getUserFeatures(userId: string): Promise<Set<string>>;
/**
 * @deprecated Use getServerSubscription instead - premium is per-server
 */
export function getUserSubscription(userId: any): Promise<any>;
/**
 * @deprecated Use setServerTier instead - premium is now per-server, not per-user.
 * This function is kept for backward compatibility but will be removed in a future version.
 * Migration: Replace setUserTier(userId, ...) with setServerTier(serverId, ...)
 * @param {string} userId - Discord user ID
 * @param {string} tierId - Tier ID to assign
 * @param {string} source - Source of the assignment
 * @param {Date|null} expiresAt - Expiration date
 * @param {string} reason - Reason for assignment
 * @returns {Promise<Object>} Updated user document
 */
export function setUserTier(userId: string, tierId: string, source?: string, expiresAt?: Date | null, reason?: string): Promise<any>;
//# sourceMappingURL=TierManager.d.ts.map