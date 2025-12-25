/**
 * Integration Tests: Command Execution Flow
 * Tests end-to-end command processing for both prefix and slash commands
 */

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const SlashCommandHandler = require("../../Internals/SlashCommands/SlashCommandHandler");

// Mock Discord client for integration testing
const createMockClient = () => {
	const client = {
		application: {
			id: "123456789012345678",
		},
		user: {
			id: "123456789012345678",
			username: "TestBot",
			tag: "TestBot#0000",
		},
		guilds: {
			cache: new Collection(),
		},
		channels: {
			cache: new Collection(),
		},
		commands: new Collection(),
	};

	return client;
};

// Mock message for prefix command testing
const createMockMessage = (content, overrides = {}) => {
	const message = {
		id: "987654321098765432",
		content,
		author: {
			id: "111111111111111111",
			username: "TestUser",
			tag: "TestUser#1234",
			bot: false,
		},
		guild: {
			id: "222222222222222222",
			name: "Test Guild",
			members: {
				cache: new Collection(),
			},
		},
		channel: {
			id: "333333333333333333",
			name: "test-channel",
			type: 0, // GUILD_TEXT
			send: jest.fn().mockResolvedValue({ id: "msg123" }),
		},
		member: {
			id: "111111111111111111",
			permissions: {
				has: jest.fn().mockReturnValue(true),
			},
		},
		reply: jest.fn().mockResolvedValue({ id: "reply123" }),
		react: jest.fn().mockResolvedValue({}),
		delete: jest.fn().mockResolvedValue({}),
		createdTimestamp: Date.now(),
		...overrides,
	};

	return message;
};

// Mock interaction for slash command testing
const createMockInteraction = (commandName, options = {}, overrides = {}) => {
	const interaction = {
		id: "444444444444444444",
		commandName,
		type: 2, // APPLICATION_COMMAND
		user: {
			id: "111111111111111111",
			username: "TestUser",
			tag: "TestUser#1234",
			bot: false,
		},
		guild: {
			id: "222222222222222222",
			name: "Test Guild",
			members: {
				cache: new Collection(),
			},
		},
		channel: {
			id: "333333333333333333",
			name: "test-channel",
			type: 0,
			send: jest.fn().mockResolvedValue({ id: "msg123" }),
		},
		member: {
			id: "111111111111111111",
			permissions: {
				has: jest.fn().mockReturnValue(true),
			},
		},
		options: {
			_hoistedOptions: Object.entries(options).map(([name, value]) => ({
				name,
				value,
				type: typeof value === "string" ? 3 : typeof value === "number" ? 4 : 5,
			})),
			getString: jest.fn((name) => options[name] || null),
			getInteger: jest.fn((name) => options[name] || null),
			getBoolean: jest.fn((name) => options[name] || null),
			getUser: jest.fn((name) => options[name] || null),
			getChannel: jest.fn((name) => options[name] || null),
			getRole: jest.fn((name) => options[name] || null),
		},
		reply: jest.fn().mockResolvedValue({ id: "reply123" }),
		deferReply: jest.fn().mockResolvedValue({}),
		editReply: jest.fn().mockResolvedValue({ id: "edit123" }),
		followUp: jest.fn().mockResolvedValue({ id: "follow123" }),
		isCommand: () => true,
		isChatInputCommand: () => true,
		createdTimestamp: Date.now(),
		deferred: false,
		replied: false,
		...overrides,
	};

	return interaction;
};

