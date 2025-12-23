/**
 * Prometheus Metrics Module
 * Collects and exposes application metrics for monitoring
 */

const client = require("prom-client");

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
	register,
	prefix: "skynetbot_",
});

// ============================================
// HTTP Request Metrics
// ============================================

const httpRequestDuration = new client.Histogram({
	name: "skynetbot_http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
	registers: [register],
});

const httpRequestsTotal = new client.Counter({
	name: "skynetbot_http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status_code"],
	registers: [register],
});

const httpActiveRequests = new client.Gauge({
	name: "skynetbot_http_active_requests",
	help: "Number of active HTTP requests",
	registers: [register],
});

// ============================================
// Discord Bot Metrics
// ============================================

const discordGuildsTotal = new client.Gauge({
	name: "skynetbot_discord_guilds_total",
	help: "Total number of Discord guilds (servers)",
	registers: [register],
});

const discordUsersTotal = new client.Gauge({
	name: "skynetbot_discord_users_total",
	help: "Total number of Discord users",
	registers: [register],
});

const discordShardsTotal = new client.Gauge({
	name: "skynetbot_discord_shards_total",
	help: "Total number of Discord shards",
	registers: [register],
});

const discordShardStatus = new client.Gauge({
	name: "skynetbot_discord_shard_status",
	help: "Status of each Discord shard (0=disconnected, 1=connected)",
	labelNames: ["shard_id"],
	registers: [register],
});

const discordShardLatency = new client.Gauge({
	name: "skynetbot_discord_shard_latency_ms",
	help: "Latency of each Discord shard in milliseconds",
	labelNames: ["shard_id"],
	registers: [register],
});

const discordShardFailures = new client.Gauge({
	name: "skynetbot_discord_shard_failures_total",
	help: "Total restart failures for each Discord shard",
	labelNames: ["shard_id"],
	registers: [register],
});

const discordShardRestarts = new client.Counter({
	name: "skynetbot_discord_shard_restarts_total",
	help: "Total number of shard restarts",
	labelNames: ["shard_id"],
	registers: [register],
});

const discordShardHeartbeatLatency = new client.Gauge({
	name: "skynetbot_discord_shard_heartbeat_latency_ms",
	help: "Heartbeat latency for each Discord shard in milliseconds",
	labelNames: ["shard_id"],
	registers: [register],
});

const discordShardMemory = new client.Gauge({
	name: "skynetbot_discord_shard_memory_mb",
	help: "Memory usage (RSS) of each Discord shard in megabytes",
	labelNames: ["shard_id"],
	registers: [register],
});

const discordCommandsTotal = new client.Counter({
	name: "skynetbot_discord_commands_total",
	help: "Total number of Discord commands executed",
	labelNames: ["command", "type"],
	registers: [register],
});

const discordMessagesTotal = new client.Counter({
	name: "skynetbot_discord_messages_total",
	help: "Total number of Discord messages processed",
	labelNames: ["type"],
	registers: [register],
});

const discordEventsTotal = new client.Counter({
	name: "skynetbot_discord_events_total",
	help: "Total number of Discord gateway events",
	labelNames: ["event"],
	registers: [register],
});

// ============================================
// Database Metrics
// ============================================

const dbQueryDuration = new client.Histogram({
	name: "skynetbot_db_query_duration_seconds",
	help: "Duration of database queries in seconds",
	labelNames: ["operation", "collection"],
	buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
	registers: [register],
});

const dbQueriesTotal = new client.Counter({
	name: "skynetbot_db_queries_total",
	help: "Total number of database queries",
	labelNames: ["operation", "collection", "status"],
	registers: [register],
});

// ============================================
// Extension System Metrics
// ============================================

const extensionsTotal = new client.Gauge({
	name: "skynetbot_extensions_total",
	help: "Total number of extensions",
	labelNames: ["state"],
	registers: [register],
});

const extensionExecutionsTotal = new client.Counter({
	name: "skynetbot_extension_executions_total",
	help: "Total number of extension executions",
	labelNames: ["extension_id", "status"],
	registers: [register],
});

// Batch write metrics
const batchWritesQueued = new client.Counter({
	name: "skynetbot_batch_writes_queued_total",
	help: "Total number of database writes queued for batching",
	registers: [register],
});

const batchWritesFlushed = new client.Counter({
	name: "skynetbot_batch_writes_flushed_total",
	help: "Total number of database writes flushed from batch queue",
	registers: [register],
});

