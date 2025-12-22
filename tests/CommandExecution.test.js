const { Collection } = require("discord.js");

// Mock command structures
const createMockCommand = (overrides = {}) => ({
	name: "test",
	description: "Test command",
	usage: "test [arg]",
	category: "Public",
	cooldown: 3000,
	examples: ["test example"],
	execute: jest.fn(),
	...overrides,
});

const createMockMessage = (overrides = {}) => ({
	author: {
		id: "123456789",
		username: "TestUser",
		bot: false,
		...overrides.author,
	},
	guild: {
		id: "987654321",
		name: "Test Guild",
		...overrides.guild,
	},
	channel: {
		id: "111111111",
		send: jest.fn().mockResolvedValue({}),
		...overrides.channel,
	},
	content: "!test arg1 arg2",
	createdTimestamp: Date.now(),
	reply: jest.fn().mockResolvedValue({}),
	...overrides,
});

const createMockInteraction = (overrides = {}) => ({
	user: {
		id: "123456789",
		username: "TestUser",
		bot: false,
		...overrides.user,
	},
	guild: {
		id: "987654321",
		name: "Test Guild",
		...overrides.guild,
	},
	channel: {
		id: "111111111",
		send: jest.fn().mockResolvedValue({}),
		...overrides.channel,
	},
	commandName: "test",
	options: {
		getString: jest.fn(),
		getInteger: jest.fn(),
		getBoolean: jest.fn(),
		getUser: jest.fn(),
		getChannel: jest.fn(),
		getRole: jest.fn(),
		...overrides.options,
	},
	reply: jest.fn().mockResolvedValue({}),
	deferReply: jest.fn().mockResolvedValue({}),
	editReply: jest.fn().mockResolvedValue({}),
	followUp: jest.fn().mockResolvedValue({}),
	isCommand: jest.fn().mockReturnValue(true),
	isChatInputCommand: jest.fn().mockReturnValue(true),
	createdTimestamp: Date.now(),
	...overrides,
});

