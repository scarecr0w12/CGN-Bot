/**
 * Auth Middleware Integration Tests
 * Tests for authentication and authorization middleware functions
 */

// Mock the global logger before any imports
global.logger = {
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	verbose: jest.fn(),
};

// Mock ConfigManager
jest.mock("../Modules/ConfigManager", () => ({
	get: jest.fn().mockResolvedValue({
		maintainers: ["maintainer123"],
		sudoMaintainers: ["sudo123"],
		wikiContributors: ["wiki123"],
	}),
	canDo: jest.fn().mockResolvedValue(true),
	checkSudoMode: jest.fn().mockResolvedValue(false),
	getCached: jest.fn().mockReturnValue({
		maintainers: ["maintainer123"],
		sudoMaintainers: ["sudo123"],
		wikiContributors: ["wiki123"],
	}),
}));

// Mock GetGuild module
jest.mock("../Modules", () => ({
	getGuild: {
		GetGuild: jest.fn().mockImplementation((client, serverId) => ({
			id: serverId,
			success: true,
			members: {
				user123: { user: { id: "user123", username: "testuser" } },
			},
			initialize: jest.fn().mockResolvedValue(true),
		})),
	},
}));

// Mock global Servers
global.Servers = {
	findOne: jest.fn().mockResolvedValue({
		_id: "server123",
		config: { admins: { id: jest.fn().mockReturnValue(null) } },
		query: {},
	}),
	new: jest.fn().mockReturnValue({
		save: jest.fn().mockResolvedValue(true),
	}),
};

const { renderError } = require("../Web/helpers");

// Mock renderError
jest.mock("../Web/helpers", () => ({
	renderError: jest.fn(),
	parseAuthUser: jest.fn(user => user),
}));

describe("Auth Middleware", () => {
	let middleware;
	let mockReq;
	let mockRes;
	let mockNext;

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Initialize middleware object
		middleware = {};

		// Load the auth middleware
		require("../Web/middleware/auth")(middleware);

		// Create mock request
		mockReq = {
			params: {},
			query: {},
			path: "/test",
			method: "GET",
			protocol: "https",
			isAuthenticated: jest.fn().mockReturnValue(true),
			user: { id: "user123" },
			isAPI: false,
			app: {
				client: {
					users: {
						fetch: jest.fn().mockResolvedValue({ id: "user123" }),
					},
					user: { id: "bot123" },
					getUserBotAdmin: jest.fn().mockReturnValue(3),
				},
			},
		};

		// Create mock response
		mockRes = {
			sendStatus: jest.fn(),
			redirect: jest.fn(),
			status: jest.fn().mockReturnThis(),
			render: jest.fn(),
			res: {
				populateDashboard: jest.fn(),
				template: {},
			},
		};

		mockNext = jest.fn();
	});

	describe("authorizeGuildAccess", () => {
		test("should call next() if no svrid is provided", async () => {
			await middleware.authorizeGuildAccess(mockReq, mockRes, mockNext);
			expect(mockNext).toHaveBeenCalled();
		});

		test("should redirect to login if user is not authenticated", async () => {
			mockReq.params.svrid = "server123";
			mockReq.isAuthenticated.mockReturnValue(false);

			await middleware.authorizeGuildAccess(mockReq, mockRes, mockNext);

			expect(mockRes.redirect).toHaveBeenCalledWith("/login");
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should return 401 for API requests when not authenticated", async () => {
			mockReq.params.svrid = "server123";
			mockReq.isAuthenticated.mockReturnValue(false);
			mockReq.isAPI = true;

			await middleware.authorizeGuildAccess(mockReq, mockRes, mockNext);

			expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("authorizeConsoleAccess", () => {
		test("should redirect to login if not authenticated", async () => {
			mockReq.isAuthenticated.mockReturnValue(false);

			await middleware.authorizeConsoleAccess(mockReq, mockRes, mockNext);

			expect(mockRes.redirect).toHaveBeenCalledWith("/login");
		});

		test("should return 401 for API when not authenticated", async () => {
			mockReq.isAuthenticated.mockReturnValue(false);
			mockReq.isAPI = true;

			await middleware.authorizeConsoleAccess(mockReq, mockRes, mockNext);

			expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
		});

		test("should allow access for maintainers", async () => {
			mockReq.user.id = "maintainer123";
			mockReq.perm = "maintainer";

			await middleware.authorizeConsoleAccess(mockReq, mockRes, mockNext);

			expect(mockReq.isAuthorized).toBe(true);
			expect(mockNext).toHaveBeenCalled();
		});

		test("should deny access for non-maintainers", async () => {
			mockReq.user.id = "randomuser";
			mockReq.perm = "maintainer";

			await middleware.authorizeConsoleAccess(mockReq, mockRes, mockNext);

			expect(mockRes.redirect).toHaveBeenCalledWith("/dashboard");
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("authorizeDashboardAccess", () => {
		test("should redirect if no svrid provided", () => {
			middleware.authorizeDashboardAccess(mockReq, mockRes, mockNext);

			expect(mockRes.redirect).toHaveBeenCalledWith("/dashboard");
		});

		test("should return 400 for API if no svrid", () => {
			mockReq.isAPI = true;

			middleware.authorizeDashboardAccess(mockReq, mockRes, mockNext);

			expect(mockRes.sendStatus).toHaveBeenCalledWith(400);
		});
	});

	describe("authenticateResourceRequest", () => {
		test("should call next() if authenticated", () => {
			mockReq.isAuthenticated.mockReturnValue(true);

			middleware.authenticateResourceRequest(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		test("should return 401 if not authenticated", () => {
			mockReq.isAuthenticated.mockReturnValue(false);

			middleware.authenticateResourceRequest(mockReq, mockRes, mockNext);

			expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
		});
	});
});
