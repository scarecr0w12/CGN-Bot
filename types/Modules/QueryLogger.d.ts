/**
 * Start timing a database query
 * @param {string} operation Query operation (findOne, find, update, insert, delete)
 * @param {string} table Table/collection name
 * @param {Object} query Query parameters (sanitized for logging)
 * @returns {number} Query ID for tracking
 */
export function startQuery(operation: string, table: string, query?: any): number;
/**
 * End timing a database query and record metrics
 * @param {number} queryId Query ID from startQuery
 * @param {number} rowCount Number of rows affected/returned
 * @returns {Object|null} Query stats or null if not found
 */
export function endQuery(queryId: number, rowCount?: number): any | null;
/**
 * Get current query metrics
 * @returns {Object} Metrics summary
 */
export function getMetrics(): any;
/**
 * Get recent slow queries
 * @param {number} limit Maximum number to return
 * @returns {Array} Recent slow queries
 */
export function getSlowQueries(limit?: number): any[];
/**
 * Reset all metrics (useful for testing or periodic resets)
 */
export function resetMetrics(): void;
/**
 * Wrapper to time an async database operation
 * @param {string} operation Operation name
 * @param {string} table Table name
 * @param {Object} query Query parameters
 * @param {Function} fn Async function to execute
 * @returns {Promise<*>} Result of the function
 */
export function timeQuery(operation: string, table: string, query: any, fn: Function): Promise<any>;
/**
 * Sanitize query object for safe logging (remove sensitive data)
 * @param {Object} query Raw query object
 * @returns {Object} Sanitized query
 */
export function sanitizeQuery(query: any): any;
export declare function isEnabled(): boolean;
export declare function getSlowQueryThreshold(): number;
//# sourceMappingURL=QueryLogger.d.ts.map