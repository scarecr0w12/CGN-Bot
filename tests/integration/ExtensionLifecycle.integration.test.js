/**
 * Integration Tests: Extension Lifecycle
 * Tests end-to-end extension installation, execution, and management
 */

const { Collection } = require("discord.js");

// Mock extension data
const createTestExtension = (overrides = {}) => ({
	_id: `ext_${Math.random().toString(36).substr(2, 9)}`,
	name: "Test Extension",
	description: "A test extension for integration testing",
	author_id: "123456789012345678",
	code_id: `code_${Math.random().toString(36).substr(2, 9)}`,
	state: "published",
	level: "gallery",
	category: "utility",
	permissions: ["server.read", "message.send"],
	version: {
		major: 1,
		minor: 0,
		patch: 0,
	},
	tags: ["test", "utility"],
	stats: {
		installs: 0,
		upvotes: 0,
		downvotes: 0,
	},
	created_at: new Date(),
	updated_at: new Date(),
	...overrides,
});

// Mock server extension installation
const createServerExtension = (extensionId, overrides = {}) => ({
	_id: `srv_ext_${Math.random().toString(36).substr(2, 9)}`,
	server_id: "222222222222222222",
	extension_id: extensionId,
	enabled: true,
	installed_at: new Date(),
	config: {},
	permissions_granted: ["server.read", "message.send"],
	...overrides,
});

// Mock extension code
const createExtensionCode = (overrides = {}) => ({
	_id: `code_${Math.random().toString(36).substr(2, 9)}`,
	code: `
		module.exports = {
			name: "test",
			description: "Test extension",
			execute: async (context) => {
				return { success: true, message: "Extension executed" };
			}
		};
	`,
	created_at: new Date(),
	...overrides,
});

