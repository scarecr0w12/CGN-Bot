/**
 * Distributed Systems Initialization
 * Initializes Redis, distributed cache, locks, and session management
 *
 * @module Internals/DistributedSystemsInit
 */

const redisClient = require("../Modules/RedisClient");
const distributedCache = require("../Modules/DistributedCache");
const distributedSession = require("../Modules/DistributedSession");
const logger = require("./Logger");

// Metrics (optional)
let metrics = null;
try {
	metrics = require("../Modules/Metrics");
} catch (err) {
	// Metrics not available
}

/**
 * Initialize distributed systems
 *
 * @param {Object} [options={}] - Initialization options
 * @param {boolean} [options.enableCache=true] - Enable distributed cache
 * @param {boolean} [options.enableSessions=true] - Enable distributed sessions
 * @param {number} [options.sessionTtl=86400] - Session TTL in seconds
 * @returns {Promise<Object>} Initialization results
 */
async function initialize (options = {}) {
	const {
		enableCache = process.env.ENABLE_DISTRIBUTED_CACHE !== "false",
		enableSessions = true,
		sessionTtl = 86400,
	} = options;

	const results = {
		redis: false,
		cache: false,
		sessions: false,
		errors: [],
	};

	try {
		// Connect to Redis
		logger.info("DistributedSystems: Connecting to Redis...");
		await redisClient.connect({
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
			password: process.env.REDIS_PASSWORD,
			db: process.env.REDIS_DB,
		});
		results.redis = true;
		logger.info("DistributedSystems: Redis connected");

		// Update metrics
		if (metrics) {
			metrics.metrics.redisConnectionState.set(1); // Connected
		}

		// Initialize distributed cache
		if (enableCache) {
			try {
				logger.info("DistributedSystems: Initializing distributed cache...");
				await distributedCache.initialize();
				results.cache = true;
				logger.info("DistributedSystems: Distributed cache ready");
			} catch (error) {
				logger.error("DistributedSystems: Cache initialization failed", {}, error);
				results.errors.push({ component: "cache", error: error.message });
			}
		}

		// Configure distributed sessions
		if (enableSessions) {
			try {
				logger.info("DistributedSystems: Configuring distributed sessions...");
				distributedSession.configure({ ttl: sessionTtl });
				results.sessions = true;
				logger.info("DistributedSystems: Distributed sessions ready");
			} catch (error) {
				logger.error("DistributedSystems: Session configuration failed", {}, error);
				results.errors.push({ component: "sessions", error: error.message });
			}
		}

		logger.info("DistributedSystems: Initialization complete", {
			redis: results.redis,
			cache: results.cache,
			sessions: results.sessions,
			errors: results.errors.length,
		});

		return results;
	} catch (error) {
		logger.error("DistributedSystems: Initialization failed", {}, error);
		results.errors.push({ component: "redis", error: error.message });

		// Update metrics
		if (metrics) {
			metrics.metrics.redisConnectionState.set(0); // Disconnected
		}

		throw error;
	}
}

/**
 * Shutdown distributed systems
 *
 * @returns {Promise<void>}
 */
async function shutdown () {
	logger.info("DistributedSystems: Shutting down...");

	try {
		// Shutdown distributed cache
		if (distributedCache.initialized) {
			await distributedCache.shutdown();
			logger.info("DistributedSystems: Distributed cache shutdown");
		}

		// Disconnect Redis
		if (redisClient.isConnected()) {
			await redisClient.disconnect();
			logger.info("DistributedSystems: Redis disconnected");

			// Update metrics
			if (metrics) {
				metrics.metrics.redisConnectionState.set(0); // Disconnected
			}
		}

		logger.info("DistributedSystems: Shutdown complete");
	} catch (error) {
		logger.error("DistributedSystems: Shutdown error", {}, error);
		throw error;
	}
}

/**
 * Health check for distributed systems
 *
 * @returns {Promise<Object>} Health status
 */
async function healthCheck () {
	const health = {
		redis: {
			connected: false,
			state: "unknown",
			latency: null,
		},
		cache: {
			initialized: false,
			messageCount: 0,
		},
		sessions: {
			count: 0,
		},
		overall: "unhealthy",
	};

	try {
		// Check Redis connection
		if (redisClient.isConnected()) {
			const start = Date.now();
			await redisClient.execute("ping");
			health.redis.connected = true;
			health.redis.state = redisClient.getState();
			health.redis.latency = Date.now() - start;
		}

		// Check distributed cache
		if (distributedCache.initialized) {
			const stats = distributedCache.getStats();
			health.cache.initialized = true;
			health.cache.messageCount = stats.messageCount;
		}

		// Check sessions
		try {
			health.sessions.count = await distributedSession.count();
		} catch (err) {
			// Sessions might not be accessible
		}

		// Overall health
		health.overall = health.redis.connected ? "healthy" : "unhealthy";

		return health;
	} catch (error) {
		logger.error("DistributedSystems: Health check failed", {}, error);
		return health;
	}
}

module.exports = {
	initialize,
	shutdown,
	healthCheck,
};
