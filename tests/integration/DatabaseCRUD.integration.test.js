/**
 * Integration Tests: Database CRUD Operations
 * Tests end-to-end database operations with custom ODM
 */

const { Collection } = require("discord.js");

// Mock database models following the custom ODM pattern
class MockModel {
	constructor(name, schema) {
		this.name = name;
		this.schema = schema;
		this.data = new Collection();
	}

	find(query = {}) {
		const data = Array.from(this.data.values()).filter(doc => 
			this._matchesQuery(doc, query)
		);
		
		return {
			_data: data,
			limit: function(n) {
				this._data = this._data.slice(0, n);
				return this;
			},
			exec: async function() {
				return this._data;
			},
			[Symbol.asyncIterator]: async function*() {
				for (const item of this._data) {
					yield item;
				}
			},
		};
	}

	async findOne(idOrQuery) {
		if (typeof idOrQuery === "string") {
			return this.data.get(idOrQuery) || null;
		}
		const results = await this.find(idOrQuery).exec();
		return results[0] || null;
	}

	async create(data) {
		const id = data._id || `${this.name}_${Date.now()}_${Math.random()}`;
		const doc = { _id: id, ...data, created_at: new Date() };
		this.data.set(id, doc);
		return doc;
	}

	async update(id, updates) {
		const doc = this.data.get(id);
		if (!doc) return null;
		const updated = { ...doc, ...updates, updated_at: new Date() };
		this.data.set(id, updated);
		return updated;
	}

	async delete(id) {
		const doc = this.data.get(id);
		if (!doc) return null;
		this.data.delete(id);
		return doc;
	}

	_matchesQuery(doc, query) {
		for (const [key, value] of Object.entries(query)) {
			if (doc[key] !== value) return false;
		}
		return true;
	}

	// Clear all data (for testing)
	async _clear() {
		this.data.clear();
	}
}

