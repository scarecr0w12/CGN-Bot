/**
 * Redis Client Manager
 * Centralized Redis connection management with automatic reconnection,
 * error handling, and connection pooling support.
 *
 * @module Modules/RedisClient
 */

const Redis = require("ioredis");
const logger = require("../Internals/Logger");

/**
 * Redis connection states
 * @enum {string}
 */
const ConnectionState = {
	DISCONNECTED: "disconnected",
	CONNECTING: "connecting",
	CONNECTED: "connected",
	RECONNECTING: "reconnecting",
	ERROR: "error",
};

/**
 * RedisClient class for managing Redis connections
 * Singleton pattern to ensure single connection pool
 *
 * @class RedisClient
 */
class RedisClient {
	constructor () {
		if (RedisClient.instance) {
			return RedisClient.instance;
		}

		this.client = null;
		this.subscriber = null;
		this.publisher = null;
		this.state = ConnectionState.DISCONNECTED;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 10;

		RedisClient.instance = this;
	}

	/**
	 * Initialize Redis connection
	 * @param {Object} options - Redis connection options
	 * @param {string} [options.host='localhost'] - Redis host
	 * @param {number} [options.port=6379] - Redis port
	 * @param {string} [options.password] - Redis password
	 * @param {number} [options.db=0] - Redis database number
	 * @param {number} [options.maxRetriesPerRequest=3] - Max retries per request
	 * @returns {Promise<void>}
	 */
	async connect (options = {}) {
		if (this.state === ConnectionState.CONNECTED) {
			logger.warn("RedisClient: Already connected");
			return;
		}

		const config = {
			host: options.host || process.env.REDIS_HOST || "localhost",
			port: options.port || process.env.REDIS_PORT || 6379,
			password: options.password || process.env.REDIS_PASSWORD,
			db: options.db || process.env.REDIS_DB || 0,
			maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
			retryStrategy: (times) => {
				if (times > this.maxReconnectAttempts) {
					logger.error("RedisClient: Max reconnection attempts reached");
					return null;
				}
				const delay = Math.min(times * 100, 3000);
				logger.warn(`RedisClient: Reconnecting in ${delay}ms (attempt ${times})`);
				return delay;
			},
			reconnectOnError: (err) => {
				const targetErrors = ["READONLY", "ECONNRESET"];
				return targetErrors.some(target => err.message.includes(target));
			},
		};

		try {
			this.state = ConnectionState.CONNECTING;

			// Main client for regular operations
			this.client = new Redis(config);
			this._setupClientListeners(this.client, "main");

			// Subscriber for pub/sub
			this.subscriber = new Redis(config);
			this._setupClientListeners(this.subscriber, "subscriber");

			// Publisher for pub/sub
			this.publisher = new Redis(config);
			this._setupClientListeners(this.publisher, "publisher");

			await Promise.all([
				this.client.ping(),
				this.subscriber.ping(),
				this.publisher.ping(),
			]);

			this.state = ConnectionState.CONNECTED;
			this.reconnectAttempts = 0;
			logger.info("RedisClient: Connected successfully", {
				host: config.host,
				port: config.port,
				db: config.db,
			});
		} catch (error) {
			this.state = ConnectionState.ERROR;
			logger.error("RedisClient: Connection failed", {}, error);
			throw error;
		}
	}

	/**
	 * Set up event listeners for Redis client
	 * @param {Redis} client - Redis client instance
	 * @param {string} name - Client name for logging
	 * @private
	 */
	_setupClientListeners (client, name) {
		client.on("connect", () => {
			logger.debug(`RedisClient (${name}): Connecting...`);
		});

		client.on("ready", () => {
			logger.debug(`RedisClient (${name}): Ready`);
		});

		client.on("error", (error) => {
			logger.error(`RedisClient (${name}): Error`, {}, error);
		});

		client.on("close", () => {
			logger.warn(`RedisClient (${name}): Connection closed`);
		});

		client.on("reconnecting", () => {
			this.state = ConnectionState.RECONNECTING;
			this.reconnectAttempts++;
			logger.warn(`RedisClient (${name}): Reconnecting...`);
		});

		client.on("end", () => {
			this.state = ConnectionState.DISCONNECTED;
			logger.warn(`RedisClient (${name}): Connection ended`);
		});
	}

