export = AnalyticsAggregator;
/**
 * AnalyticsAggregator - Aggregates and stores historical analytics data
 *
 * Runs daily to collect and store analytics snapshots for trend analysis.
 */
declare class AnalyticsAggregator {
    /**
     * Create a daily analytics snapshot for a server
     * @param {Object} serverDocument - Server document
     * @param {Object} guild - Discord guild
     * @returns {Object} Analytics snapshot for storage
     */
    static createDailySnapshot(serverDocument: any, guild: any): any;
    /**
     * Get analytics data for a date range
     * @param {string} serverId - Server ID
     * @param {number} days - Number of days to fetch
     * @returns {Promise<Array>} Array of daily snapshots
     */
    static getHistoricalData(serverId: string, days?: number): Promise<any[]>;
    /**
     * Calculate trends from historical data
     * @param {Array} historicalData - Array of daily snapshots
     * @returns {Object} Trend analysis
     */
    static calculateTrends(historicalData: any[]): any;
}
//# sourceMappingURL=AnalyticsAggregator.d.ts.map