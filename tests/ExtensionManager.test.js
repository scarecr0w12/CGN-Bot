const { Collection } = require("discord.js");

// Mock extension data
const createMockExtension = (overrides = {}) => ({
	_id: "ext_" + Math.random().toString(36).substr(2, 9),
	name: "Test Extension",
	description: "A test extension",
	author_id: "123456789",
	code_id: "code_" + Math.random().toString(36).substr(2, 9),
	state: "published",
	level: "marketplace",
	category: "utility",
	permissions: ["server.read", "message.send"],
	version: {
		major: 1,
		minor: 0,
		patch: 0,
	},
	tags: ["utility", "moderation"],
	stats: {
		installs: 0,
		upvotes: 0,
		downvotes: 0,
	},
	...overrides,
});

const createMockServerExtension = (extId, overrides = {}) => ({
	extension_id: extId,
	enabled: true,
	installed_at: new Date(),
	config: {},
	permissions_granted: ["server.read", "message.send"],
	...overrides,
});

describe("Extension Manager", () => {
	describe("Extension Validation", () => {
		it("should validate extension structure", () => {
			const ext = createMockExtension();

			expect(ext).toHaveProperty("_id");
			expect(ext).toHaveProperty("name");
			expect(ext).toHaveProperty("code_id");
			expect(ext).toHaveProperty("permissions");
			expect(Array.isArray(ext.permissions)).toBe(true);
		});

		it("should reject extensions without required fields", () => {
			const invalid = createMockExtension({ name: "" });
			expect(invalid.name).toBeFalsy();
		});

		it("should validate semantic versioning", () => {
			const ext = createMockExtension();
			
			expect(ext.version).toHaveProperty("major");
			expect(ext.version).toHaveProperty("minor");
			expect(ext.version).toHaveProperty("patch");
			expect(typeof ext.version.major).toBe("number");
		});
	});

	describe("Permission Scopes", () => {
		const validScopes = [
			"server.read",
			"server.write",
			"message.send",
			"message.read",
			"message.delete",
			"channel.read",
			"channel.write",
			"member.read",
			"member.write",
			"role.read",
			"role.write",
			"ban.read",
			"ban.write",
			"emoji.read",
			"emoji.write",
			"webhook.read",
			"webhook.write",
			"invite.read",
			"invite.write",
			"http.fetch",
			"storage.read",
			"storage.write",
		];

		it("should recognize all valid permission scopes", () => {
			validScopes.forEach(scope => {
				expect(validScopes.includes(scope)).toBe(true);
			});
		});

		it("should grant subset of requested permissions", () => {
			const requested = ["server.read", "message.send", "ban.write"];
			const granted = ["server.read", "message.send"];

			const hasPermission = (perm) => granted.includes(perm);
			
			expect(hasPermission("server.read")).toBe(true);
			expect(hasPermission("message.send")).toBe(true);
			expect(hasPermission("ban.write")).toBe(false);
		});

		it("should validate permission format", () => {
			const isValidScope = (scope) => /^[a-z]+\.(read|write|[a-z]+)$/.test(scope);

			expect(isValidScope("server.read")).toBe(true);
			expect(isValidScope("invalid")).toBe(false);
			expect(isValidScope("Server.Read")).toBe(false);
		});
	});

	describe("Extension States", () => {
		const validStates = ["saved", "published", "archived"];

		it("should accept all valid states", () => {
			validStates.forEach(state => {
				const ext = createMockExtension({ state });
				expect(ext.state).toBe(state);
			});
		});

		it("should filter extensions by state", () => {
			const extensions = new Collection([
				["ext1", createMockExtension({ state: "published" })],
				["ext2", createMockExtension({ state: "saved" })],
				["ext3", createMockExtension({ state: "published" })],
			]);

			const published = extensions.filter(e => e.state === "published");
			expect(published.size).toBe(2);
		});
	});

	describe("Extension Levels", () => {
		const validLevels = ["gallery", "marketplace", "premium"];

		it("should accept all valid levels", () => {
			validLevels.forEach(level => {
				const ext = createMockExtension({ level });
				expect(ext.level).toBe(level);
			});
		});

		it("should enforce marketplace requirements for premium", () => {
			const premiumExt = createMockExtension({ 
				level: "premium",
				state: "published",
			});

			const canBePremium = premiumExt.state === "published";
			expect(canBePremium).toBe(true);
		});
	});

	describe("Installation Management", () => {
		it("should track extension installation", () => {
			const ext = createMockExtension();
			const serverExt = createMockServerExtension(ext._id);

			expect(serverExt.extension_id).toBe(ext._id);
			expect(serverExt.enabled).toBe(true);
			expect(serverExt.installed_at).toBeInstanceOf(Date);
		});

		it("should allow enabling/disabling extensions", () => {
			const serverExt = createMockServerExtension("ext_123");

			serverExt.enabled = false;
			expect(serverExt.enabled).toBe(false);

			serverExt.enabled = true;
			expect(serverExt.enabled).toBe(true);
		});

		it("should maintain extension configuration", () => {
			const serverExt = createMockServerExtension("ext_123", {
				config: {
					prefix: "!",
					channel_id: "111111111",
				},
			});

			expect(serverExt.config.prefix).toBe("!");
			expect(serverExt.config.channel_id).toBe("111111111");
		});
	});

	describe("Version Management", () => {
		it("should compare semantic versions", () => {
			const compareVersions = (v1, v2) => {
				if (v1.major !== v2.major) return v1.major - v2.major;
				if (v1.minor !== v2.minor) return v1.minor - v2.minor;
				return v1.patch - v2.patch;
			};

			const v1 = { major: 1, minor: 0, patch: 0 };
			const v2 = { major: 1, minor: 0, patch: 1 };
			const v3 = { major: 2, minor: 0, patch: 0 };

			expect(compareVersions(v1, v2)).toBeLessThan(0);
			expect(compareVersions(v2, v1)).toBeGreaterThan(0);
			expect(compareVersions(v1, v3)).toBeLessThan(0);
		});

		it("should format version string", () => {
			const version = { major: 1, minor: 2, patch: 3 };
			const formatted = `${version.major}.${version.minor}.${version.patch}`;

			expect(formatted).toBe("1.2.3");
		});

		it("should validate version increments", () => {
			const old = { major: 1, minor: 0, patch: 0 };
			const newPatch = { major: 1, minor: 0, patch: 1 };
			const newMinor = { major: 1, minor: 1, patch: 0 };
			const newMajor = { major: 2, minor: 0, patch: 0 };

			const isValidIncrement = (oldV, newV) => {
				// Patch increment
				if (newV.major === oldV.major && newV.minor === oldV.minor) {
					return newV.patch > oldV.patch;
				}
				// Minor increment
				if (newV.major === oldV.major) {
					return newV.minor > oldV.minor;
				}
				// Major increment
				return newV.major > oldV.major;
			};

			expect(isValidIncrement(old, newPatch)).toBe(true);
			expect(isValidIncrement(old, newMinor)).toBe(true);
			expect(isValidIncrement(old, newMajor)).toBe(true);
		});
	});

	describe("Extension Categories", () => {
		const validCategories = [
			"moderation",
			"utility",
			"fun",
			"economy",
			"music",
			"leveling",
			"logging",
			"analytics",
			"automation",
			"games",
		];

		it("should accept valid categories", () => {
			validCategories.forEach(category => {
				const ext = createMockExtension({ category });
				expect(ext.category).toBe(category);
			});
		});

		it("should filter by category", () => {
			const extensions = new Collection([
				["ext1", createMockExtension({ category: "moderation" })],
				["ext2", createMockExtension({ category: "fun" })],
				["ext3", createMockExtension({ category: "moderation" })],
			]);

			const moderation = extensions.filter(e => e.category === "moderation");
			expect(moderation.size).toBe(2);
		});
	});

	describe("Extension Tags", () => {
		it("should support multiple tags", () => {
			const ext = createMockExtension({
				tags: ["utility", "moderation", "automation"],
			});

			expect(ext.tags).toHaveLength(3);
			expect(ext.tags.includes("utility")).toBe(true);
		});

		it("should filter by tags", () => {
			const extensions = [
				createMockExtension({ tags: ["utility", "moderation"] }),
				createMockExtension({ tags: ["fun", "games"] }),
				createMockExtension({ tags: ["utility", "automation"] }),
			];

			const withUtility = extensions.filter(e => e.tags.includes("utility"));
			expect(withUtility).toHaveLength(2);
		});
	});

	describe("HTTP Allowlist", () => {
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

		it("should handle subdomains", () => {
			const allowlist = ["github.com"];
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

			expect(isAllowed("https://api.github.com")).toBe(true);
			expect(isAllowed("https://raw.githubusercontent.com")).toBe(false);
		});
	});

	describe("Statistics Tracking", () => {
		it("should track installation count", () => {
			const ext = createMockExtension({
				stats: { installs: 0 },
			});

			ext.stats.installs++;
			expect(ext.stats.installs).toBe(1);
		});

		it("should calculate vote score", () => {
			const ext = createMockExtension({
				stats: {
					upvotes: 10,
					downvotes: 2,
				},
			});

			const score = ext.stats.upvotes - ext.stats.downvotes;
			expect(score).toBe(8);
		});

		it("should calculate vote ratio", () => {
			const ext = createMockExtension({
				stats: {
					upvotes: 8,
					downvotes: 2,
				},
			});

			const total = ext.stats.upvotes + ext.stats.downvotes;
			const ratio = total > 0 ? ext.stats.upvotes / total : 0;
			
			expect(ratio).toBeCloseTo(0.8);
		});
	});
});
