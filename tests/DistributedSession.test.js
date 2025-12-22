/**
 * Tests for DistributedSession module
 * Phase 6: Distributed Systems
 */

const redisClient = require("../Modules/RedisClient");
const distributedSession = require("../Modules/DistributedSession");

describe("DistributedSession", () => {
	beforeAll(async () => {
		// Connect to Redis for testing
		await redisClient.connect({
			host: process.env.REDIS_HOST || "127.0.0.1",
			port: process.env.REDIS_PORT || 6379,
		});

		// Configure sessions
		distributedSession.configure({ ttl: 3600 });
	});

	afterAll(async () => {
		// Clean up all test sessions
		const testUsers = ["test-user-1", "test-user-2", "test-user-3"];
		for (const userId of testUsers) {
			await distributedSession.deleteByUser(userId);
		}
		await redisClient.disconnect();
	});

	describe("Session Creation", () => {
		it("should create a new session", async () => {
			const userId = "test-user-1";
			const data = { username: "testuser", role: "user" };

			const sessionId = await distributedSession.create(userId, data);

			expect(sessionId).toBeDefined();
			expect(typeof sessionId).toBe("string");
			expect(sessionId).toContain(userId);
		});

		it("should create session with custom TTL", async () => {
			const userId = "test-user-1";
			const data = { test: true };
			const customTtl = 7200;

			const sessionId = await distributedSession.create(userId, data, customTtl);
			expect(sessionId).toBeDefined();

			const session = await distributedSession.get(sessionId, false);
			expect(session.expiresAt).toBeGreaterThan(Date.now() + 7000000);
		});
	});

	describe("Session Retrieval", () => {
		it("should get an existing session", async () => {
			const userId = "test-user-1";
			const data = { key: "value" };

			const sessionId = await distributedSession.create(userId, data);
			const session = await distributedSession.get(sessionId);

			expect(session).toBeDefined();
			expect(session.userId).toBe(userId);
			expect(session.data).toEqual(data);
			expect(session).toHaveProperty("id");
			expect(session).toHaveProperty("createdAt");
			expect(session).toHaveProperty("lastAccessedAt");
		});

		it("should return null for non-existent session", async () => {
			const session = await distributedSession.get("non-existent-id");
			expect(session).toBeNull();
		});

		it("should update lastAccessedAt when touching", async () => {
			const userId = "test-user-1";
			const sessionId = await distributedSession.create(userId, {});

			const session1 = await distributedSession.get(sessionId, false);
			const firstAccess = session1.lastAccessedAt;

			// Wait a bit
			await new Promise(resolve => setTimeout(resolve, 10));

			const session2 = await distributedSession.get(sessionId, true);
			expect(session2.lastAccessedAt).toBeGreaterThan(firstAccess);
		});

		it("should not update lastAccessedAt when not touching", async () => {
			const userId = "test-user-1";
			const sessionId = await distributedSession.create(userId, {});

			const session1 = await distributedSession.get(sessionId, false);
			const firstAccess = session1.lastAccessedAt;

			const session2 = await distributedSession.get(sessionId, false);
			expect(session2.lastAccessedAt).toBe(firstAccess);
		});
	});

	describe("Session Update", () => {
		it("should update session data", async () => {
			const userId = "test-user-1";
			const initialData = { count: 1 };

			const sessionId = await distributedSession.create(userId, initialData);

			const updated = await distributedSession.update(sessionId, { count: 2, newField: true });
			expect(updated).toBe(true);

			const session = await distributedSession.get(sessionId, false);
			expect(session.data.count).toBe(2);
			expect(session.data.newField).toBe(true);
		});

		it("should return false for non-existent session", async () => {
			const updated = await distributedSession.update("non-existent", { data: true });
			expect(updated).toBe(false);
		});

		it("should update TTL when provided", async () => {
			const userId = "test-user-1";
			const sessionId = await distributedSession.create(userId, {});

			const session1 = await distributedSession.get(sessionId, false);
			const firstExpiry = session1.expiresAt;

			await distributedSession.update(sessionId, {}, 7200);

			const session2 = await distributedSession.get(sessionId, false);
			expect(session2.expiresAt).toBeGreaterThan(firstExpiry);
		});
	});

	describe("Session Deletion", () => {
		it("should delete a session", async () => {
			const userId = "test-user-1";
			const sessionId = await distributedSession.create(userId, {});

			const deleted = await distributedSession.delete(sessionId);
			expect(deleted).toBe(true);

			const session = await distributedSession.get(sessionId);
			expect(session).toBeNull();
		});

		it("should return false when deleting non-existent session", async () => {
			const deleted = await distributedSession.delete("non-existent");
			expect(deleted).toBe(false);
		});
	});

	describe("Session Existence", () => {
		it("should check if session exists", async () => {
			const userId = "test-user-1";
			const sessionId = await distributedSession.create(userId, {});

			const exists = await distributedSession.exists(sessionId);
			expect(exists).toBe(true);

			await distributedSession.delete(sessionId);

			const existsAfter = await distributedSession.exists(sessionId);
			expect(existsAfter).toBe(false);
		});
	});

	describe("Session Extension", () => {
		it("should extend session TTL", async () => {
			const userId = "test-user-1";
			const sessionId = await distributedSession.create(userId, {});

			const session1 = await distributedSession.get(sessionId, false);
			const firstExpiry = session1.expiresAt;

			const extended = await distributedSession.extend(sessionId, 3600);
			expect(extended).toBe(true);

			const session2 = await distributedSession.get(sessionId, false);
			expect(session2.expiresAt).toBeGreaterThan(firstExpiry);
		});

		it("should return false for non-existent session", async () => {
			const extended = await distributedSession.extend("non-existent", 3600);
			expect(extended).toBe(false);
		});
	});

	describe("User Session Queries", () => {
		it("should get all sessions for a user", async () => {
			const userId = "test-user-2";

			// Create multiple sessions
			await distributedSession.create(userId, { session: 1 });
			await distributedSession.create(userId, { session: 2 });
			await distributedSession.create(userId, { session: 3 });

			const sessions = await distributedSession.getByUser(userId);
			expect(sessions.length).toBe(3);
			expect(sessions[0].userId).toBe(userId);
		});

		it("should delete all sessions for a user", async () => {
			const userId = "test-user-3";

			// Create multiple sessions
			await distributedSession.create(userId, {});
			await distributedSession.create(userId, {});

			const deletedCount = await distributedSession.deleteByUser(userId);
			expect(deletedCount).toBeGreaterThanOrEqual(2);

			const sessions = await distributedSession.getByUser(userId);
			expect(sessions.length).toBe(0);
		});
	});

	describe("Session Count", () => {
		it("should count total sessions", async () => {
			const userId = "test-user-1";

			const initialCount = await distributedSession.count();

			await distributedSession.create(userId, {});
			await distributedSession.create(userId, {});

			const newCount = await distributedSession.count();
			expect(newCount).toBeGreaterThanOrEqual(initialCount + 2);
		});
	});

	describe("Session Statistics", () => {
		it("should get session statistics", async () => {
			const userId = "test-user-1";
			await distributedSession.create(userId, {});

			const stats = await distributedSession.getStats();

			expect(stats).toHaveProperty("total");
			expect(stats).toHaveProperty("byUser");
			expect(stats).toHaveProperty("oldestSession");
			expect(stats).toHaveProperty("newestSession");
			expect(stats.total).toBeGreaterThan(0);
		});
	});

	describe("Session Cleanup", () => {
		it("should clean up expired sessions", async () => {
			// Note: This test relies on manual expiration
			// In production, Redis handles expiration automatically
			const cleaned = await distributedSession.cleanup();
			expect(typeof cleaned).toBe("number");
			expect(cleaned).toBeGreaterThanOrEqual(0);
		});
	});
});
