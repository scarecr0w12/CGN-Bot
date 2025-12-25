/**
 * Get creator status for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} Creator status
 */
export function getCreatorStatus(userId: string): Promise<any>;
/**
 * Set featured creator status
 * @param {string} userId - Target user ID
 * @param {boolean} isFeatured - Whether to feature or unfeature
 * @param {string} maintainerId - ID of maintainer making the change
 * @param {string} reason - Reason for featuring
 * @param {number} bonusShare - Bonus revenue share percentage (0-15)
 * @returns {Promise<Object>} Result
 */
export function setFeaturedStatus(userId: string, isFeatured: boolean, maintainerId: string, reason?: string, bonusShare?: number): Promise<any>;
/**
 * Update creator stats from their extensions
 * @param {string} userId - User ID to update
 * @returns {Promise<Object>} Updated stats
 */
export function updateCreatorStats(userId: string): Promise<any>;
/**
 * Calculate creator tier based on stats
 */
export function calculateTier(extensions: any, installs: any, rating: any): string;
/**
 * Check and award badges based on stats
 */
export function checkAndAwardBadges(userDocument: any, extensions: any, installs: any, rating: any): Promise<void>;
/**
 * Award a badge to a user
 */
export function awardBadge(userDocument: any, badgeId: any): Promise<boolean>;
/**
 * Get all featured creators
 * @param {number} limit - Max number to return
 * @returns {Promise<Array>} List of featured creators
 */
export function getFeaturedCreators(limit?: number): Promise<any[]>;
/**
 * Get effective revenue share for a creator
 * Base is 70%, featured creators get bonus
 */
export function getEffectiveRevenueShare(userId: any): Promise<number>;
/**
 * Get tier badge info
 */
export function getTierInfo(tier: any): any;
/**
 * Get all available badges info
 */
export function getBadgeInfo(): {
    first_extension: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    popular_10: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    popular_100: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    popular_500: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    highly_rated: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    prolific: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    featured: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    premium_seller: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
};
/**
 * Get tier thresholds
 */
export function getTierThresholds(): {
    bronze: {
        installs: number;
        extensions: number;
        rating: number;
    };
    silver: {
        installs: number;
        extensions: number;
        rating: number;
    };
    gold: {
        installs: number;
        extensions: number;
        rating: number;
    };
    platinum: {
        installs: number;
        extensions: number;
        rating: number;
    };
    diamond: {
        installs: number;
        extensions: number;
        rating: number;
    };
};
//# sourceMappingURL=CreatorManager.d.ts.map