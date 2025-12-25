/**
 * Distributed Cache Invalidation System
 * Uses Redis pub/sub to synchronize cache invalidations across multiple bot instances/shards
 *
 * @module Modules/DistributedCache
 */

const redisClient = require("./RedisClient");
const logger = require("../Internals/Logger");

// Performance monitoring
let metrics = null;
try {
	metrics = require("./Metrics");
} catch (err) {
	// Metrics not available
}

/**
 * Channel names for pub/sub
 */
const CHANNELS = {
	CACHE_INVALIDATE: "cgn:cache:invalidate",
	CACHE_INVALIDATE_PATTERN: "cgn:cache:invalidate:pattern",
	SHARD_EVENT: "cgn:shard:event",
};

/**
 * DistributedCache class for cross-instance cache invalidation
 *
 * @class DistributedCache
 */
class DistributedCache {
	constructor () {
		this.subscribers = new Map();
		this.instanceId = this._generateInstanceId();
		this.initialized = false;
		this.messageCount = 0;
	}

	/**
	 * Generate unique instance ID for this bot instance
	 * @private
	 * @returns {string} Instance ID
	 */
	_generateInstanceId () {
		const pid = process.pid;
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(7);
		return `bot-${pid}-${timestamp}-${random}`;
	}

	/**
	 * Initialize distributed cache system
	 * Sets up Redis pub/sub subscriptions
	 *
	 * @returns {Promise<void>}
	 */
	async initialize () {
		if (this.initialized) {
			logger.warn("DistributedCache: Already initialized");
			return;
		}

		try {
			if (!redisClient.isConnected()) {
				throw new Error("Redis not connected. Connect RedisClient first.");
			}

			const subscriber = redisClient.getSubscriber();

			// Subscribe to all cache channels
			await subscriber.subscribe(
				CHANNELS.CACHE_INVALIDATE,
				CHANNELS.CACHE_INVALIDATE_PATTERN,
				CHANNELS.SHARD_EVENT,
			);

			// Set up message handlers
			subscriber.on("message", (channel, message) => {
				this._handleMessage(channel, message);
			});

			this.initialized = true;
			logger.info("DistributedCache: Initialized", {
				instanceId: this.instanceId,
				channels: Object.values(CHANNELS),
			});
		} catch (error) {
			logger.error("DistributedCache: Initialization failed", {}, error);
			throw error;
		}
	}

	/**
	 * Handle incoming pub/sub messages
	 * @private
	 * @param {string} channel - Channel name
	 * @param {string} message - Message payload (JSON string)
	 */
	_handleMessage (channel, message) {
		try {
			const data = JSON.parse(message);

			// Ignore messages from this instance
			if (data.instanceId === this.instanceId) {
				return;
			}

			this.messageCount++;

			// Record metrics
			if (metrics) {
				metrics.metrics.distributedCacheMessagesReceived?.inc({ channel });
			}

			// Route to appropriate handler
			switch (channel) {
				case CHANNELS.CACHE_INVALIDATE:
					this._handleCacheInvalidate(data);
					break;
				case CHANNELS.CACHE_INVALIDATE_PATTERN:
					this._handleCacheInvalidatePattern(data);
					break;
				case CHANNELS.SHARD_EVENT:
					this._handleShardEvent(data);
					break;
				default:
					logger.warn("DistributedCache: Unknown channel", { channel });
			}
		} catch (error) {
			logger.error("DistributedCache: Message handling error", { channel, message }, error);
		}
	}

	/**
	 * Handle single cache invalidation
	 * @private
	 * @param {Object} data - Message data
	 */
	_handleCacheInvalidate (data) {
		const { cacheKey, metadata } = data;

		logger.debug("DistributedCache: Invalidating cache key", { cacheKey, metadata });

		// Trigger local subscribers
		const handlers = this.subscribers.get(cacheKey) || [];
		handlers.forEach(handler => {
			try {
				handler(cacheKey, metadata);
			} catch (error) {
				logger.error("DistributedCache: Subscriber error", { cacheKey }, error);
			}
		});
	}

	/**
	 * Handle pattern cache invalidation
	 * @private
	 * @param {Object} data - Message data
	 */
	_handleCacheInvalidatePattern (data) {
		const { pattern, metadata } = data;

		logger.debug("DistributedCache: Invalidating cache pattern", { pattern, metadata });

		const regex = new RegExp(pattern);

		// Trigger matching local subscribers
		for (const [cacheKey, handlers] of this.subscribers.entries()) {
			if (regex.test(cacheKey)) {
				handlers.forEach(handler => {
					try {
						handler(cacheKey, metadata);
					} catch (error) {
						logger.error("DistributedCache: Subscriber error", { cacheKey }, error);
					}
				});
			}
		}
	}

	/**
	 * Handle cross-shard event
	 * @private
	 * @param {Object} data - Message data
	 */
	_handleShardEvent (data) {
		const { event, payload } = data;

		logger.debug("DistributedCache: Shard event received", { event, payload });

		// Trigger event-specific subscribers
		const handlers = this.subscribers.get(`event:${event}`) || [];
		handlers.forEach(handler => {
			try {
				handler(event, payload);
			} catch (error) {
				logger.error("DistributedCache: Event subscriber error", { event }, error);
			}
		});
	}

