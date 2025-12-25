export = AnalyticsCollector;
declare class AnalyticsCollector {
    /**
     * Get member activity statistics for a server
     * @param {Object} serverDocument - Server document from database
     * @param {Object} guild - Discord guild object
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Member activity stats
     */
    static getMemberActivity(serverDocument: any, guild: any, options?: any): Promise<any>;
    /**
     * Get channel activity statistics
     * @param {Object} serverDocument - Server document
     * @param {Object} guild - Discord guild
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Channel activity stats
     */
    static getChannelActivity(serverDocument: any, guild: any, options?: any): Promise<any>;
    /**
     * Get role engagement statistics
     * @param {Object} serverDocument - Server document
     * @param {Object} guild - Discord guild
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Role engagement stats
     */
    static getRoleEngagement(serverDocument: any, guild: any, options?: any): Promise<any>;
    /**
     * Get join/leave analytics
     * @param {Object} serverDocument - Server document
     * @param {Object} guild - Discord guild
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Join/leave stats
     */
    static getJoinLeaveAnalytics(serverDocument: any, guild: any, options?: any): Promise<any>;
    /**
     * Get command usage statistics
     * @param {Object} serverDocument - Server document
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Command usage stats
     */
    static getCommandStats(serverDocument: any, options?: any): Promise<any>;
    /**
     * Generate activity heatmap data
     * @param {Object} serverDocument - Server document
     * @param {Object} analyticsData - Historical analytics data
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Heatmap data
     */
    static getActivityHeatmap(serverDocument: any, analyticsData?: any): Promise<any>;
    /**
     * Check if server has analytics access
     * @param {string} serverId - Server ID
     * @returns {Promise<boolean>}
     */
    static hasAccess(serverId: string): Promise<boolean>;
}
//# sourceMappingURL=AnalyticsCollector.d.ts.map