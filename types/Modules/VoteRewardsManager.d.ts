/**
 * Get vote rewards settings with caching
 */
export function getSettings(): Promise<any>;
/**
 * Invalidate settings cache
 */
export function invalidateCache(): void;
/**
 * Get user's vote rewards data
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export function getUserVoteRewards(userId: string): Promise<any>;
/**
 * Get user's vote rewards balance
 * @param {string} userId
 * @returns {Promise<number>}
 */
export function getBalance(userId: string): Promise<number>;
/**
 * Add points to user's vote rewards balance
 * @param {string} userId
 * @param {number} amount - Points to add
 * @param {string} type - Transaction type
 * @param {Object} metadata - Additional transaction metadata
 * @returns {Promise<Object>} Transaction record
 */
export function addPoints(userId: string, amount: number, type: string, metadata?: any): Promise<any>;
/**
 * Deduct points from user's vote rewards balance
 * @param {string} userId
 * @param {number} amount - Points to deduct
 * @param {string} type - Transaction type
 * @param {Object} metadata - Additional transaction metadata
 * @returns {Promise<Object>} Transaction record
 */
export function deductPoints(userId: string, amount: number, type: string, metadata?: any): Promise<any>;
/**
 * Process a vote and award points
 * @param {string} userId
 * @param {string} site - Vote site (topgg, discordbotlist)
 * @param {boolean} isWeekend - Whether it's a weekend (bonus points)
 * @returns {Promise<Object>}
 */
export function processVote(userId: string, site: string, isWeekend?: boolean): Promise<any>;
/**
 * Check if user can vote on a site (cooldown check)
 * @param {string} userId
 * @param {string} site
 * @returns {Promise<Object>}
 */
export function canVote(userId: string, site: string): Promise<any>;
/**
 * Redeem points for a premium tier on a server
 * @param {string} userId - User redeeming points
 * @param {string} serverId - Server to apply tier to
 * @param {string} tierId - Tier to purchase
 * @param {number} durationDays - Duration in days
 * @returns {Promise<Object>}
 */
export function redeemForTier(userId: string, serverId: string, tierId: string, durationDays: number): Promise<any>;
/**
 * Redeem points for a premium extension
 * @param {string} userId - User redeeming points
 * @param {string} extensionId - Extension to purchase
 * @returns {Promise<Object>}
 */
export function redeemForExtension(userId: string, extensionId: string): Promise<any>;
/**
 * Check if user has purchased a premium extension
 * @param {string} userId
 * @param {string} extensionId
 * @returns {Promise<boolean>}
 */
export function hasUserPurchasedExtension(userId: string, extensionId: string): Promise<boolean>;
/**
 * Purchase points with money (creates pending transaction, completed by webhook)
 * @param {string} userId
 * @param {number} amount - Dollar amount
 * @returns {Promise<Object>} Points that will be awarded
 */
export function calculatePointsForPurchase(amount: number): Promise<any>;
/**
 * Complete a point purchase (called after payment confirmed)
 * @param {string} userId
 * @param {number} pointsAmount
 * @param {string} provider - Payment provider
 * @param {string} paymentId - Payment ID from provider
 * @param {number} amountPaid - Dollar amount paid
 * @param {string} currency - Currency code
 * @returns {Promise<Object>}
 */
export function completePurchase(userId: string, pointsAmount: number, provider: string, paymentId: string, amountPaid: number, currency?: string): Promise<any>;
/**
 * Admin grant points to user
 * @param {string} userId
 * @param {number} amount
 * @param {string} adminId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export function adminGrantPoints(userId: string, amount: number, adminId: string, reason?: string): Promise<any>;
/**
 * Admin revoke points from user
 * @param {string} userId
 * @param {number} amount
 * @param {string} adminId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export function adminRevokePoints(userId: string, amount: number, adminId: string, reason?: string): Promise<any>;
/**
 * Get user's transaction history
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export function getTransactionHistory(userId: string, limit?: number): Promise<any[]>;
/**
 * Get vote sites configuration for display
 * @returns {Promise<Array>}
 */
export function getVoteSites(): Promise<any[]>;
/**
 * Get leaderboard of top vote reward earners
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export function getLeaderboard(limit?: number): Promise<any[]>;
//# sourceMappingURL=VoteRewardsManager.d.ts.map