const batchWritesMerged = new client.Counter({
	name: "skynetbot_batch_writes_merged_total",
	help: "Total number of duplicate writes merged in batch queue",
	registers: [register],
});

const batchWriteErrors = new client.Counter({
	name: "skynetbot_batch_write_errors_total",
	help: "Total number of errors during batch write operations",
	registers: [register],
});

const batchQueueSize = new client.Gauge({
	name: "skynetbot_batch_queue_size",
	help: "Current number of documents in batch write queue",
	registers: [register],
});

// ============================================
// WebSocket Metrics
// ============================================

const wsConnectionsActive = new client.Gauge({
	name: "skynetbot_ws_connections_active",
	help: "Number of active WebSocket connections",
	labelNames: ["namespace"],
	registers: [register],
});

// ============================================
// Cache Events Metrics (Phase 2)
// ============================================

const cacheInvalidationsTotal = new client.Counter({
	name: "skynetbot_cache_invalidations_total",
	help: "Total number of cache invalidations",
	labelNames: ["cache_key_pattern", "invalidation_type"],
	registers: [register],
});

const cacheHandlersTotal = new client.Gauge({
	name: "skynetbot_cache_handlers_total",
	help: "Number of registered cache invalidation handlers",
	registers: [register],
});

const cacheInvalidationDuration = new client.Histogram({
	name: "skynetbot_cache_invalidation_duration_seconds",
	help: "Duration of cache invalidation operations",
	labelNames: ["invalidation_type"],
	buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
	registers: [register],
});

// ============================================
// Command Executor Metrics (Phase 2)
// ============================================

const commandExecutionDuration = new client.Histogram({
	name: "skynetbot_command_execution_duration_seconds",
	help: "Duration of command execution including validation",
	labelNames: ["command", "type", "status"],
	buckets: [0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
	registers: [register],
});

const commandValidationDuration = new client.Histogram({
	name: "skynetbot_command_validation_duration_seconds",
	help: "Duration of command validation operations",
	labelNames: ["validation_type"],
	buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05],
	registers: [register],
});

const commandCooldownsActive = new client.Gauge({
	name: "skynetbot_command_cooldowns_active",
	help: "Number of active command cooldowns",
	registers: [register],
});

const commandValidationFailures = new client.Counter({
	name: "skynetbot_command_validation_failures_total",
	help: "Total number of command validation failures",
	labelNames: ["failure_type"],
	registers: [register],
});

// ============================================
// Command Middleware Metrics (Phase 2)
// ============================================

const middlewareExecutionDuration = new client.Histogram({
	name: "skynetbot_middleware_execution_duration_seconds",
	help: "Duration of middleware execution",
	labelNames: ["middleware_name"],
	buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
	registers: [register],
});

const middlewareTotal = new client.Gauge({
	name: "skynetbot_middleware_registered_total",
	help: "Number of registered middleware functions",
	registers: [register],
});

const middlewareBlocked = new client.Counter({
	name: "skynetbot_middleware_blocked_total",
	help: "Total number of requests blocked by middleware",
	labelNames: ["middleware_name", "reason"],
	registers: [register],
});

// ============================================
// Distributed Systems Metrics (Phase 6)
// ============================================

const distributedCacheMessagesReceived = new client.Counter({
	name: "skynetbot_distributed_cache_messages_received_total",
	help: "Total number of distributed cache messages received",
	labelNames: ["channel"],
	registers: [register],
});

const distributedCacheInvalidationsSent = new client.Counter({
	name: "skynetbot_distributed_cache_invalidations_sent_total",
	help: "Total number of distributed cache invalidations sent",
	labelNames: ["type"],
	registers: [register],
});

const distributedShardEventsSent = new client.Counter({
	name: "skynetbot_distributed_shard_events_sent_total",
	help: "Total number of shard events broadcast",
	labelNames: ["event"],
	registers: [register],
});

const redisConnectionState = new client.Gauge({
	name: "skynetbot_redis_connection_state",
	help: "Redis connection state (0=disconnected, 1=connected, 2=reconnecting)",
	registers: [register],
});

const distributedLocksActive = new client.Gauge({
	name: "skynetbot_distributed_locks_active",
	help: "Number of active distributed locks",
	registers: [register],
});

