/**
 * Analytics Module - Advanced server analytics for premium servers
 *
 * Provides:
 * - Member activity tracking and statistics
 * - Channel activity analysis
 * - Role engagement metrics
 * - Join/leave analytics
 * - Command usage statistics
 * - Activity heatmaps
 * - CSV/JSON export capabilities
 *
 * Tier-gated: Requires Tier 2 (Premium) subscription
 */

const AnalyticsCollector = require("./AnalyticsCollector");
const AnalyticsAggregator = require("./AnalyticsAggregator");
const AnalyticsExporter = require("./AnalyticsExporter");

module.exports = {
	AnalyticsCollector,
	AnalyticsAggregator,
	AnalyticsExporter,
};
