/**
 * Generate a unique referral code for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<string>} The generated or existing referral code
 */
export function generateReferralCode(userId: string): Promise<string>;
/**
 * Get referral code for a user (generates one if not exists)
 * @param {string} userId - Discord user ID
 * @returns {Promise<string>} The referral code
 */
export function getReferralCode(userId: string): Promise<string>;
/**
 * Find user by referral code
 * @param {string} code - Referral code
 * @returns {Promise<Object|null>} User document or null
 */
export function findUserByReferralCode(code: string): Promise<any | null>;
/**
 * Process a server joining via referral link
 * @param {Object} guild - Discord guild object
 * @param {string} referralCode - The referral code used
 * @returns {Promise<Object>} Result of the referral processing
 */
export function processReferral(guild: any, referralCode: string): Promise<any>;
/**
 * Award retention bonus to referrer if server is still active after 7 days
 * Should be called by a scheduled job
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object>} Result of the bonus processing
 */
export function processRetentionBonus(guildId: string): Promise<any>;
/**
 * Get referral stats for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} Referral statistics
 */
export function getReferralStats(userId: string): Promise<any>;
/**
 * Build referral invite URL
 * @param {string} code - Referral code
 * @param {string} clientId - Bot client ID
 * @returns {string} Full referral invite URL
 */
export function buildReferralUrl(code: string): string;
/**
 * Get reward configuration
 * @returns {Object} Reward amounts
 */
export function getRewardConfig(): any;
//# sourceMappingURL=ReferralManager.d.ts.map