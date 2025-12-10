const { rateLimit } = require("express-rate-limit");

const { setupResource } = require("../helpers");
const middleware = require("../middleware");
const controllers = require("../controllers");

// SkynetBot Data API
module.exports = router => {
	// Configure RateLimit (bypassed for users with api_unlimited feature)
	router.use("/api/", async (req, res, next) => {
		// Check if authenticated user has api_unlimited feature
		if (req.isAuthenticated()) {
			const TierManager = require("../../Modules/TierManager");
			const hasUnlimited = await TierManager.canAccess(req.user.id, "api_unlimited");
			if (hasUnlimited) {
				return next();
			}
		}
		// Apply rate limit for users without api_unlimited
		rateLimit({
			windowMs: 3600000,
			max: 150,
			delayMs: 0,
		})(req, res, next);
	});

	// Public endpoints (no api_access required)
	setupResource(router, "/", [], controllers.api.status, "get", "public");
	setupResource(router, "/status", [], controllers.status.api, "get", "public");
	setupResource(router, "/servers", [], controllers.api.servers, "get", "public");
	setupResource(router, "/extensions", [], controllers.api.extensions, "get", "public");

	// Protected endpoints (require api_access feature)
	setupResource(router, "/servers/:svrid/channels", [middleware.requireFeature("api_access")], controllers.api.servers.channels, "get", "authorization");
	setupResource(router, "/list/servers", [middleware.requireFeature("api_access")], controllers.api.servers.list, "get", "authentication");
	setupResource(router, "/list/users", [middleware.requireFeature("api_access"), middleware.authorizeGuildAccess], controllers.api.users.list, "get", "authentication");
	setupResource(router, "/users", [middleware.requireFeature("api_access")], controllers.api.users, "get", "authentication");

	// 404 handler
	setupResource(router, "/*", [], (req, res) => res.sendStatus(404), "all", "public");
};