const distributedLockAcquisitions = new client.Counter({
	name: "skynetbot_distributed_lock_acquisitions_total",
	help: "Total distributed lock acquisition attempts",
	labelNames: ["resource", "status"],
	registers: [register],
});

// ============================================
// Express Middleware
// ============================================

/**
 * Express middleware to track HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
	// Skip metrics endpoint itself to avoid recursion
	if (req.path === "/metrics") {
		return next();
	}

	const start = process.hrtime.bigint();
	httpActiveRequests.inc();

	// Capture the original end function
	const originalEnd = res.end;

	res.end = function (...args) {
		httpActiveRequests.dec();

		const duration = Number(process.hrtime.bigint() - start) / 1e9;
		const route = req.route?.path || req.path || "unknown";
		const method = req.method;
		const statusCode = res.statusCode;

		// Normalize route to avoid high cardinality
		const normalizedRoute = normalizeRoute(route);

		httpRequestDuration.observe(
			{ method, route: normalizedRoute, status_code: statusCode },
			duration,
		);

		httpRequestsTotal.inc({
			method,
			route: normalizedRoute,
			status_code: statusCode,
		});

		return originalEnd.apply(this, args);
	};

	next();
};

/**
 * Normalize route paths to avoid high cardinality metrics
 * Replaces dynamic segments with placeholders
 */
function normalizeRoute (route) {
	return route
		// Replace Discord IDs (17-19 digit numbers)
		.replace(/\/\d{17,19}/g, "/:id")
		// Replace UUIDs
		.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
		// Replace generic numeric IDs
		.replace(/\/\d+/g, "/:id")
		// Limit length
		.substring(0, 100);
}

/**
 * Update Discord client metrics
 * Call this periodically (e.g., every 30 seconds)
 */
function updateDiscordMetrics (discordClient) {
	if (!discordClient) return;

	// Guild and user counts
	discordGuildsTotal.set(discordClient.guilds?.cache?.size || 0);
	discordUsersTotal.set(discordClient.users?.cache?.size || 0);

	// Shard metrics
	if (discordClient.ws?.shards) {
		discordShardsTotal.set(discordClient.ws.shards.size);

		discordClient.ws.shards.forEach((shard, shardId) => {
			discordShardStatus.set({ shard_id: shardId }, shard.status === 0 ? 1 : 0);
			discordShardLatency.set({ shard_id: shardId }, shard.ping || 0);
		});
	}

	// Memory usage for current shard
	const shardId = discordClient.shardID || process.env.SHARDS || 0;
	const memoryMB = Math.floor((process.memoryUsage().rss / 1024) / 1024);
	discordShardMemory.set({ shard_id: shardId }, memoryMB);
}

/**
 * Update shard health metrics from sharder data
 * Call this from master process with sharder.getMetrics() data
 */
function updateShardHealthMetrics (shardData) {
	if (!shardData || !Array.isArray(shardData.shards)) return;

	shardData.shards.forEach(shard => {
		discordShardFailures.set({ shard_id: shard.id }, shard.failures || 0);
		if (shard.timeSinceHeartbeat !== undefined) {
			discordShardHeartbeatLatency.set({ shard_id: shard.id }, shard.timeSinceHeartbeat);
		}
	});
}

/**
 * Record a shard restart event
 */
function recordShardRestart (shardId) {
	discordShardRestarts.inc({ shard_id: shardId });
}

/**
 * Record a command execution
 */
function recordCommand (commandName, type = "prefix") {
	discordCommandsTotal.inc({ command: commandName, type });
}

/**
 * Record a message processed
 */
function recordMessage (type = "guild") {
	discordMessagesTotal.inc({ type });
}

/**
 * Record a Discord gateway event
 */
function recordEvent (eventName) {
	discordEventsTotal.inc({ event: eventName });
}

/**
 * Record a database query
 */
function recordDbQuery (operation, collection, duration, success = true) {
	dbQueryDuration.observe({ operation, collection }, duration);
	dbQueriesTotal.inc({ operation, collection, status: success ? "success" : "error" });
}

/**
 * Update extension counts
 */
function updateExtensionCounts (counts) {
	Object.entries(counts).forEach(([state, count]) => {
		extensionsTotal.set({ state }, count);
	});
}

/**
 * Record an extension execution
 */
function recordExtensionExecution (extensionId, success = true) {
	extensionExecutionsTotal.inc({
		extension_id: extensionId,
		status: success ? "success" : "error",
	});
}