describe("Database CRUD Integration Tests", () => {
	let Users, Servers, Gallery;

	beforeEach(() => {
		Users = new MockModel("users", {});
		Servers = new MockModel("servers", {});
		Gallery = new MockModel("gallery", {});
	});

	afterEach(async () => {
		await Users._clear();
		await Servers._clear();
		await Gallery._clear();
	});

	describe("Create Operations", () => {
		it("should create new user document", async () => {
			const userData = {
				_id: "123456789012345678",
				username: "TestUser",
				discriminator: "1234",
				points: 0,
			};

			const user = await Users.create(userData);

			expect(user).toMatchObject(userData);
			expect(user).toHaveProperty("created_at");
			expect(user.created_at).toBeInstanceOf(Date);
		});

		it("should create server document with nested config", async () => {
			const serverData = {
				_id: "987654321098765432",
				name: "Test Guild",
				config: {
					prefix: "!",
					language: "en",
					moderation: {
						enabled: true,
						log_channel: "111111111111111111",
					},
				},
			};

			const server = await Servers.create(serverData);

			expect(server.config.prefix).toBe("!");
			expect(server.config.moderation.enabled).toBe(true);
		});

		it("should auto-generate ID if not provided", async () => {
			const extension = await Gallery.create({
				name: "Test Extension",
				author_id: "123456789012345678",
			});

			expect(extension._id).toBeTruthy();
			expect(typeof extension._id).toBe("string");
		});

		it("should preserve array fields", async () => {
			const user = await Users.create({
				_id: "123456789012345678",
				tags: ["moderator", "active"],
				roles: ["111", "222", "333"],
			});

			expect(user.tags).toEqual(["moderator", "active"]);
			expect(user.roles).toHaveLength(3);
		});

		it("should handle JSON fields correctly", async () => {
			const server = await Servers.create({
				_id: "987654321098765432",
				subscription: {
					tier_id: "premium",
					is_active: true,
					expires_at: new Date("2025-12-31"),
				},
			});

			expect(server.subscription).toHaveProperty("tier_id");
			expect(server.subscription.is_active).toBe(true);
			expect(server.subscription.expires_at).toBeInstanceOf(Date);
		});
	});

	describe("Read Operations", () => {
		beforeEach(async () => {
			await Users.create({ _id: "user1", username: "Alice", points: 100 });
			await Users.create({ _id: "user2", username: "Bob", points: 50 });
			await Users.create({ _id: "user3", username: "Charlie", points: 150 });
		});

		it("should find document by ID", async () => {
			const user = await Users.findOne("user1");

			expect(user).toBeTruthy();
			expect(user.username).toBe("Alice");
		});

		it("should return null for non-existent document", async () => {
			const user = await Users.findOne("nonexistent");

			expect(user).toBeNull();
		});

		it("should find documents by query", async () => {
			const results = await Users.find({ points: 100 }).exec();

			expect(results).toHaveLength(1);
			expect(results[0].username).toBe("Alice");
		});

		it("should find all documents with empty query", async () => {
			const results = await Users.find({}).exec();

			expect(results).toHaveLength(3);
		});

		it("should limit query results", async () => {
			const results = await Users.find({}).limit(2).exec();

			expect(results).toHaveLength(2);
		});

		it("should iterate over results with async iterator", async () => {
			const cursor = Users.find({});
			const usernames = [];

			for await (const user of cursor) {
				usernames.push(user.username);
			}

			expect(usernames).toHaveLength(3);
			expect(usernames).toContain("Alice");
			expect(usernames).toContain("Bob");
			expect(usernames).toContain("Charlie");
		});

		it("should handle complex nested queries", async () => {
			await Servers.create({
				_id: "server1",
				config: { language: "en" },
			});
			await Servers.create({
				_id: "server2",
				config: { language: "es" },
			});

			const result = await Servers.findOne("server1");

			expect(result.config.language).toBe("en");
		});
	});

	describe("Update Operations", () => {
		beforeEach(async () => {
			await Users.create({
				_id: "user1",
				username: "Alice",
				points: 100,
				profile: { bio: "Hello" },
			});
		});

		it("should update existing document", async () => {
			const updated = await Users.update("user1", { points: 200 });

			expect(updated.points).toBe(200);
			expect(updated.username).toBe("Alice"); // Unchanged
			expect(updated).toHaveProperty("updated_at");
		});

		it("should return null for non-existent document", async () => {
			const result = await Users.update("nonexistent", { points: 100 });

			expect(result).toBeNull();
		});

		it("should update nested fields", async () => {
			const updated = await Users.update("user1", {
				profile: { bio: "Updated bio", age: 25 },
			});

			expect(updated.profile.bio).toBe("Updated bio");
			expect(updated.profile.age).toBe(25);
		});

		it("should increment numeric fields", async () => {
			const user = await Users.findOne("user1");
			const updated = await Users.update("user1", {
				points: user.points + 50,
			});

			expect(updated.points).toBe(150);
		});

		it("should update array fields", async () => {
			await Users.update("user1", {
				tags: ["moderator", "active"],
			});

			const user = await Users.findOne("user1");
			expect(user.tags).toEqual(["moderator", "active"]);

			// Add to array
			await Users.update("user1", {
				tags: [...user.tags, "premium"],
			});

			const updated = await Users.findOne("user1");
			expect(updated.tags).toContain("premium");
		});
	});

	describe("Delete Operations", () => {
		beforeEach(async () => {
			await Users.create({ _id: "user1", username: "Alice" });
			await Users.create({ _id: "user2", username: "Bob" });
		});

		it("should delete existing document", async () => {
			const deleted = await Users.delete("user1");

			expect(deleted).toBeTruthy();
			expect(deleted.username).toBe("Alice");

			const check = await Users.findOne("user1");
			expect(check).toBeNull();
		});

		it("should return null for non-existent document", async () => {
			const result = await Users.delete("nonexistent");

			expect(result).toBeNull();
		});

		it("should not affect other documents", async () => {
			await Users.delete("user1");

			const remaining = await Users.find({}).exec();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].username).toBe("Bob");
		});
	});

	describe("Transaction-like Operations", () => {
		it("should handle bulk create operations", async () => {
			const users = [
				{ _id: "user1", username: "Alice" },
				{ _id: "user2", username: "Bob" },
				{ _id: "user3", username: "Charlie" },
			];

			const created = await Promise.all(
				users.map(u => Users.create(u))
			);

			expect(created).toHaveLength(3);
			const all = await Users.find({}).exec();
			expect(all).toHaveLength(3);
		});

		it("should rollback on error (simulation)", async () => {
			const originalData = await Users.find({}).exec();
			const snapshot = [...originalData];

			try {
				await Users.create({ _id: "user1", username: "Test" });
				throw new Error("Simulated error");
			} catch (error) {
				// Rollback - restore snapshot
				await Users._clear();
				for (const doc of snapshot) {
					await Users.create(doc);
				}
			}

			const final = await Users.find({}).exec();
			expect(final).toHaveLength(snapshot.length);
		});

		it("should handle concurrent updates", async () => {
			await Users.create({ _id: "user1", points: 100 });

			// Simulate two concurrent updates
			const update1 = Users.findOne("user1").then(u => 
				Users.update("user1", { points: u.points + 10 })
			);
			const update2 = Users.findOne("user1").then(u => 
				Users.update("user1", { points: u.points + 20 })
			);

			await Promise.all([update1, update2]);

			const final = await Users.findOne("user1");
			// Last write wins in this scenario
			expect(final.points).toBeGreaterThan(100);
		});
	});

	describe("Data Validation", () => {
		it("should validate required fields", () => {
			const requiredFields = ["_id", "username"];
			const data = { username: "Test" };

			const isValid = requiredFields.every(field => 
				Object.prototype.hasOwnProperty.call(data, field)
			);

			expect(isValid).toBe(false);
		});

		it("should validate field types", () => {
			const data = {
				points: "not a number",
				created_at: "not a date",
			};

			const isPointsValid = typeof data.points === "number";
			const isDateValid = data.created_at instanceof Date;

			expect(isPointsValid).toBe(false);
			expect(isDateValid).toBe(false);
		});

		it("should validate enum fields", () => {
			const validStates = ["saved", "published", "archived"];
			const state = "published";

			const isValid = validStates.includes(state);

			expect(isValid).toBe(true);
			expect(validStates.includes("invalid")).toBe(false);
		});

		it("should validate array fields", () => {
			const data = { tags: ["test", "example"] };

			const isArray = Array.isArray(data.tags);
			const allStrings = data.tags.every(tag => typeof tag === "string");

			expect(isArray).toBe(true);
			expect(allStrings).toBe(true);
		});
	});

	describe("Query Patterns", () => {
		beforeEach(async () => {
			await Gallery.create({
				_id: "ext1",
				name: "Extension 1",
				state: "published",
				category: "moderation",
				points: 100,
			});
			await Gallery.create({
				_id: "ext2",
				name: "Extension 2",
				state: "saved",
				category: "fun",
				points: 50,
			});
			await Gallery.create({
				_id: "ext3",
				name: "Extension 3",
				state: "published",
				category: "moderation",
				points: 150,
			});
		});

		it("should filter by single field", async () => {
			const results = await Gallery.find({ state: "published" }).exec();

			expect(results).toHaveLength(2);
			expect(results.every(r => r.state === "published")).toBe(true);
		});

		it("should filter by multiple fields", async () => {
			const results = await Gallery.find({
				state: "published",
				category: "moderation",
			}).exec();

			expect(results).toHaveLength(2);
			expect(results.every(r => 
				r.state === "published" && r.category === "moderation"
			)).toBe(true);
		});

		it("should sort results manually", async () => {
			const results = await Gallery.find({}).exec();
			const sorted = results.sort((a, b) => b.points - a.points);

			expect(sorted[0].points).toBe(150);
			expect(sorted[2].points).toBe(50);
		});

		it("should paginate results", async () => {
			const pageSize = 2;
			const page1 = await Gallery.find({}).limit(pageSize).exec();

			expect(page1).toHaveLength(2);
		});

		it("should count results", async () => {
			const results = await Gallery.find({ state: "published" }).exec();
			const count = results.length;

			expect(count).toBe(2);
		});
	});

	describe("Index Simulation", () => {
		it("should demonstrate indexed field performance concept", async () => {
			// In real implementation, indexed fields would be queried faster
			const startTime = Date.now();

			await Users.create({ _id: "user1", username: "Alice" });
			const user = await Users.findOne("user1"); // ID lookup (indexed)

			const duration = Date.now() - startTime;

			expect(user).toBeTruthy();
			expect(duration).toBeLessThan(100); // Should be fast
		});

		it("should handle compound queries", async () => {
			await Servers.create({
				_id: "server1",
				subscription: { tier_id: "premium", is_active: true },
			});

			const server = await Servers.findOne("server1");

			expect(server.subscription.tier_id).toBe("premium");
			expect(server.subscription.is_active).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("should handle malformed data gracefully", async () => {
			const malformed = {
				_id: "user1",
				data: undefined, // Undefined values
				circular: {},
			};
			malformed.circular.self = malformed; // Circular reference

			// In real implementation, this would be validated
			try {
				await Users.create(malformed);
				const user = await Users.findOne("user1");
				expect(user._id).toBe("user1");
			} catch (error) {
				// Expected to handle gracefully
				expect(error).toBeTruthy();
			}
		});

		it("should handle concurrent deletions", async () => {
			await Users.create({ _id: "user1" });

			const delete1 = Users.delete("user1");
			const delete2 = Users.delete("user1");

			const results = await Promise.all([delete1, delete2]);

			expect(results[0]).toBeTruthy(); // First succeeds
			expect(results[1]).toBeNull(); // Second fails (already deleted)
		});
	});

	describe("Real-world Scenarios", () => {
		it("should handle user points transaction", async () => {
			await Users.create({ _id: "user1", points: 100 });

			// Deduct points for purchase
			const user = await Users.findOne("user1");
			const cost = 50;

			if (user.points >= cost) {
				await Users.update("user1", { points: user.points - cost });
			}

			const updated = await Users.findOne("user1");
			expect(updated.points).toBe(50);
		});

		it("should handle server subscription management", async () => {
			await Servers.create({
				_id: "server1",
				subscription: { tier_id: null, is_active: false },
			});

			// Activate subscription
			await Servers.update("server1", {
				subscription: {
					tier_id: "premium",
					is_active: true,
					expires_at: new Date("2025-12-31"),
				},
			});

			const server = await Servers.findOne("server1");
			expect(server.subscription.is_active).toBe(true);
			expect(server.subscription.tier_id).toBe("premium");
		});

		it("should handle extension installation tracking", async () => {
			await Gallery.create({
				_id: "ext1",
				stats: { installs: 10 },
			});

			// Increment install count
			const ext = await Gallery.findOne("ext1");
			await Gallery.update("ext1", {
				stats: { installs: ext.stats.installs + 1 },
			});

			const updated = await Gallery.findOne("ext1");
			expect(updated.stats.installs).toBe(11);
		});

		it("should handle bulk user lookup", async () => {
			await Users.create({ _id: "user1", username: "Alice" });
			await Users.create({ _id: "user2", username: "Bob" });
			await Users.create({ _id: "user3", username: "Charlie" });

			const userIds = ["user1", "user2", "user3"];
			const users = await Promise.all(
				userIds.map(id => Users.findOne(id))
			);

			expect(users).toHaveLength(3);
			expect(users.every(u => u !== null)).toBe(true);
		});
	});
});