	/**
	 * Invalidate a cache key across all instances
	 *
	 * @param {string} cacheKey - Cache key to invalidate
	 * @param {Object} [metadata={}] - Optional metadata
	 * @returns {Promise<void>}
	 */
	async invalidate (cacheKey, metadata = {}) {
		try {
			const message = JSON.stringify({
				instanceId: this.instanceId,
				cacheKey,
				metadata,
				timestamp: Date.now(),
			});

			const publisher = redisClient.getPublisher();
			await publisher.publish(CHANNELS.CACHE_INVALIDATE, message);

			// Also trigger local handlers immediately
			this._handleCacheInvalidate({ cacheKey, metadata });

			logger.debug("DistributedCache: Published invalidation", { cacheKey });

			if (metrics) {
				metrics.metrics.distributedCacheInvalidationsSent?.inc({ type: "single" });
			}
		} catch (error) {
			logger.error("DistributedCache: Invalidation publish failed", { cacheKey }, error);
			throw error;
		}
	}

	/**
	 * Invalidate cache keys matching a pattern across all instances
	 *
	 * @param {string|RegExp} pattern - Pattern to match
	 * @param {Object} [metadata={}] - Optional metadata
	 * @returns {Promise<void>}
	 */
	async invalidatePattern (pattern, metadata = {}) {
		try {
			const patternStr = typeof pattern === "string" ? pattern : pattern.source;

			const message = JSON.stringify({
				instanceId: this.instanceId,
				pattern: patternStr,
				metadata,
				timestamp: Date.now(),
			});

			const publisher = redisClient.getPublisher();
			await publisher.publish(CHANNELS.CACHE_INVALIDATE_PATTERN, message);

			// Also trigger local handlers immediately
			this._handleCacheInvalidatePattern({ pattern: patternStr, metadata });

			logger.debug("DistributedCache: Published pattern invalidation", { pattern: patternStr });

			if (metrics) {
				metrics.metrics.distributedCacheInvalidationsSent?.inc({ type: "pattern" });
			}
		} catch (error) {
			logger.error("DistributedCache: Pattern invalidation publish failed", { pattern }, error);
			throw error;
		}
	}

	/**
	 * Broadcast an event to all shards/instances
	 *
	 * @param {string} event - Event name
	 * @param {any} payload - Event payload
	 * @returns {Promise<void>}
	 */
	async broadcastShardEvent (event, payload) {
		try {
			const message = JSON.stringify({
				instanceId: this.instanceId,
				event,
				payload,
				timestamp: Date.now(),
			});

			const publisher = redisClient.getPublisher();
			await publisher.publish(CHANNELS.SHARD_EVENT, message);

			logger.debug("DistributedCache: Broadcasted shard event", { event });

			if (metrics) {
				metrics.metrics.distributedShardEventsSent?.inc({ event });
			}
		} catch (error) {
			logger.error("DistributedCache: Shard event broadcast failed", { event }, error);
			throw error;
		}
	}

	/**
	 * Subscribe to cache invalidation events
	 *
	 * @param {string} cacheKey - Cache key to watch
	 * @param {Function} handler - Handler function (cacheKey, metadata) => void
	 */
	subscribe (cacheKey, handler) {
		if (!this.subscribers.has(cacheKey)) {
			this.subscribers.set(cacheKey, []);
		}

		this.subscribers.get(cacheKey).push(handler);

		logger.debug("DistributedCache: Added subscriber", { cacheKey });
	}

	/**
	 * Subscribe to shard events
	 *
	 * @param {string} event - Event name
	 * @param {Function} handler - Handler function (event, payload) => void
	 */
	subscribeToShardEvent (event, handler) {
		const key = `event:${event}`;

		if (!this.subscribers.has(key)) {
			this.subscribers.set(key, []);
		}

		this.subscribers.get(key).push(handler);

		logger.debug("DistributedCache: Added shard event subscriber", { event });
	}

	/**
	 * Unsubscribe from cache invalidation events
	 *
	 * @param {string} cacheKey - Cache key
	 * @param {Function} [handler] - Specific handler to remove, or all if omitted
	 */
	unsubscribe (cacheKey, handler) {
		if (!handler) {
			this.subscribers.delete(cacheKey);
		} else {
			const handlers = this.subscribers.get(cacheKey) || [];
			const filtered = handlers.filter(h => h !== handler);
			this.subscribers.set(cacheKey, filtered);
		}

		logger.debug("DistributedCache: Removed subscriber", { cacheKey });
	}

	/**
	 * Get statistics about distributed cache
	 *
	 * @returns {Object} Stats object
	 */
	getStats () {
		return {
			instanceId: this.instanceId,
			initialized: this.initialized,
			subscriberCount: this.subscribers.size,
			messageCount: this.messageCount,
			connected: redisClient.isConnected(),
		};
	}

	/**
	 * Shutdown distributed cache system
	 *
	 * @returns {Promise<void>}
	 */
	async shutdown () {
		try {
			if (!this.initialized) {
				return;
			}

			const subscriber = redisClient.getSubscriber();

			await subscriber.unsubscribe(
				CHANNELS.CACHE_INVALIDATE,
				CHANNELS.CACHE_INVALIDATE_PATTERN,
				CHANNELS.SHARD_EVENT,
			);

			this.subscribers.clear();
			this.initialized = false;

			logger.info("DistributedCache: Shutdown complete");
		} catch (error) {
			logger.error("DistributedCache: Shutdown error", {}, error);
			throw error;
		}
	}
}

// Export singleton instance
module.exports = new DistributedCache();
module.exports.CHANNELS = CHANNELS;
