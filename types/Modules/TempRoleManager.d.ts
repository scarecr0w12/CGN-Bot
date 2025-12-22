export = TempRoleManager;
/**
 * TempRoleManager - Manages temporary role assignments and expiry
 */
declare class TempRoleManager {
    constructor(client: any);
    client: any;
    checkInterval: NodeJS.Timeout;
    CHECK_INTERVAL_MS: number;
    /**
     * Start the temp role expiry checker
     */
    start(): void;
    /**
     * Stop the temp role expiry checker
     */
    stop(): void;
    /**
     * Check for and remove expired temporary roles
     */
    checkExpiredRoles(): Promise<void>;
    /**
     * Remove an expired temporary role
     * @param {Object} tempRole - Temp role document
     */
    removeExpiredRole(tempRole: any): Promise<void>;
    /**
     * Get all active temp roles for a guild
     * @param {string} guildId - Guild ID
     * @returns {Promise<Array>}
     */
    getGuildTempRoles(guildId: string): Promise<any[]>;
    /**
     * Get all temp roles for a user in a guild
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    getUserTempRoles(guildId: string, userId: string): Promise<any[]>;
    /**
     * Extend a temp role's expiry
     * @param {string} tempRoleId - Temp role document ID
     * @param {number} additionalMs - Additional milliseconds to add
     * @returns {Promise<Object>}
     */
    extendTempRole(tempRoleId: string, additionalMs: number): Promise<any>;
}
//# sourceMappingURL=TempRoleManager.d.ts.map