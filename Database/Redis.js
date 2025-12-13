/**
 * Redis Connection Manager
 * Provides centralized Redis client management with connection pooling,
 * graceful error handling, and pub/sub support.
 */

let Redis = null;
let ioredisAvailable = false;
try {
	Redis = require("ioredis");
	ioredisAvailable = true;
} catch (err) {
	// ioredis not installed - Redis features will be disabled
	console.log("[Redis] ioredis module not available - Redis caching disabled");
}

let client = null;
let subscriber = null;
let isConnecting = false;

/**
 * Get Redis configuration from environment variables
 * @returns {Object} Redis configuration object
 */
const getRedisConfig = () => ({
	host: process.env.REDIS_HOST || "127.0.0.1",
	port: parseInt(process.env.REDIS_PORT, 10) || 6379,
	password: process.env.REDIS_PASSWORD || undefined,
	db: parseInt(process.env.REDIS_DB, 10) || 0,
	maxRetriesPerRequest: 3,
	retryStrategy: times => {
		if (times > 10) {
			logger.error("Redis: Max retry attempts reached, giving up");
			return null;
		}
		const delay = Math.min(times * 100, 3000);
		return delay;
	},
	enableReadyCheck: true,
	lazyConnect: true,
});

/**
 * Create and connect the main Redis client
 * @returns {Promise<Redis>} Connected Redis client
 */
const createClient = async () => {
	if (client && client.status === "ready") return client;
	if (isConnecting) {
		// Wait for existing connection attempt
		await new Promise(resolve => setTimeout(resolve, 100));
		return client;
	}

	isConnecting = true;

	try {
		client = new Redis(getRedisConfig());

		client.on("error", err => {
			logger.error("Redis connection error", {}, err);
		});

		client.on("connect", () => {
			logger.debug("Redis connecting...");
		});

		client.on("ready", () => {
			logger.info("Redis client ready");
		});

		client.on("close", () => {
			logger.warn("Redis connection closed");
		});

		client.on("reconnecting", () => {
			logger.debug("Redis reconnecting...");
		});

		await client.connect();
		isConnecting = false;
		return client;
	} catch (err) {
		isConnecting = false;
		logger.error("Failed to connect to Redis", {}, err);
		client = null;
		throw err;
	}
};

/**
 * Get the existing Redis client (does not create new connection)
 * @returns {Redis|null} Redis client or null if not connected
 */
const getClient = () => client;

/**
 * Create a separate Redis client for pub/sub subscriptions
 * @returns {Promise<Redis>} Subscriber Redis client
 */
const getSubscriber = async () => {
	if (subscriber && subscriber.status === "ready") return subscriber;

	subscriber = new Redis(getRedisConfig());

	subscriber.on("error", err => {
		logger.error("Redis subscriber error", {}, err);
	});

	await subscriber.connect();
	return subscriber;
};

/**
 * Gracefully disconnect all Redis clients
 */
const disconnect = async () => {
	const promises = [];

	if (client) {
		promises.push(client.quit().catch(() => client.disconnect()));
	}
	if (subscriber) {
		promises.push(subscriber.quit().catch(() => subscriber.disconnect()));
	}

	await Promise.all(promises);
	client = null;
	subscriber = null;
	logger.info("Redis clients disconnected");
};

/**
 * Check if Redis is configured (has host set in environment AND ioredis is available)
 * @returns {boolean} True if Redis is configured and available
 */
const isEnabled = () => ioredisAvailable && !!process.env.REDIS_HOST;

/**
 * Check if Redis client is connected and ready
 * @returns {boolean} True if client is ready
 */
const isReady = () => client && client.status === "ready";

/**
 * Ping Redis to check connectivity
 * @returns {Promise<boolean>} True if Redis responds
 */
const ping = async () => {
	if (!client) return false;
	try {
		const result = await client.ping();
		return result === "PONG";
	} catch {
		return false;
	}
};

/**
 * Get Redis connection info for monitoring
 * @returns {Object} Connection status info
 */
const getInfo = () => ({
	enabled: isEnabled(),
	connected: isReady(),
	host: process.env.REDIS_HOST || "not configured",
	port: process.env.REDIS_PORT || 6379,
	db: process.env.REDIS_DB || 0,
});

module.exports = {
	createClient,
	getClient,
	getSubscriber,
	disconnect,
	isEnabled,
	isReady,
	ping,
	getInfo,
};
