export = AnalyticsExporter;
/**
 * AnalyticsExporter - Exports analytics data to various formats
 *
 * Supports CSV and JSON export for:
 * - Member activity data
 * - Channel statistics
 * - Command usage
 * - Role engagement
 */
declare class AnalyticsExporter {
    /**
     * Export data to CSV format
     * @param {Array} data - Array of objects to export
     * @param {Array} columns - Column definitions [{key, label}]
     * @returns {string} CSV formatted string
     */
    static toCSV(data: any[], columns: any[]): string;
    /**
     * Export member activity to CSV
     * @param {Object} memberData - Member activity data from collector
     * @returns {string} CSV string
     */
    static exportMemberActivity(memberData: any): string;
    /**
     * Export channel activity to CSV
     * @param {Object} channelData - Channel activity data from collector
     * @returns {string} CSV string
     */
    static exportChannelActivity(channelData: any): string;
    /**
     * Export command stats to CSV
     * @param {Object} commandData - Command stats from collector
     * @returns {string} CSV string
     */
    static exportCommandStats(commandData: any): string;
    /**
     * Export role engagement to CSV
     * @param {Object} roleData - Role engagement data from collector
     * @returns {string} CSV string
     */
    static exportRoleEngagement(roleData: any): string;
    /**
     * Export join/leave analytics to CSV
     * @param {Object} joinLeaveData - Join/leave data from collector
     * @returns {string} CSV string
     */
    static exportJoinLeave(joinLeaveData: any): string;
    /**
     * Generate comprehensive server analytics report
     * @param {Object} allData - Object containing all analytics data
     * @returns {Object} Report with multiple CSV exports
     */
    static generateFullReport(allData: any): any;
    /**
     * Export to JSON with metadata
     * @param {Object} data - Analytics data
     * @param {string} type - Type of analytics
     * @returns {string} JSON string
     */
    static toJSON(data: any, type: string): string;
}
//# sourceMappingURL=AnalyticsExporter.d.ts.map