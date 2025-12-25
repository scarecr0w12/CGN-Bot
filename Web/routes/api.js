const { rateLimit } = require("express-rate-limit");
const Redis = require("../../Database/Redis");

const { setupResource } = require("../helpers");
const middleware = require("../middleware");
const controllers = require("../controllers");

// Build rate limiter with Redis store if available (cross-shard rate limiting)
const buildApiRateLimiter = () => {
	const options = {
		windowMs: 3600000, // 1 hour
		max: 150,
		standardHeaders: true,
		legacyHeaders: false,
		message: { error: "Too many requests, please try again later." },
	};

	if (Redis.isEnabled() && Redis.isReady()) {
		const { RedisStore } = require("rate-limit-redis");
		options.store = new RedisStore({
			sendCommand: (...args) => Redis.getClient().call(...args),
			prefix: "rl:api:",
		});
	}

	return rateLimit(options);
};

// SkynetBot Data API
module.exports = router => {
	// Configure RateLimit with Redis store for cross-shard consistency
	// Note: Rate limiting bypass checks user's servers for api_unlimited feature
	const apiRateLimiter = buildApiRateLimiter();

	router.use("/api/", async (req, res, next) => {
		if (req.isAuthenticated()) {
			const TierManager = require("../../Modules/TierManager");
			// Check if any server the user owns/administers has api_unlimited
			const serverId = req.params?.svrid || req.query?.svrid;
			if (serverId) {
				const hasUnlimited = await TierManager.canAccess(serverId, "api_unlimited");
				if (hasUnlimited) {
					return next();
				}
			}
		}
		// Apply rate limit for requests without premium server context
		apiRateLimiter(req, res, next);
	});

	// Public endpoints (no api_access required)
	setupResource(router, "/", [], controllers.api.status, "get", "public");
	setupResource(router, "/status", [], controllers.status.api, "get", "public");
	setupResource(router, "/status/shards", [], controllers.status.shards, "get", "public");
	setupResource(router, "/servers", [], controllers.api.servers, "get", "public");
	setupResource(router, "/extensions", [], controllers.api.extensions, "get", "public");
	setupResource(router, "/extensions/:extid/purchase", [], controllers.api.extensions.purchase, "post", "authentication");
	setupResource(router, "/extensions/:extid/ownership", [], controllers.api.extensions.ownership, "get", "authentication");
	setupResource(router, "/feedback", [], controllers.console.feedback.submit, "post", "public");

	// Matomo proxy for Grafana dashboards
	const matomoProxy = require("../controllers/matomo-proxy");
	setupResource(router, "/matomo", [], matomoProxy, "get", "public");

	// Public list endpoints for autocomplete
	setupResource(router, "/list/servers", [], controllers.api.servers.list, "get", "public");
	setupResource(router, "/list/users", [], controllers.api.users.list, "get", "public");

	// Protected endpoints (require api_access feature)
	setupResource(router, "/servers/:svrid/channels", [middleware.requireFeature("api_access")], controllers.api.servers.channels, "get", "authorization");
	setupResource(router, "/users", [middleware.requireFeature("api_access")], controllers.api.users, "get", "authentication");

	// Server Profile API (Tier 1+) - must be before 404 handler
	setupResource(router, "/server/:serverId/profile", [], controllers.server.updateProfile, "post", "authentication");

	// User preferences API
	setupResource(router, "/user/language", [], controllers.api.user.language, "post", "authentication");

	// 404 handler
	setupResource(router, "/*", [], (req, res) => res.sendStatus(404), "all", "public");
};