/**
 * Update WebSocket connection count
 */
function updateWsConnections (namespace, count) {
	wsConnectionsActive.set({ namespace }, count);
}

/**
 * Record a cache invalidation
 */
function recordCacheInvalidation (cacheKeyPattern, invalidationType = "single") {
	cacheInvalidationsTotal.inc({ cache_key_pattern: cacheKeyPattern, invalidation_type: invalidationType });
}

/**
 * Update cache handler count
 */
function updateCacheHandlerCount (count) {
	cacheHandlersTotal.set(count);
}

/**
 * Time a cache invalidation operation
 */
function timeCacheInvalidation (invalidationType, fn) {
	const end = cacheInvalidationDuration.startTimer({ invalidation_type: invalidationType });
	try {
		const result = fn();
		end();
		return result;
	} catch (err) {
		end();
		throw err;
	}
}

/**
 * Record command execution with timing
 */
function recordCommandExecution (commandName, type, status, duration) {
	commandExecutionDuration.observe({ command: commandName, type, status }, duration);
}

/**
 * Record command validation with timing
 */
function recordCommandValidation (validationType, duration) {
	commandValidationDuration.observe({ validation_type: validationType }, duration);
}

/**
 * Update active cooldown count
 */
function updateCommandCooldowns (count) {
	commandCooldownsActive.set(count);
}

/**
 * Record a command validation failure
 */
function recordCommandValidationFailure (failureType) {
	commandValidationFailures.inc({ failure_type: failureType });
}

/**
 * Record middleware execution with timing
 */
function recordMiddlewareExecution (middlewareName, duration) {
	middlewareExecutionDuration.observe({ middleware_name: middlewareName }, duration);
}

/**
 * Update middleware count
 */
function updateMiddlewareCount (count) {
	middlewareTotal.set(count);
}

/**
 * Record a middleware block
 */
function recordMiddlewareBlock (middlewareName, reason) {
	middlewareBlocked.inc({ middleware_name: middlewareName, reason });
}

/**
 * Get metrics endpoint handler
 */
async function getMetrics (req, res) {
	try {
		res.set("Content-Type", register.contentType);
		res.end(await register.metrics());
	} catch (err) {
		res.status(500).end(err.message);
	}
}

module.exports = {
	register,
	metricsMiddleware,
	getMetrics,
	updateDiscordMetrics,
	updateShardHealthMetrics,
	recordShardRestart,
	recordCommand,
	recordMessage,
	recordEvent,
	recordDbQuery,
	updateExtensionCounts,
	recordExtensionExecution,
	updateWsConnections,
	// Phase 2 metrics
	recordCacheInvalidation,
	updateCacheHandlerCount,
	timeCacheInvalidation,
	recordCommandExecution,
	recordCommandValidation,
	updateCommandCooldowns,
	recordCommandValidationFailure,
	recordMiddlewareExecution,
	updateMiddlewareCount,
	recordMiddlewareBlock,
	// Export individual metrics for direct access if needed
	metrics: {
		httpRequestDuration,
		httpRequestsTotal,
		httpActiveRequests,
		discordGuildsTotal,
		discordUsersTotal,
		discordShardsTotal,
		discordShardStatus,
		discordShardLatency,
		discordShardFailures,
		discordShardRestarts,
		discordShardHeartbeatLatency,
		discordShardMemory,
		discordCommandsTotal,
		discordMessagesTotal,
		discordEventsTotal,
		dbQueryDuration,
		dbQueriesTotal,
		extensionsTotal,
		extensionExecutionsTotal,
		wsConnectionsActive,
		// Phase 2 metrics
		cacheInvalidationsTotal,
		cacheHandlersTotal,
		cacheInvalidationDuration,
		commandExecutionDuration,
		commandValidationDuration,
		commandCooldownsActive,
		commandValidationFailures,
		middlewareExecutionDuration,
		middlewareTotal,
		middlewareBlocked,
		// Phase 6 distributed metrics
		distributedCacheMessagesReceived,
		distributedCacheInvalidationsSent,
		distributedShardEventsSent,
		redisConnectionState,
		distributedLocksActive,
		distributedLockAcquisitions,
		// Batch write metrics
		batchWritesQueued,
		batchWritesFlushed,
		batchWritesMerged,
		batchWriteErrors,
		batchQueueSize,
	},
};
