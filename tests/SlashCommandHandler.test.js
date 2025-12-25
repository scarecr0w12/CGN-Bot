const { Collection } = require("discord.js");
const SlashCommandHandler = require("../Internals/SlashCommands/SlashCommandHandler");

describe("SlashCommandHandler", () => {
	let handler;
	let mockClient;

	beforeEach(() => {
		mockClient = {
			application: { id: "123456789" },
			user: { id: "123456789" },
		};
		handler = new SlashCommandHandler(mockClient);
	});

	describe("_mapSlashOptionType", () => {
		it("should map string type correctly", () => {
			expect(handler._mapSlashOptionType("string")).toBe(3);
		});

		it("should map integer type correctly", () => {
			expect(handler._mapSlashOptionType("integer")).toBe(4);
		});

		it("should map number type correctly", () => {
			expect(handler._mapSlashOptionType("number")).toBe(10);
		});

		it("should map boolean type correctly", () => {
			expect(handler._mapSlashOptionType("boolean")).toBe(5);
		});

		it("should map user type correctly", () => {
			expect(handler._mapSlashOptionType("user")).toBe(6);
		});

		it("should map channel type correctly", () => {
			expect(handler._mapSlashOptionType("channel")).toBe(7);
		});

		it("should map role type correctly", () => {
			expect(handler._mapSlashOptionType("role")).toBe(8);
		});

		it("should return null for invalid type", () => {
			expect(handler._mapSlashOptionType("invalid")).toBeNull();
		});

		it("should handle case insensitivity", () => {
			expect(handler._mapSlashOptionType("STRING")).toBe(3);
			expect(handler._mapSlashOptionType("Integer")).toBe(4);
		});
	});

	describe("_isValidCommandName", () => {
		it("should accept valid lowercase names", () => {
			expect(handler._isValidCommandName("test")).toBe(true);
			expect(handler._isValidCommandName("my-command")).toBe(true);
			expect(handler._isValidCommandName("my_command")).toBe(true);
		});

		it("should accept names with numbers", () => {
			expect(handler._isValidCommandName("test123")).toBe(true);
		});

		it("should reject uppercase names", () => {
			expect(handler._isValidCommandName("Test")).toBe(false);
			expect(handler._isValidCommandName("TEST")).toBe(false);
		});

		it("should reject names with spaces", () => {
			expect(handler._isValidCommandName("test command")).toBe(false);
		});

		it("should reject names exceeding 32 characters", () => {
			expect(handler._isValidCommandName("a".repeat(33))).toBe(false);
		});

		it("should accept names at the 32 character limit", () => {
			expect(handler._isValidCommandName("a".repeat(32))).toBe(true);
		});

		it("should reject empty names", () => {
			expect(handler._isValidCommandName("")).toBe(false);
		});

		it("should reject null/undefined", () => {
			expect(handler._isValidCommandName(null)).toBe(false);
			expect(handler._isValidCommandName(undefined)).toBe(false);
		});

		it("should reject special characters", () => {
			expect(handler._isValidCommandName("test@command")).toBe(false);
			expect(handler._isValidCommandName("test.command")).toBe(false);
		});
	});

	describe("_buildSlashOptions", () => {
		it("should build basic string option", () => {
			const rawOptions = [
				{ type: "string", name: "query", description: "Search query", required: true },
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built).toHaveLength(1);
			expect(built[0]).toMatchObject({
				type: 3,
				name: "query",
				description: "Search query",
				required: true,
			});
		});

		it("should build option with choices", () => {
			const rawOptions = [
				{
					type: "string",
					name: "color",
					description: "Pick a color",
					choices: [
						{ name: "Red", value: "red" },
						{ name: "Blue", value: "blue" },
					],
				},
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built[0].choices).toHaveLength(2);
			expect(built[0].choices[0]).toEqual({ name: "Red", value: "red" });
		});

		it("should handle autocomplete option", () => {
			const rawOptions = [
				{ type: "string", name: "search", description: "Search", autocomplete: true },
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built[0].autocomplete).toBe(true);
		});

		it("should handle min/max values", () => {
			const rawOptions = [
				{
					type: "integer",
					name: "amount",
					description: "Amount",
					min_value: 1,
					max_value: 100,
				},
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built[0].min_value).toBe(1);
			expect(built[0].max_value).toBe(100);
		});

		it("should handle minValue/maxValue (camelCase)", () => {
			const rawOptions = [
				{
					type: "integer",
					name: "amount",
					description: "Amount",
					minValue: 1,
					maxValue: 100,
				},
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built[0].min_value).toBe(1);
			expect(built[0].max_value).toBe(100);
		});

		it("should handle min/max length for strings", () => {
			const rawOptions = [
				{
					type: "string",
					name: "text",
					description: "Text",
					min_length: 5,
					max_length: 50,
				},
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built[0].min_length).toBe(5);
			expect(built[0].max_length).toBe(50);
		});

		it("should filter out invalid options", () => {
			const rawOptions = [
				{ type: "string", name: "valid", description: "Valid option" },
				{ type: "invalid", name: "bad", description: "Bad option" },
				{ type: "string", name: "", description: "No name" },
				{ type: "string", name: "noDesc", description: "" },
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built).toHaveLength(1);
			expect(built[0].name).toBe("valid");
		});

		it("should handle empty array", () => {
			expect(handler._buildSlashOptions([])).toEqual([]);
		});

		it("should handle non-array input", () => {
			expect(handler._buildSlashOptions(null)).toEqual([]);
			expect(handler._buildSlashOptions(undefined)).toEqual([]);
			expect(handler._buildSlashOptions("string")).toEqual([]);
		});

		it("should convert names to lowercase", () => {
			const rawOptions = [
				{ type: "string", name: "TestName", description: "Test" },
			];
			const built = handler._buildSlashOptions(rawOptions);

			expect(built[0].name).toBe("testname");
		});
	});

	describe("_getClientId", () => {
		it("should return application ID if available", () => {
			expect(handler._getClientId()).toBe("123456789");
		});

		it("should return user ID if application ID not available", () => {
			handler.client.application = null;
			expect(handler._getClientId()).toBe("123456789");
		});

		it("should return null if neither available", () => {
			handler.client.application = null;
			handler.client.user = null;
			expect(handler._getClientId()).toBeNull();
		});
	});

	describe("_getRest", () => {
		const originalEnv = process.env.CLIENT_TOKEN;

		afterEach(() => {
			process.env.CLIENT_TOKEN = originalEnv;
		});

		it("should return null if token not set", () => {
			delete process.env.CLIENT_TOKEN;
			expect(handler._getRest()).toBeNull();
		});

		it("should create REST instance if token is set", () => {
			process.env.CLIENT_TOKEN = "test-token";
			const rest = handler._getRest();
			expect(rest).toBeTruthy();
			expect(rest.constructor.name).toBe("REST");
		});
	});

	describe("commands collection", () => {
		it("should initialize with empty Collection", () => {
			expect(handler.commands).toBeInstanceOf(Collection);
			expect(handler.commands.size).toBe(0);
		});
	});
});
