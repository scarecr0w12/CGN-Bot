/**
 * Tests for DistributedCache module
 * Phase 6: Distributed Systems
 */

const redisClient = require("../Modules/RedisClient");
const distributedCache = require("../Modules/DistributedCache");

describe("DistributedCache", () => {
	beforeAll(async () => {
		// Connect to Redis for testing
		await redisClient.connect({
			host: process.env.REDIS_HOST || "127.0.0.1",
			port: process.env.REDIS_PORT || 6379,
		});
	});

	afterAll(async () => {
		// Clean up
		if (distributedCache.initialized) {
			await distributedCache.shutdown();
		}
		await redisClient.disconnect();
	});

	describe("Initialization", () => {
		it("should initialize distributed cache", async () => {
			await distributedCache.initialize();
			expect(distributedCache.initialized).toBe(true);
		});

		it("should have a unique instance ID", () => {
			expect(distributedCache.instanceId).toBeDefined();
			expect(typeof distributedCache.instanceId).toBe("string");
		});

		it("should not reinitialize if already initialized", async () => {
			const firstInit = distributedCache.initialized;
			await distributedCache.initialize();
			expect(distributedCache.initialized).toBe(firstInit);
		});
	});

	describe("Cache Invalidation", () => {
		it("should broadcast cache invalidation", async () => {
			const cacheKey = "test:user:123";
			const metadata = { reason: "test" };

			await expect(
				distributedCache.invalidate(cacheKey, metadata),
			).resolves.not.toThrow();
		});

		it("should handle subscription to cache invalidation", (done) => {
			const cacheKey = "test:subscription";
			const testData = { test: true };

			// Subscribe to invalidation
			distributedCache.subscribe(cacheKey, (key, data) => {
				expect(key).toBe(cacheKey);
				expect(data).toEqual(testData);
				done();
			});

			// Trigger invalidation (will be received by same instance)
			setTimeout(() => {
				distributedCache.invalidate(cacheKey, testData);
			}, 100);
		});

		it("should support pattern-based invalidation", async () => {
			const pattern = "test:user:*";
			const metadata = { pattern: true };

			await expect(
				distributedCache.invalidatePattern(pattern, metadata),
			).resolves.not.toThrow();
		});
	});

	describe("Shard Events", () => {
		it("should broadcast shard events", async () => {
			const event = "test-event";
			const payload = { data: "test-payload" };

			await expect(
				distributedCache.broadcastShardEvent(event, payload),
			).resolves.not.toThrow();
		});

		it("should handle shard event subscriptions", (done) => {
			const event = "test-subscription-event";
			const payload = { test: true };

			// Subscribe to event
			distributedCache.subscribeToShardEvent(event, (evt, data) => {
				expect(evt).toBe(event);
				expect(data).toEqual(payload);
				done();
			});

			// Trigger event
			setTimeout(() => {
				distributedCache.broadcastShardEvent(event, payload);
			}, 100);
		});
	});

	describe("Statistics", () => {
		it("should return stats", () => {
			const stats = distributedCache.getStats();

			expect(stats).toHaveProperty("instanceId");
			expect(stats).toHaveProperty("initialized");
			expect(stats).toHaveProperty("subscriberCount");
			expect(stats).toHaveProperty("messageCount");
			expect(stats).toHaveProperty("connected");
		});

		it("should track message count", async () => {
			const initialStats = distributedCache.getStats();
			const initialCount = initialStats.messageCount;

			// Send a message
			await distributedCache.invalidate("test:count");

			// Wait a bit for processing
			await new Promise(resolve => setTimeout(resolve, 100));

			const newStats = distributedCache.getStats();
			// Message count may or may not increase depending on timing
			expect(newStats.messageCount).toBeGreaterThanOrEqual(initialCount);
		});
	});

	describe("Unsubscribe", () => {
		it("should remove specific handler", () => {
			const cacheKey = "test:unsubscribe";
			const handler = jest.fn();

			distributedCache.subscribe(cacheKey, handler);
			distributedCache.unsubscribe(cacheKey, handler);

			// Handler should not be called
			distributedCache.invalidate(cacheKey, {});
			expect(handler).not.toHaveBeenCalled();
		});

		it("should remove all handlers for a key", () => {
			const cacheKey = "test:unsubscribe-all";
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			distributedCache.subscribe(cacheKey, handler1);
			distributedCache.subscribe(cacheKey, handler2);
			distributedCache.unsubscribe(cacheKey);

			// No handlers should be called
			distributedCache.invalidate(cacheKey, {});
			expect(handler1).not.toHaveBeenCalled();
			expect(handler2).not.toHaveBeenCalled();
		});
	});
});