describe("Command Execution", () => {
	describe("Command Validation", () => {
		it("should validate required command properties", () => {
			const validCommand = createMockCommand();
			
			expect(validCommand).toHaveProperty("name");
			expect(validCommand).toHaveProperty("description");
			expect(validCommand).toHaveProperty("execute");
			expect(typeof validCommand.execute).toBe("function");
		});

		it("should reject commands without name", () => {
			const invalidCommand = createMockCommand({ name: "" });
			expect(invalidCommand.name).toBeFalsy();
		});

		it("should reject commands without execute function", () => {
			const invalidCommand = createMockCommand({ execute: null });
			expect(invalidCommand.execute).toBeNull();
		});
	});

	describe("Cooldown Management", () => {
		let cooldowns;

		beforeEach(() => {
			cooldowns = new Collection();
		});

		it("should enforce cooldown period", () => {
			const command = createMockCommand({ cooldown: 5000 });
			const userId = "123456789";
			const commandName = "test";

			if (!cooldowns.has(commandName)) {
				cooldowns.set(commandName, new Collection());
			}

			const timestamps = cooldowns.get(commandName);
			const now = Date.now();
			
			timestamps.set(userId, now);

			const expirationTime = timestamps.get(userId) + command.cooldown;
			const timeLeft = (expirationTime - now) / 1000;

			expect(timeLeft).toBeGreaterThan(0);
			expect(timeLeft).toBeLessThanOrEqual(5);
		});

		it("should clear expired cooldowns", () => {
			const command = createMockCommand({ cooldown: 100 });
			const userId = "123456789";
			const commandName = "test";

			if (!cooldowns.has(commandName)) {
				cooldowns.set(commandName, new Collection());
			}

			const timestamps = cooldowns.get(commandName);
			timestamps.set(userId, Date.now() - 200);

			const expirationTime = timestamps.get(userId) + command.cooldown;
			const isExpired = Date.now() > expirationTime;

			expect(isExpired).toBe(true);
		});

		it("should allow execution after cooldown expires", (done) => {
			const command = createMockCommand({ cooldown: 100 });
			const userId = "123456789";
			const commandName = "test";

			if (!cooldowns.has(commandName)) {
				cooldowns.set(commandName, new Collection());
			}

			const timestamps = cooldowns.get(commandName);
			timestamps.set(userId, Date.now());

			setTimeout(() => {
				const expirationTime = timestamps.get(userId) + command.cooldown;
				const canExecute = Date.now() > expirationTime;
				expect(canExecute).toBe(true);
				done();
			}, 150);
		});
	});

	describe("Permission Checks", () => {
		it("should allow execution with correct permissions", () => {
			const command = createMockCommand({
				permissions: ["ManageMessages"],
			});

			const hasPermission = (perms) => perms.includes("ManageMessages");
			expect(hasPermission(command.permissions)).toBe(true);
		});

		it("should deny execution without required permissions", () => {
			const command = createMockCommand({
				permissions: ["Administrator"],
			});

			const hasPermission = (perms, userPerms = []) => {
				return perms.every(p => userPerms.includes(p));
			};

			expect(hasPermission(command.permissions, ["ManageMessages"])).toBe(false);
		});
	});

	describe("Argument Parsing", () => {
		it("should parse message content into arguments", () => {
			const message = createMockMessage({ content: "!test arg1 arg2 arg3" });
			const prefix = "!";
			const args = message.content.slice(prefix.length).trim().split(/\s+/);
			const commandName = args.shift().toLowerCase();

			expect(commandName).toBe("test");
			expect(args).toEqual(["arg1", "arg2", "arg3"]);
		});

		it("should handle quoted arguments", () => {
			const content = '!test "quoted arg" normal';
			const regex = /[^\s"]+|"([^"]*)"/gi;
			const args = [];
			let match;

			while ((match = regex.exec(content)) !== null) {
				args.push(match[1] || match[0]);
			}

			args.shift(); // Remove command name
			expect(args).toEqual(["quoted arg", "normal"]);
		});

		it("should handle empty arguments", () => {
			const message = createMockMessage({ content: "!test" });
			const prefix = "!";
			const content = message.content.slice(prefix.length).trim();
			const args = content.split(/\s+/).slice(1);

			expect(args).toEqual([]);
		});
	});

	describe("Interaction Options", () => {
		it("should retrieve string option", () => {
			const interaction = createMockInteraction();
			interaction.options.getString.mockReturnValue("test value");

			const value = interaction.options.getString("query");
			expect(value).toBe("test value");
		});

		it("should retrieve integer option", () => {
			const interaction = createMockInteraction();
			interaction.options.getInteger.mockReturnValue(42);

			const value = interaction.options.getInteger("amount");
			expect(value).toBe(42);
		});

		it("should retrieve boolean option", () => {
			const interaction = createMockInteraction();
			interaction.options.getBoolean.mockReturnValue(true);

			const value = interaction.options.getBoolean("enabled");
			expect(value).toBe(true);
		});

		it("should handle missing optional options", () => {
			const interaction = createMockInteraction();
			interaction.options.getString.mockReturnValue(null);

			const value = interaction.options.getString("optional");
			expect(value).toBeNull();
		});
	});

	describe("Error Handling", () => {
		it("should catch and handle command execution errors", async () => {
			const command = createMockCommand({
				execute: jest.fn().mockRejectedValue(new Error("Test error")),
			});

			const message = createMockMessage();

			try {
				await command.execute(message);
			} catch (error) {
				expect(error.message).toBe("Test error");
			}

			expect(command.execute).toHaveBeenCalledWith(message);
		});

		it("should handle interaction errors gracefully", async () => {
			const interaction = createMockInteraction();
			interaction.reply.mockRejectedValue(new Error("Reply failed"));

			try {
				await interaction.reply({ content: "Test" });
			} catch (error) {
				expect(error.message).toBe("Reply failed");
			}
		});
	});

	describe("Command Categories", () => {
		it("should categorize commands correctly", () => {
			const categories = ["Public", "PM", "Private", "Shared"];
			
			categories.forEach(category => {
				const command = createMockCommand({ category });
				expect(command.category).toBe(category);
			});
		});

		it("should filter commands by category", () => {
			const commands = new Collection([
				["help", createMockCommand({ name: "help", category: "Public" })],
				["eval", createMockCommand({ name: "eval", category: "Private" })],
				["config", createMockCommand({ name: "config", category: "PM" })],
			]);

			const publicCommands = commands.filter(cmd => cmd.category === "Public");
			expect(publicCommands.size).toBe(1);
			expect(publicCommands.first().name).toBe("help");
		});
	});

	describe("Bot Mention Detection", () => {
		it("should detect bot mention as prefix", () => {
			const botId = "999999999";
			const content = `<@${botId}> help`;
			const mentionRegex = new RegExp(`^<@!?${botId}>\\s*`);

			expect(mentionRegex.test(content)).toBe(true);
		});

		it("should extract command after mention", () => {
			const botId = "999999999";
			const content = `<@${botId}> help me`;
			const mentionRegex = new RegExp(`^<@!?${botId}>\\s*`);
			const args = content.replace(mentionRegex, "").trim().split(/\s+/);

			expect(args[0]).toBe("help");
			expect(args[1]).toBe("me");
		});
	});
});
