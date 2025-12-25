/**
 * QueryLogger - Database query performance monitoring
 *
 * Tracks query execution times, logs slow queries, and provides
 * metrics for performance analysis.
 *
 * Usage:
 *   const QueryLogger = require('./Modules/QueryLogger');
 *   QueryLogger.startQuery('findOne', 'servers', { _id: serverId });
 *   // ... execute query ...
 *   QueryLogger.endQuery(queryId, rowCount);
 */

// Configuration
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS, 10) || 100;
const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING !== "false";
const LOG_ALL_QUERIES = process.env.LOG_ALL_QUERIES === "true";

// Metrics storage
const queryMetrics = {
	totalQueries: 0,
	slowQueries: 0,
	totalTime: 0,
	byOperation: new Map(),
	byTable: new Map(),
	recentSlowQueries: [],
};

// Active queries being timed
const activeQueries = new Map();
let queryIdCounter = 0;

/**
 * Start timing a database query
 * @param {string} operation Query operation (findOne, find, update, insert, delete)
 * @param {string} table Table/collection name
 * @param {Object} query Query parameters (sanitized for logging)
 * @returns {number} Query ID for tracking
 */
const startQuery = (operation, table, query = {}) => {
	if (!ENABLE_QUERY_LOGGING) return -1;

	const queryId = ++queryIdCounter;
	activeQueries.set(queryId, {
		operation,
		table,
		query: sanitizeQuery(query),
		startTime: process.hrtime.bigint(),
		startTimestamp: Date.now(),
	});

	return queryId;
};

/**
 * End timing a database query and record metrics
 * @param {number} queryId Query ID from startQuery
 * @param {number} rowCount Number of rows affected/returned
 * @returns {Object|null} Query stats or null if not found
 */
const endQuery = (queryId, rowCount = 0) => {
	if (!ENABLE_QUERY_LOGGING || queryId === -1) return null;

	const queryData = activeQueries.get(queryId);
	if (!queryData) return null;

	activeQueries.delete(queryId);

	const endTime = process.hrtime.bigint();
	const durationNs = Number(endTime - queryData.startTime);
	const durationMs = durationNs / 1000000;

	// Update global metrics
	queryMetrics.totalQueries++;
	queryMetrics.totalTime += durationMs;

	// Update per-operation metrics
	const opMetrics = queryMetrics.byOperation.get(queryData.operation) || { count: 0, totalTime: 0 };
	opMetrics.count++;
	opMetrics.totalTime += durationMs;
	queryMetrics.byOperation.set(queryData.operation, opMetrics);

	// Update per-table metrics
	const tableMetrics = queryMetrics.byTable.get(queryData.table) || { count: 0, totalTime: 0 };
	tableMetrics.count++;
	tableMetrics.totalTime += durationMs;
	queryMetrics.byTable.set(queryData.table, tableMetrics);

	const queryStats = {
		operation: queryData.operation,
		table: queryData.table,
		query: queryData.query,
		durationMs: Math.round(durationMs * 100) / 100,
		rowCount,
		timestamp: queryData.startTimestamp,
	};

	// Log slow queries
	if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
		queryMetrics.slowQueries++;
		queryMetrics.recentSlowQueries.push(queryStats);

		// Keep only last 100 slow queries
		if (queryMetrics.recentSlowQueries.length > 100) {
			queryMetrics.recentSlowQueries.shift();
		}

		logger.warn("Slow database query detected", {
			operation: queryData.operation,
			table: queryData.table,
			durationMs: queryStats.durationMs,
			rowCount,
		});
	} else if (LOG_ALL_QUERIES) {
		logger.debug("Database query", {
			operation: queryData.operation,
			table: queryData.table,
			durationMs: queryStats.durationMs,
			rowCount,
		});
	}

	return queryStats;
};

/**
 * Sanitize query object for safe logging (remove sensitive data)
 * @param {Object} query Raw query object
 * @returns {Object} Sanitized query
 */
const sanitizeQuery = (query) => {
	if (!query || typeof query !== "object") return {};

	const sanitized = {};
	const sensitiveKeys = ["password", "token", "secret", "key", "auth", "credential"];

	for (const [key, value] of Object.entries(query)) {
		const lowerKey = key.toLowerCase();
		if (sensitiveKeys.some(s => lowerKey.includes(s))) {
			sanitized[key] = "[REDACTED]";
		} else if (typeof value === "object" && value !== null) {
			sanitized[key] = Array.isArray(value) ? `[Array(${value.length})]` : "[Object]";
		} else {
			sanitized[key] = value;
		}
	}

	return sanitized;
};

/**
 * Get current query metrics
 * @returns {Object} Metrics summary
 */
const getMetrics = () => {
	const slowPct = queryMetrics.totalQueries > 0 ?
		Math.round((queryMetrics.slowQueries / queryMetrics.totalQueries) * 10000) / 100 : 0;
	const avgTime = queryMetrics.totalQueries > 0 ?
		Math.round((queryMetrics.totalTime / queryMetrics.totalQueries) * 100) / 100 : 0;

	return {
		enabled: ENABLE_QUERY_LOGGING,
		slowQueryThresholdMs: SLOW_QUERY_THRESHOLD_MS,
		totalQueries: queryMetrics.totalQueries,
		slowQueries: queryMetrics.slowQueries,
		slowQueryPercentage: slowPct,
		averageQueryTimeMs: avgTime,
		byOperation: Object.fromEntries(
			Array.from(queryMetrics.byOperation.entries()).map(([op, data]) => [
				op,
				{
					count: data.count,
					avgTimeMs: Math.round((data.totalTime / data.count) * 100) / 100,
				},
			]),
		),
		byTable: Object.fromEntries(
			Array.from(queryMetrics.byTable.entries()).map(([table, data]) => [
				table,
				{
					count: data.count,
					avgTimeMs: Math.round((data.totalTime / data.count) * 100) / 100,
				},
			]),
		),
		activeQueries: activeQueries.size,
	};
};

/**
 * Get recent slow queries
 * @param {number} limit Maximum number to return
 * @returns {Array} Recent slow queries
 */
const getSlowQueries = (limit = 20) => queryMetrics.recentSlowQueries.slice(-limit);

/**
 * Reset all metrics (useful for testing or periodic resets)
 */
const resetMetrics = () => {
	queryMetrics.totalQueries = 0;
	queryMetrics.slowQueries = 0;
	queryMetrics.totalTime = 0;
	queryMetrics.byOperation.clear();
	queryMetrics.byTable.clear();
	queryMetrics.recentSlowQueries = [];
	activeQueries.clear();
	logger.info("QueryLogger: Metrics reset");
};

/**
 * Wrapper to time an async database operation
 * @param {string} operation Operation name
 * @param {string} table Table name
 * @param {Object} query Query parameters
 * @param {Function} fn Async function to execute
 * @returns {Promise<*>} Result of the function
 */
const timeQuery = async (operation, table, query, fn) => {
	const queryId = startQuery(operation, table, query);
	try {
		const result = await fn();
		const rowCount = Array.isArray(result) ? result.length : result ? 1 : 0;
		endQuery(queryId, rowCount);
		return result;
	} catch (err) {
		endQuery(queryId, 0);
		throw err;
	}
};

module.exports = {
	startQuery,
	endQuery,
	getMetrics,
	getSlowQueries,
	resetMetrics,
	timeQuery,
	sanitizeQuery,

	// Configuration getters
	isEnabled: () => ENABLE_QUERY_LOGGING,
	getSlowQueryThreshold: () => SLOW_QUERY_THRESHOLD_MS,
};