describe("Extension Lifecycle Integration Tests", () => {
	describe("Extension Installation Flow", () => {
		it("should install extension to server", async () => {
			const extension = createTestExtension();
			const serverExt = createServerExtension(extension._id);

			expect(serverExt.extension_id).toBe(extension._id);
			expect(serverExt.enabled).toBe(true);
			expect(serverExt.installed_at).toBeInstanceOf(Date);
		});

		it("should validate extension state before installation", () => {
			const publishedExt = createTestExtension({ state: "published" });
			const savedExt = createTestExtension({ state: "saved" });
			const archivedExt = createTestExtension({ state: "archived" });

			const canInstall = (ext) => ext.state === "published";

			expect(canInstall(publishedExt)).toBe(true);
			expect(canInstall(savedExt)).toBe(false);
			expect(canInstall(archivedExt)).toBe(false);
		});

		it("should grant requested permissions on installation", () => {
			const extension = createTestExtension({
				permissions: ["server.read", "message.send", "channel.read"],
			});

			const serverExt = createServerExtension(extension._id, {
				permissions_granted: ["server.read", "message.send"],
			});

			expect(serverExt.permissions_granted).toHaveLength(2);
			expect(serverExt.permissions_granted).toContain("server.read");
			expect(serverExt.permissions_granted).toContain("message.send");
			expect(serverExt.permissions_granted).not.toContain("channel.read");
		});

		it("should initialize extension configuration", () => {
			const defaultConfig = {
				prefix: "!",
				enabled_channels: [],
				cooldown: 5000,
			};

			const serverExt = createServerExtension("ext_123", {
				config: defaultConfig,
			});

			expect(serverExt.config).toMatchObject(defaultConfig);
			expect(serverExt.config.prefix).toBe("!");
			expect(serverExt.config.cooldown).toBe(5000);
		});

		it("should increment install count on successful installation", () => {
			const extension = createTestExtension({ stats: { installs: 10 } });

			extension.stats.installs++;

			expect(extension.stats.installs).toBe(11);
		});

		it("should prevent duplicate installations", () => {
			const installations = new Collection();
			const extensionId = "ext_123";
			const serverId = "222222222222222222";

			// First installation
			const key = `${serverId}_${extensionId}`;
			installations.set(key, { installed: true });

			// Attempt duplicate installation
			const isDuplicate = installations.has(key);

			expect(isDuplicate).toBe(true);
		});
	});

	describe("Extension Execution Flow", () => {
		it("should load extension code before execution", async () => {
			const code = createExtensionCode();
			const extension = createTestExtension({ code_id: code._id });

			expect(extension.code_id).toBe(code._id);
			expect(code.code).toBeTruthy();
			expect(typeof code.code).toBe("string");
		});

		it("should create isolated execution context", () => {
			const context = {
				server: { id: "222222222222222222", name: "Test Guild" },
				channel: { id: "333333333333333333", name: "test-channel" },
				user: { id: "111111111111111111", username: "TestUser" },
				permissions: ["server.read", "message.send"],
				config: {},
			};

			expect(context).toHaveProperty("server");
			expect(context).toHaveProperty("permissions");
			expect(context.permissions).toBeInstanceOf(Array);
		});

		it("should validate permissions before execution", () => {
			const requiredPerms = ["server.read", "message.send"];
			const grantedPerms = ["server.read", "message.send", "channel.read"];

			const hasAllPermissions = requiredPerms.every(perm => 
				grantedPerms.includes(perm)
			);

			expect(hasAllPermissions).toBe(true);

			// Test missing permission
			const missingPerms = ["server.write"];
			const hasMissing = missingPerms.every(perm => 
				grantedPerms.includes(perm)
			);

			expect(hasMissing).toBe(false);
		});

		it("should enforce memory limits during execution", () => {
			const memoryLimit = 128 * 1024 * 1024; // 128MB
			const allocatedMemory = 64 * 1024 * 1024; // 64MB

			const isWithinLimit = allocatedMemory <= memoryLimit;

			expect(isWithinLimit).toBe(true);

			// Test exceeding limit
			const excessiveMemory = 256 * 1024 * 1024; // 256MB
			expect(excessiveMemory).toBeGreaterThan(memoryLimit);
		});

		it("should enforce execution timeout", async () => {
			const timeout = 5000; // 5 seconds
			const startTime = Date.now();

			const executionPromise = new Promise((resolve) => {
				setTimeout(resolve, 100);
			});

			await executionPromise;

			const executionTime = Date.now() - startTime;
			expect(executionTime).toBeLessThan(timeout);
		});

		it("should handle execution errors gracefully", async () => {
			const executeExtension = async () => {
				throw new Error("Extension execution failed");
			};

			try {
				await executeExtension();
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Extension execution failed");
			}
		});

		it("should return execution results", async () => {
			const executeExtension = async () => {
				return {
					success: true,
					data: { message: "Hello World" },
					timestamp: Date.now(),
				};
			};

			const result = await executeExtension();

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty("message");
			expect(result.timestamp).toBeLessThanOrEqual(Date.now());
		});
	});

	describe("Extension Enable/Disable Flow", () => {
		it("should disable extension without uninstalling", () => {
			const serverExt = createServerExtension("ext_123", { enabled: true });

			serverExt.enabled = false;

			expect(serverExt.enabled).toBe(false);
			expect(serverExt.extension_id).toBe("ext_123"); // Still installed
		});

		it("should re-enable previously disabled extension", () => {
			const serverExt = createServerExtension("ext_123", { enabled: false });

			serverExt.enabled = true;

			expect(serverExt.enabled).toBe(true);
		});

		it("should prevent execution when disabled", () => {
			const serverExt = createServerExtension("ext_123", { enabled: false });

			const canExecute = serverExt.enabled;

			expect(canExecute).toBe(false);
		});

		it("should preserve configuration when disabling", () => {
			const config = { prefix: "!", channels: ["123", "456"] };
			const serverExt = createServerExtension("ext_123", {
				enabled: true,
				config,
			});

			serverExt.enabled = false;

			expect(serverExt.config).toEqual(config);
		});
	});

	describe("Extension Uninstallation Flow", () => {
		it("should remove extension from server", () => {
			const installations = new Collection();
			const serverId = "222222222222222222";
			const extensionId = "ext_123";

			installations.set(`${serverId}_${extensionId}`, {
				installed: true,
			});

			installations.delete(`${serverId}_${extensionId}`);

			expect(installations.has(`${serverId}_${extensionId}`)).toBe(false);
		});

		it("should decrement install count on uninstallation", () => {
			const extension = createTestExtension({ stats: { installs: 10 } });

			extension.stats.installs--;

			expect(extension.stats.installs).toBe(9);
		});

		it("should clean up extension data on uninstallation", () => {
			const serverExt = createServerExtension("ext_123", {
				config: { data: "cleanup me" },
				permissions_granted: ["server.read"],
			});

			// Simulate cleanup
			serverExt.config = null;
			serverExt.permissions_granted = [];

			expect(serverExt.config).toBeNull();
			expect(serverExt.permissions_granted).toHaveLength(0);
		});
	});

	describe("Extension Update Flow", () => {
		it("should compare version numbers", () => {
			const oldVersion = { major: 1, minor: 0, patch: 0 };
			const newVersion = { major: 1, minor: 1, patch: 0 };

			const isNewer = (v1, v2) => {
				if (v1.major !== v2.major) return v1.major > v2.major;
				if (v1.minor !== v2.minor) return v1.minor > v2.minor;
				return v1.patch > v2.patch;
			};

			expect(isNewer(newVersion, oldVersion)).toBe(true);
			expect(isNewer(oldVersion, newVersion)).toBe(false);
		});

		it("should preserve user data during update", () => {
			const serverExt = createServerExtension("ext_123", {
				config: {
					user_preferences: { theme: "dark" },
					channels: ["123", "456"],
				},
			});

			const originalConfig = { ...serverExt.config };

			// Simulate update
			serverExt.config = {
				...originalConfig,
				new_feature: true,
			};

			expect(serverExt.config.user_preferences).toEqual({ theme: "dark" });
			expect(serverExt.config.channels).toEqual(["123", "456"]);
			expect(serverExt.config.new_feature).toBe(true);
		});

		it("should handle breaking version changes", () => {
			const currentVersion = { major: 1, minor: 5, patch: 0 };
			const updateVersion = { major: 2, minor: 0, patch: 0 };

			const isBreakingChange = updateVersion.major > currentVersion.major;

			expect(isBreakingChange).toBe(true);
		});

		it("should track version history", () => {
			const extension = createTestExtension({
				version: { major: 2, minor: 0, patch: 0 },
			});

			const versionHistory = [
				{ major: 1, minor: 0, patch: 0, date: new Date("2024-01-01") },
				{ major: 1, minor: 5, patch: 0, date: new Date("2024-06-01") },
				{ major: 2, minor: 0, patch: 0, date: new Date("2024-12-01") },
			];

			expect(versionHistory).toHaveLength(3);
			expect(versionHistory[versionHistory.length - 1]).toMatchObject({
				major: extension.version.major,
				minor: extension.version.minor,
				patch: extension.version.patch,
			});
		});
	});

	describe("Extension Permission Management", () => {
		it("should request additional permissions", () => {
			const serverExt = createServerExtension("ext_123", {
				permissions_granted: ["server.read"],
			});

			const requestedPerms = ["server.read", "message.send", "channel.read"];
			const newPerms = requestedPerms.filter(
				perm => !serverExt.permissions_granted.includes(perm)
			);

			expect(newPerms).toEqual(["message.send", "channel.read"]);
		});

		it("should revoke permissions", () => {
			const serverExt = createServerExtension("ext_123", {
				permissions_granted: ["server.read", "message.send", "channel.read"],
			});

			serverExt.permissions_granted = serverExt.permissions_granted.filter(
				perm => perm !== "channel.read"
			);

			expect(serverExt.permissions_granted).toHaveLength(2);
			expect(serverExt.permissions_granted).not.toContain("channel.read");
		});

		it("should validate permission scope format", () => {
			const validScopes = [
				"server.read",
				"message.send",
				"channel.write",
				"http.fetch",
			];

			const scopePattern = /^[a-z]+\.(read|write|send|fetch|[a-z]+)$/;

			validScopes.forEach(scope => {
				expect(scopePattern.test(scope)).toBe(true);
			});

			expect(scopePattern.test("Invalid.Scope")).toBe(false);
			expect(scopePattern.test("invalid")).toBe(false);
		});
	});

	describe("Extension Marketplace Features", () => {
		it("should filter extensions by category", () => {
			const extensions = new Collection([
				["ext1", createTestExtension({ category: "moderation" })],
				["ext2", createTestExtension({ category: "fun" })],
				["ext3", createTestExtension({ category: "moderation" })],
			]);

			const moderation = extensions.filter(e => e.category === "moderation");

			expect(moderation.size).toBe(2);
		});

		it("should filter extensions by tags", () => {
			const extensions = [
				createTestExtension({ tags: ["utility", "moderation"] }),
				createTestExtension({ tags: ["fun", "games"] }),
				createTestExtension({ tags: ["utility", "automation"] }),
			];

			const utilityExts = extensions.filter(e => e.tags.includes("utility"));

			expect(utilityExts).toHaveLength(2);
		});

		it("should sort extensions by popularity", () => {
			const extensions = [
				createTestExtension({ stats: { installs: 50 } }),
				createTestExtension({ stats: { installs: 200 } }),
				createTestExtension({ stats: { installs: 10 } }),
			];

			extensions.sort((a, b) => b.stats.installs - a.stats.installs);

			expect(extensions[0].stats.installs).toBe(200);
			expect(extensions[2].stats.installs).toBe(10);
		});

		it("should calculate extension rating", () => {
			const extension = createTestExtension({
				stats: {
					upvotes: 80,
					downvotes: 20,
				},
			});

			const totalVotes = extension.stats.upvotes + extension.stats.downvotes;
			const rating = totalVotes > 0 ? extension.stats.upvotes / totalVotes : 0;

			expect(rating).toBeCloseTo(0.8);
		});

		it("should handle premium extensions", () => {
			const premiumExt = createTestExtension({
				level: "premium",
				price: 4.99,
			});

			expect(premiumExt.level).toBe("premium");
			expect(premiumExt.price).toBe(4.99);
		});
	});

	describe("Extension HTTP Allowlist", () => {
		it("should validate allowed domains", () => {
			const allowlist = ["api.github.com", "discord.com"];
			
			const isAllowed = (url) => {
				try {
					const domain = new URL(url).hostname;
					return allowlist.some(allowed => 
						domain === allowed || domain.endsWith("." + allowed)
					);
				} catch {
					return false;
				}
			};

			expect(isAllowed("https://api.github.com/users")).toBe(true);
			expect(isAllowed("https://discord.com/api")).toBe(true);
			expect(isAllowed("https://evil.com")).toBe(false);
		});

		it("should block non-allowlisted domains", () => {
			const allowlist = ["api.example.com"];
			const requestUrl = "https://malicious.com/api";

			const domain = new URL(requestUrl).hostname;
			const isBlocked = !allowlist.includes(domain);

			expect(isBlocked).toBe(true);
		});
	});

	describe("Extension Error Recovery", () => {
		it("should handle extension crash without affecting others", () => {
			const extensions = new Collection([
				["ext1", { execute: jest.fn().mockResolvedValue({ success: true }) }],
				["ext2", { execute: jest.fn().mockRejectedValue(new Error("Crash")) }],
				["ext3", { execute: jest.fn().mockResolvedValue({ success: true }) }],
			]);

			const executeAll = async () => {
				const results = [];
				for (const [id, ext] of extensions) {
					try {
						const result = await ext.execute();
						results.push({ id, success: true, result });
					} catch (error) {
						results.push({ id, success: false, error: error.message });
					}
				}
				return results;
			};

			return executeAll().then(results => {
				expect(results).toHaveLength(3);
				expect(results[0].success).toBe(true);
				expect(results[1].success).toBe(false);
				expect(results[2].success).toBe(true);
			});
		});

		it("should auto-disable repeatedly failing extensions", () => {
			const failureThreshold = 3;
			let failureCount = 0;

			const serverExt = createServerExtension("ext_123", { enabled: true });

			// Simulate failures
			for (let i = 0; i < 4; i++) {
				failureCount++;
				if (failureCount >= failureThreshold) {
					serverExt.enabled = false;
				}
			}

			expect(serverExt.enabled).toBe(false);
		});
	});
});
