/**
 * ConfigManager Unit Tests
 * Tests for centralized configuration management
 */

// Mock the global logger
global.logger = {
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	verbose: jest.fn(),
};

// Mock SiteSettings global
global.SiteSettings = {
	findOne: jest.fn(),
	new: jest.fn(),
};

describe("ConfigManager", () => {
	let ConfigManager;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		// Mock SiteSettings findOne to return test data
		global.SiteSettings.findOne = jest.fn().mockResolvedValue({
			_id: "main",
			maintainers: ["user1", "user2"],
			sudoMaintainers: ["sudo1"],
			wikiContributors: ["wiki1"],
			userBlocklist: ["blocked1"],
			guildBlocklist: ["guild1"],
			activityBlocklist: [],
			botStatus: "online",
			botActivity: { name: "test", type: "PLAYING", twitchURL: "" },
			perms: {
				eval: 0,
				sudo: 2,
				management: 2,
				administration: 1,
				shutdown: 2,
			},
			pmForward: false,
			homepageMessageHTML: "",
			headerImage: "header-bg.jpg",
			injection: { headScript: "", footerHTML: "" },
		});

		ConfigManager = require("../Modules/ConfigManager");
	});

	describe("get()", () => {
		test("should return settings from database", async () => {
			const settings = await ConfigManager.get(true);

			expect(settings.maintainers).toContain("user1");
			expect(settings.maintainers).toContain("user2");
			expect(settings.sudoMaintainers).toContain("sudo1");
		});

		test("should return cached settings within TTL", async () => {
			// First call - fetches from DB
			await ConfigManager.get(true);
			expect(global.SiteSettings.findOne).toHaveBeenCalledTimes(1);

			// Second call - should use cache
			await ConfigManager.get();
			// Cache TTL is 30 seconds, so this should still be cached
			expect(global.SiteSettings.findOne).toHaveBeenCalledTimes(1);
		});

		test("should return defaults when no settings exist", async () => {
			global.SiteSettings.findOne.mockResolvedValue(null);

			const settings = await ConfigManager.get(true);

			expect(settings.maintainers).toEqual([]);
			expect(settings.botStatus).toBe("online");
		});
	});

	describe("isMaintainer()", () => {
		test("should return true for maintainers", async () => {
			const result = await ConfigManager.isMaintainer("user1");
			expect(result).toBe(true);
		});

		test("should return true for sudo maintainers", async () => {
			const result = await ConfigManager.isMaintainer("sudo1");
			expect(result).toBe(true);
		});

		test("should return false for non-maintainers", async () => {
			const result = await ConfigManager.isMaintainer("randomuser");
			expect(result).toBe(false);
		});
	});

	describe("isSudoMaintainer()", () => {
		test("should return true only for sudo maintainers", async () => {
			expect(await ConfigManager.isSudoMaintainer("sudo1")).toBe(true);
			expect(await ConfigManager.isSudoMaintainer("user1")).toBe(false);
		});
	});

	describe("isUserBlocked()", () => {
		test("should return true for blocked users", async () => {
			const result = await ConfigManager.isUserBlocked("blocked1");
			expect(result).toBe(true);
		});

		test("should return false for non-blocked users", async () => {
			const result = await ConfigManager.isUserBlocked("normaluser");
			expect(result).toBe(false);
		});
	});

	describe("isGuildBlocked()", () => {
		test("should return true for blocked guilds", async () => {
			const result = await ConfigManager.isGuildBlocked("guild1");
			expect(result).toBe(true);
		});

		test("should return false for non-blocked guilds", async () => {
			const result = await ConfigManager.isGuildBlocked("normalguild");
			expect(result).toBe(false);
		});
	});

	describe("canDo()", () => {
		test("should check permission levels correctly", async () => {
			// eval is level 0 (host only)
			process.env.SKYNET_HOST = "hostuser";
			expect(await ConfigManager.canDo("eval", "hostuser")).toBe(true);
			expect(await ConfigManager.canDo("eval", "user1")).toBe(false);

			// administration is level 1 (all maintainers)
			expect(await ConfigManager.canDo("administration", "user1")).toBe(true);
			expect(await ConfigManager.canDo("administration", "sudo1")).toBe(true);

			// sudo is level 2 (sudo maintainers only)
			expect(await ConfigManager.canDo("sudo", "sudo1")).toBe(true);
			expect(await ConfigManager.canDo("sudo", "user1")).toBe(false);
		});

		test("should return false for unknown actions", async () => {
			const result = await ConfigManager.canDo("unknownaction", "user1");
			expect(result).toBe(false);
		});
	});

	describe("getUserLevel()", () => {
		test("should return correct levels", async () => {
			process.env.SKYNET_HOST = "hostuser";

			expect(await ConfigManager.getUserLevel("hostuser")).toBe(0);
			expect(await ConfigManager.getUserLevel("sudo1")).toBe(2);
			expect(await ConfigManager.getUserLevel("user1")).toBe(1);
			expect(await ConfigManager.getUserLevel("randomuser")).toBe(-1);
		});
	});

	describe("invalidateCache()", () => {
		test("should clear the settings cache", async () => {
			// First call - fetches from DB
			await ConfigManager.get(true);

			// Invalidate cache
			ConfigManager.invalidateCache();

			// Next call should fetch from DB again
			await ConfigManager.get();
			expect(global.SiteSettings.findOne).toHaveBeenCalledTimes(2);
		});
	});

	describe("getCached()", () => {
		test("should return cached settings synchronously", async () => {
			// First load settings async
			await ConfigManager.get(true);

			// Then get cached version sync
			const cached = ConfigManager.getCached();
			expect(cached.maintainers).toContain("user1");
		});

		test("should return defaults if cache is empty", () => {
			ConfigManager.invalidateCache();
			const cached = ConfigManager.getCached();
			expect(cached.maintainers).toEqual([]);
		});
	});
});