	/**
	 * Get main Redis client
	 * @returns {Redis} Redis client instance
	 */
	getClient () {
		if (!this.client) {
			throw new Error("RedisClient: Not connected. Call connect() first.");
		}
		return this.client;
	}

	/**
	 * Get subscriber client for pub/sub
	 * @returns {Redis} Redis subscriber instance
	 */
	getSubscriber () {
		if (!this.subscriber) {
			throw new Error("RedisClient: Subscriber not connected. Call connect() first.");
		}
		return this.subscriber;
	}

	/**
	 * Get publisher client for pub/sub
	 * @returns {Redis} Redis publisher instance
	 */
	getPublisher () {
		if (!this.publisher) {
			throw new Error("RedisClient: Publisher not connected. Call connect() first.");
		}
		return this.publisher;
	}

	/**
	 * Check if connected to Redis
	 * @returns {boolean} True if connected
	 */
	isConnected () {
		return this.state === ConnectionState.CONNECTED;
	}

	/**
	 * Get connection state
	 * @returns {string} Current connection state
	 */
	getState () {
		return this.state;
	}

	/**
	 * Disconnect from Redis
	 * @returns {Promise<void>}
	 */
	async disconnect () {
		if (this.state === ConnectionState.DISCONNECTED) {
			return;
		}

		try {
			await Promise.all([
				this.client?.quit(),
				this.subscriber?.quit(),
				this.publisher?.quit(),
			]);

			this.client = null;
			this.subscriber = null;
			this.publisher = null;
			this.state = ConnectionState.DISCONNECTED;

			logger.info("RedisClient: Disconnected successfully");
		} catch (error) {
			logger.error("RedisClient: Disconnect error", {}, error);
			throw error;
		}
	}

	/**
	 * Execute a Redis command with error handling
	 * @param {string} command - Redis command name
	 * @param {...any} args - Command arguments
	 * @returns {Promise<any>} Command result
	 */
	async execute (command, ...args) {
		try {
			const client = this.getClient();
			return await client[command](...args);
		} catch (error) {
			logger.error(`RedisClient: Command '${command}' failed`, { args }, error);
			throw error;
		}
	}

	/**
	 * Get a key with JSON parsing
	 * @param {string} key - Redis key
	 * @returns {Promise<any>} Parsed value or null
	 */
	async getJSON (key) {
		const value = await this.execute("get", key);
		return value ? JSON.parse(value) : null;
	}

	/**
	 * Set a key with JSON stringification
	 * @param {string} key - Redis key
	 * @param {any} value - Value to store
	 * @param {number} [ttl] - Time to live in seconds
	 * @returns {Promise<string>} Redis response
	 */
	async setJSON (key, value, ttl) {
		const serialized = JSON.stringify(value);
		if (ttl) {
			return this.execute("setex", key, ttl, serialized);
		}
		return this.execute("set", key, serialized);
	}

	/**
	 * Delete one or more keys
	 * @param {...string} keys - Keys to delete
	 * @returns {Promise<number>} Number of keys deleted
	 */
	async del (...keys) {
		return this.execute("del", ...keys);
	}

	/**
	 * Check if key exists
	 * @param {string} key - Redis key
	 * @returns {Promise<boolean>} True if exists
	 */
	async exists (key) {
		const result = await this.execute("exists", key);
		return result === 1;
	}

	/**
	 * Set key expiration
	 * @param {string} key - Redis key
	 * @param {number} seconds - TTL in seconds
	 * @returns {Promise<number>} 1 if timeout set, 0 if key doesn't exist
	 */
	async expire (key, seconds) {
		return this.execute("expire", key, seconds);
	}

	/**
	 * Get keys matching pattern
	 * @param {string} pattern - Key pattern (supports *)
	 * @returns {Promise<string[]>} Matching keys
	 */
	async keys (pattern) {
		return this.execute("keys", pattern);
	}

	/**
	 * Scan keys with cursor for large datasets
	 * @param {string} pattern - Key pattern
	 * @param {number} [count=100] - Results per iteration
	 * @returns {AsyncGenerator<string>} Key iterator
	 */
	async * scan (pattern, count = 100) {
		const client = this.getClient();
		let cursor = "0";

		do {
			const [nextCursor, keys] = await client.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				count,
			);

			cursor = nextCursor;

			for (const key of keys) {
				yield key;
			}
		} while (cursor !== "0");
	}
}

// Export singleton instance
module.exports = new RedisClient();
module.exports.ConnectionState = ConnectionState;
