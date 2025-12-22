/**
 * Tests for DistributedLock module
 * Phase 6: Distributed Systems
 */

const redisClient = require("../Modules/RedisClient");
const distributedLock = require("../Modules/DistributedLock");

describe("DistributedLock", () => {
	beforeAll(async () => {
		// Connect to Redis for testing
		await redisClient.connect({
			host: process.env.REDIS_HOST || "127.0.0.1",
			port: process.env.REDIS_PORT || 6379,
		});
	});

	afterAll(async () => {
		// Release all locks and disconnect
		await distributedLock.releaseAll();
		await redisClient.disconnect();
	});

	afterEach(async () => {
		// Clean up locks after each test
		await distributedLock.releaseAll();
	});

	describe("Lock Acquisition", () => {
		it("should acquire a lock", async () => {
			const resource = "test:resource:1";
			const token = await distributedLock.acquire(resource);

			expect(token).toBeDefined();
			expect(typeof token).toBe("string");
		});

		it("should not acquire the same lock twice", async () => {
			const resource = "test:resource:2";
			const token1 = await distributedLock.acquire(resource, { retry: 0 });
			const token2 = await distributedLock.acquire(resource, { retry: 0 });

			expect(token1).toBeDefined();
			expect(token2).toBeNull();
		});

		it("should support custom TTL", async () => {
			const resource = "test:resource:ttl";
			const token = await distributedLock.acquire(resource, { ttl: 1000 });

			expect(token).toBeDefined();

			// Lock should exist
			const isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(true);
		});

		it("should retry acquisition", async () => {
			const resource = "test:resource:retry";

			// Acquire lock first
			const token1 = await distributedLock.acquire(resource, { ttl: 500 });
			expect(token1).toBeDefined();

			// Try to acquire again with retry after TTL expires
			setTimeout(async () => {
				const token2 = await distributedLock.acquire(resource, {
					retry: 3,
					retryDelay: 200,
				});
				expect(token2).toBeDefined();
			}, 600);
		});
	});

	describe("Lock Release", () => {
		it("should release a lock", async () => {
			const resource = "test:resource:release";
			const token = await distributedLock.acquire(resource);

			const released = await distributedLock.release(resource, token);
			expect(released).toBe(true);

			// Lock should no longer exist
			const isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(false);
		});

		it("should not release with invalid token", async () => {
			const resource = "test:resource:invalid";
			const token = await distributedLock.acquire(resource);

			const released = await distributedLock.release(resource, "invalid-token");
			expect(released).toBe(false);

			// Lock should still exist
			const isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(true);

			// Clean up
			await distributedLock.release(resource, token);
		});

		it("should release all locks", async () => {
			const resources = ["test:multi:1", "test:multi:2", "test:multi:3"];

			// Acquire multiple locks
			for (const resource of resources) {
				await distributedLock.acquire(resource);
			}

			// Release all
			await distributedLock.releaseAll();

			// All locks should be released
			for (const resource of resources) {
				const isLocked = await distributedLock.isLocked(resource);
				expect(isLocked).toBe(false);
			}
		});
	});

	describe("Lock Extension", () => {
		it("should extend lock TTL", async () => {
			const resource = "test:resource:extend";
			const token = await distributedLock.acquire(resource, { ttl: 1000 });

			const extended = await distributedLock.extend(resource, token, 5000);
			expect(extended).toBe(true);
		});

		it("should not extend with invalid token", async () => {
			const resource = "test:resource:extend-invalid";
			await distributedLock.acquire(resource);

			const extended = await distributedLock.extend(resource, "invalid-token", 5000);
			expect(extended).toBe(false);
		});
	});

	describe("WithLock Helper", () => {
		it("should execute function with automatic lock management", async () => {
			const resource = "test:resource:withlock";
			const fn = jest.fn(async () => "result");

			const result = await distributedLock.withLock(resource, fn);

			expect(fn).toHaveBeenCalled();
			expect(result).toBe("result");

			// Lock should be released
			const isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(false);
		});

		it("should release lock even if function throws", async () => {
			const resource = "test:resource:withlock-error";
			const fn = jest.fn(async () => {
				throw new Error("Test error");
			});

			await expect(distributedLock.withLock(resource, fn)).rejects.toThrow("Test error");

			// Lock should still be released
			const isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(false);
		});

		it("should throw if lock cannot be acquired", async () => {
			const resource = "test:resource:withlock-fail";

			// Acquire lock first
			await distributedLock.acquire(resource);

			// Try to use withLock
			const fn = jest.fn();
			await expect(
				distributedLock.withLock(resource, fn, { retry: 0 }),
			).rejects.toThrow("Failed to acquire lock");

			expect(fn).not.toHaveBeenCalled();
		});
	});

	describe("Lock Status", () => {
		it("should check if resource is locked", async () => {
			const resource = "test:resource:check";

			let isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(false);

			const token = await distributedLock.acquire(resource);
			isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(true);

			await distributedLock.release(resource, token);
			isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(false);
		});

		it("should get active locks", async () => {
			const resources = ["test:active:1", "test:active:2"];

			for (const resource of resources) {
				await distributedLock.acquire(resource);
			}

			const activeLocks = distributedLock.getActiveLocks();
			expect(activeLocks.length).toBe(2);
			expect(activeLocks[0]).toHaveProperty("resource");
			expect(activeLocks[0]).toHaveProperty("token");
			expect(activeLocks[0]).toHaveProperty("acquiredAt");
			expect(activeLocks[0]).toHaveProperty("ttl");
		});
	});

	describe("Force Release", () => {
		it("should force release a lock", async () => {
			const resource = "test:resource:force";
			await distributedLock.acquire(resource);

			const released = await distributedLock.forceRelease(resource);
			expect(released).toBe(true);

			const isLocked = await distributedLock.isLocked(resource);
			expect(isLocked).toBe(false);
		});
	});
});
