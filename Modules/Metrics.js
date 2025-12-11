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

	res.end = function(...args) {
		httpActiveRequests.dec();

		const duration = Number(process.hrtime.bigint() - start) / 1e9;
		const route = req.route?.path || req.path || "unknown";
		const method = req.method;
		const statusCode = res.statusCode;

		// Normalize route to avoid high cardinality
		const normalizedRoute = normalizeRoute(route);

		httpRequestDuration.observe(
			{ method, route: normalizedRoute, status_code: statusCode },
			duration
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
function normalizeRoute(route) {
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
function updateDiscordMetrics(discordClient) {
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
}

/**
 * Record a command execution
 */
function recordCommand(commandName, type = "prefix") {
	discordCommandsTotal.inc({ command: commandName, type });
}

/**
 * Record a message processed
 */
function recordMessage(type = "guild") {
	discordMessagesTotal.inc({ type });
}

/**
 * Record a Discord gateway event
 */
function recordEvent(eventName) {
	discordEventsTotal.inc({ event: eventName });
}

/**
 * Record a database query
 */
function recordDbQuery(operation, collection, duration, success = true) {
	dbQueryDuration.observe({ operation, collection }, duration);
	dbQueriesTotal.inc({ operation, collection, status: success ? "success" : "error" });
}

/**
 * Update extension counts
 */
function updateExtensionCounts(counts) {
	Object.entries(counts).forEach(([state, count]) => {
		extensionsTotal.set({ state }, count);
	});
}

/**
 * Record an extension execution
 */
function recordExtensionExecution(extensionId, success = true) {
	extensionExecutionsTotal.inc({
		extension_id: extensionId,
		status: success ? "success" : "error",
	});
}

/**
 * Update WebSocket connection count
 */
function updateWsConnections(namespace, count) {
	wsConnectionsActive.set({ namespace }, count);
}

/**
 * Get metrics endpoint handler
 */
async function getMetrics(req, res) {
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
	recordCommand,
	recordMessage,
	recordEvent,
	recordDbQuery,
	updateExtensionCounts,
	recordExtensionExecution,
	updateWsConnections,
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
		discordCommandsTotal,
		discordMessagesTotal,
		discordEventsTotal,
		dbQueryDuration,
		dbQueriesTotal,
		extensionsTotal,
		extensionExecutionsTotal,
		wsConnectionsActive,
	},
};