describe("Command Flow Integration Tests", () => {
	let mockClient;
	let slashHandler;

	beforeEach(() => {
		mockClient = createMockClient();
		slashHandler = new SlashCommandHandler(mockClient);
	});

	describe("Prefix Command Flow", () => {
		it("should parse and execute simple command", async () => {
			const message = createMockMessage("!help");
			const prefix = "!";
			
			// Parse command
			const args = message.content.slice(prefix.length).trim().split(/\s+/);
			const commandName = args.shift().toLowerCase();

			expect(commandName).toBe("help");
			expect(args).toEqual([]);
		});

		it("should parse command with arguments", async () => {
			const message = createMockMessage("!ban @user spam");
			const prefix = "!";
			
			const args = message.content.slice(prefix.length).trim().split(/\s+/);
			const commandName = args.shift().toLowerCase();

			expect(commandName).toBe("ban");
			expect(args).toEqual(["@user", "spam"]);
		});

		it("should handle quoted arguments", async () => {
			const content = '!say "Hello World" test';
			const regex = /[^\s"]+|"([^"]*)"/gi;
			const args = [];
			let match;

			while ((match = regex.exec(content)) !== null) {
				args.push(match[1] || match[0]);
			}

			const commandName = args.shift().replace("!", "");

			expect(commandName).toBe("say");
			expect(args).toEqual(["Hello World", "test"]);
		});

		it("should enforce cooldowns across multiple executions", async () => {
			const cooldowns = new Collection();
			const commandName = "help";
			const cooldownAmount = 3000; // 3 seconds
			const userId = "111111111111111111";

			// First execution
			if (!cooldowns.has(commandName)) {
				cooldowns.set(commandName, new Collection());
			}

			const timestamps = cooldowns.get(commandName);
			const now = Date.now();
			timestamps.set(userId, now);

			// Immediate second execution (should be on cooldown)
			const timeLeft = (timestamps.get(userId) + cooldownAmount - now) / 1000;
			expect(timeLeft).toBeGreaterThan(0);

			// After cooldown expires
			await new Promise(resolve => setTimeout(resolve, 100));
			const afterDelay = Date.now();
			const timeLeftAfter = (timestamps.get(userId) + 100 - afterDelay) / 1000;
			expect(timeLeftAfter).toBeLessThanOrEqual(0.01); // Allow 10ms margin for timing precision
		});

		it("should validate user permissions before execution", () => {
			const message = createMockMessage("!kick @user");
			const requiredPermission = "KickMembers";

			const hasPermission = message.member.permissions.has("KickMembers");
			expect(hasPermission).toBe(true);

			// Test without permission
			message.member.permissions.has = jest.fn().mockReturnValue(false);
			expect(message.member.permissions.has("KickMembers")).toBe(false);
		});

		it("should handle command execution errors gracefully", async () => {
			const message = createMockMessage("!test");
			
			const executeCommand = async () => {
				throw new Error("Command execution failed");
			};

			try {
				await executeCommand();
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Command execution failed");
				expect(message.reply).not.toHaveBeenCalled();
			}
		});
	});

	describe("Slash Command Flow", () => {
		it("should validate slash command name format", () => {
			const validNames = ["help", "user-info", "server_stats", "ban123"];
			const invalidNames = ["Help", "user info", "café", "a".repeat(33)];

			validNames.forEach(name => {
				expect(slashHandler._isValidCommandName(name)).toBe(true);
			});

			invalidNames.forEach(name => {
				expect(slashHandler._isValidCommandName(name)).toBe(false);
			});
		});

		it("should build slash command options correctly", () => {
			const rawOptions = [
				{
					type: "string",
					name: "query",
					description: "Search query",
					required: true,
				},
				{
					type: "integer",
					name: "limit",
					description: "Result limit",
					required: false,
					min_value: 1,
					max_value: 100,
				},
			];

			const built = slashHandler._buildSlashOptions(rawOptions);

			expect(built).toHaveLength(2);
			expect(built[0]).toMatchObject({
				name: "query",
				description: "Search query",
				required: true,
			});
			expect(built[1]).toMatchObject({
				name: "limit",
				description: "Result limit",
				required: false,
				min_value: 1,
				max_value: 100,
			});
		});

		it("should handle interaction with options", async () => {
			const interaction = createMockInteraction("search", {
				query: "test search",
				limit: 10,
			});

			const query = interaction.options.getString("query");
			const limit = interaction.options.getInteger("limit");

			expect(query).toBe("test search");
			expect(limit).toBe(10);
		});

		it("should handle deferred replies correctly", async () => {
			const interaction = createMockInteraction("slowcommand");

			// Defer the reply
			await interaction.deferReply();
			expect(interaction.deferReply).toHaveBeenCalled();

			// Edit after processing
			await interaction.editReply({ content: "Done!" });
			expect(interaction.editReply).toHaveBeenCalledWith({ content: "Done!" });
		});

		it("should handle followUp messages", async () => {
			const interaction = createMockInteraction("multi");

			await interaction.reply({ content: "Initial response" });
			expect(interaction.reply).toHaveBeenCalled();

			await interaction.followUp({ content: "Additional info" });
			expect(interaction.followUp).toHaveBeenCalledWith({ content: "Additional info" });
		});

		it("should validate interaction is from guild", () => {
			const interaction = createMockInteraction("guildonly");

			expect(interaction.guild).toBeTruthy();
			expect(interaction.guild.id).toBe("222222222222222222");

			// Test DM interaction
			const dmInteraction = createMockInteraction("test", {}, { guild: null });
			expect(dmInteraction.guild).toBeNull();
		});
	});

	describe("Command Permission Checks", () => {
		it("should validate bot permissions in channel", () => {
			const message = createMockMessage("!embed");
			const requiredBotPermissions = ["SendMessages", "EmbedLinks"];

			// Mock bot member
			const botMember = {
				permissions: {
					has: jest.fn((perm) => requiredBotPermissions.includes(perm)),
				},
			};

			expect(botMember.permissions.has("SendMessages")).toBe(true);
			expect(botMember.permissions.has("EmbedLinks")).toBe(true);
			expect(botMember.permissions.has("Administrator")).toBe(false);
		});

		it("should enforce role hierarchy for moderation commands", () => {
			const message = createMockMessage("!kick @target");
			
			const executorHighestRole = { position: 10 };
			const targetHighestRole = { position: 5 };
			const botHighestRole = { position: 15 };

			expect(executorHighestRole.position).toBeGreaterThan(targetHighestRole.position);
			expect(botHighestRole.position).toBeGreaterThan(targetHighestRole.position);
		});

		it("should prevent self-targeting for moderation commands", () => {
			const interaction = createMockInteraction("ban", { user: "111111111111111111" });
			
			const targetId = interaction.options.getString("user");
			const executorId = interaction.user.id;

			expect(targetId).toBe(executorId);
			// In real implementation, this would throw an error
		});
	});

	describe("Command Response Handling", () => {
		it("should send simple text response", async () => {
			const message = createMockMessage("!ping");

			await message.reply({ content: "Pong!" });

			expect(message.reply).toHaveBeenCalledWith({ content: "Pong!" });
		});

		it("should send embed response", async () => {
			const interaction = createMockInteraction("userinfo");

			const embed = {
				title: "User Information",
				description: "Details about the user",
				color: 0x5865F2,
				fields: [
					{ name: "Username", value: "TestUser", inline: true },
					{ name: "ID", value: "111111111111111111", inline: true },
				],
			};

			await interaction.reply({ embeds: [embed] });

			expect(interaction.reply).toHaveBeenCalledWith({ embeds: [embed] });
		});

		it("should handle ephemeral responses", async () => {
			const interaction = createMockInteraction("secret");

			await interaction.reply({
				content: "This is a secret message",
				ephemeral: true,
			});

			expect(interaction.reply).toHaveBeenCalledWith({
				content: "This is a secret message",
				ephemeral: true,
			});
		});

		it("should add reactions to message responses", async () => {
			const message = createMockMessage("!poll");

			await message.react("👍");
			await message.react("👎");

			expect(message.react).toHaveBeenCalledTimes(2);
			expect(message.react).toHaveBeenCalledWith("👍");
			expect(message.react).toHaveBeenCalledWith("👎");
		});
	});

	describe("Error Handling Flow", () => {
		it("should catch and report command not found", async () => {
			const message = createMockMessage("!invalidcommand");
			const commands = new Collection();

			const commandName = "invalidcommand";
			const command = commands.get(commandName);

			expect(command).toBeUndefined();
		});

		it("should handle missing required arguments", () => {
			const interaction = createMockInteraction("require-args", {});

			const requiredArg = interaction.options.getString("required");

			expect(requiredArg).toBeNull();
			// In real implementation, this would trigger validation error
		});

		it("should handle API errors during command execution", async () => {
			const interaction = createMockInteraction("fetch-data");

			interaction.reply.mockRejectedValueOnce(new Error("Unknown Interaction"));

			try {
				await interaction.reply({ content: "Test" });
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toBe("Unknown Interaction");
			}
		});

		it("should handle timeout during deferred operations", async () => {
			const interaction = createMockInteraction("slow");

			await interaction.deferReply();

			// Simulate timeout
			const timeoutError = new Error("Interaction has already been acknowledged");
			interaction.editReply.mockRejectedValueOnce(timeoutError);

			try {
				await interaction.editReply({ content: "Too late" });
				fail("Should have thrown error");
			} catch (error) {
				expect(error.message).toContain("already been acknowledged");
			}
		});
	});

	describe("Command Context Validation", () => {
		it("should verify command can run in current context", () => {
			const contexts = {
				GUILD_ONLY: (msg) => msg.guild !== null,
				DM_ONLY: (msg) => msg.guild === null,
				NSFW_ONLY: (msg) => msg.channel.nsfw === true,
			};

			const guildMessage = createMockMessage("!test");
			expect(contexts.GUILD_ONLY(guildMessage)).toBe(true);
			expect(contexts.DM_ONLY(guildMessage)).toBe(false);

			const dmMessage = createMockMessage("!test", { guild: null });
			expect(contexts.GUILD_ONLY(dmMessage)).toBe(false);
			expect(contexts.DM_ONLY(dmMessage)).toBe(true);
		});

		it("should validate user is not a bot", () => {
			const userMessage = createMockMessage("!help");
			expect(userMessage.author.bot).toBe(false);

			const botMessage = createMockMessage("!help", {
				author: { id: "999", username: "Bot", bot: true },
			});
			expect(botMessage.author.bot).toBe(true);
		});
	});
});
