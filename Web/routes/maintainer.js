const { setupConsolePage, setupRedirection } = require("../helpers");
const controllers = require("../controllers");
const mw = require("../middleware");

const setMaintainerAPIContext = (req, res, next) => {
	req.perm = "maintainer";
	req.isAPI = true;
	next();
};

const setAdministrationContext = (req, res, next) => {
	req.perm = "administration";
	next();
};

const setAdministrationAPIContext = (req, res, next) => {
	req.perm = "administration";
	req.isAPI = true;
	next();
};

module.exports = router => {
	setupRedirection(router, "/", "/maintainer");

	router.post("/global-options/bot-lists/sync-commands", mw.checkUnavailableAPI, setAdministrationAPIContext, mw.authorizeConsoleAccess, controllers.console.options.botLists.syncCommands);

	setupConsolePage(router, "/maintainer", "maintainer", [], controllers.console.maintainer);
	setupConsolePage(router, "/servers/server-list", "maintainer", [], controllers.console.servers.list);
	setupConsolePage(router, "/servers/big-message", "maintainer", [], controllers.console.servers.bigmessage);

	// Global Scan - scan all servers for members
	router.post("/global-scan", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.globalScan);

	// Global Settings
	setupConsolePage(router, "/global-options/blocklist", "administration", [], controllers.console.options.blocklist);
	setupConsolePage(router, "/global-options/bot-user", "administration", [], controllers.console.options.bot);
	setupConsolePage(router, "/global-options/homepage", "administration", [], controllers.console.options.homepage);
	setupConsolePage(router, "/global-options/wiki-contributors", "administration", [], controllers.console.options.contributors);
	setupConsolePage(router, "/global-options/donations", "administration", [], controllers.console.options.donations);
	setupConsolePage(router, "/global-options/vote-sites", "administration", [], controllers.console.options.voteSites);
	setupConsolePage(router, "/global-options/bot-lists", "administration", [], controllers.console.options.botLists);
	setupConsolePage(router, "/global-options/premium-extensions", "administration", [], controllers.console.options.premiumExtensions);
	setupConsolePage(router, "/global-options/premium-extensions/sales", "administration", [], controllers.console.options.premiumExtensionsSales);
	setupConsolePage(router, "/global-options/network-approvals", "administration", [], controllers.console.networkApprovals);
	setupConsolePage(router, "/global-options/extension-queue", "administration", [], controllers.console.extensionQueue);

	// Membership System (Sudo/Host only)
	setupConsolePage(router, "/membership/features", "administration", [], controllers.console.membership.features);
	setupConsolePage(router, "/membership/tiers", "administration", [], controllers.console.membership.tiers);
	setupConsolePage(router, "/membership/oauth", "administration", [], controllers.console.membership.oauth);
	setupConsolePage(router, "/membership/payments", "administration", [], controllers.console.membership.payments);
	setupConsolePage(router, "/membership/email", "administration", [], controllers.console.membership.email);
	router.post("/membership/email/test", mw.checkUnavailableAPI, setAdministrationContext, mw.authorizeConsoleAccess, controllers.console.membership.email.test);
	setupConsolePage(router, "/membership/servers", "administration", [], controllers.console.membership.servers);
	router.post("/membership/servers/cancel", mw.checkUnavailableAPI, setAdministrationContext, mw.authorizeConsoleAccess, controllers.console.membership.servers.cancel);

	// Management Settings
	setupConsolePage(router, "/management/maintainers", "management", [], controllers.console.management.maintainers);
	setupConsolePage(router, "/management/shards", "management", [], controllers.console.management.shards);
	setupConsolePage(router, "/management/injection", "management", [], controllers.console.management.injection);
	setupConsolePage(router, "/management/version", "management", [], controllers.console.management.version);
	setupConsolePage(router, "/management/eval", "eval", [], controllers.console.management.eval);
	setupConsolePage(router, "/management/logs", "management", [], controllers.console.management.logs);

	// Feedback System
	setupConsolePage(router, "/feedback", "maintainer", [], controllers.console.feedback.list);
	router.post("/feedback/update", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.feedback.update);
	router.post("/feedback/delete", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.feedback.delete);

	// Tickets System
	setupConsolePage(router, "/tickets", "maintainer", [], controllers.console.tickets.list);
	setupConsolePage(router, "/tickets/:ticketId", "maintainer", [], controllers.console.tickets.view);
	router.post("/tickets/update", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.tickets.update);
	router.post("/tickets/reply", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.tickets.reply);
	router.post("/tickets/close", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.tickets.close);
	router.post("/tickets/delete", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.tickets.delete);
	router.get("/tickets/:ticketId/transcript", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.tickets.transcript);

	// Featured Creators Management (Administration level)
	setupConsolePage(router, "/global-options/featured-creators", "administration", [], controllers.console.featuredCreators);
	router.post("/global-options/featured-creators/set", mw.checkUnavailableAPI, setAdministrationContext, mw.authorizeConsoleAccess, controllers.console.featuredCreators.setFeatured);
	router.post("/global-options/featured-creators/update-stats", mw.checkUnavailableAPI, setAdministrationContext, mw.authorizeConsoleAccess, controllers.console.featuredCreators.updateStats);
	router.get("/global-options/featured-creators/:userId", mw.checkUnavailableAPI, setAdministrationContext, mw.authorizeConsoleAccess, controllers.console.featuredCreators.getCreatorStatus);

	// IndexNow SEO Integration (Management level)
	setupConsolePage(router, "/infrastructure/indexnow", "management", [], controllers.console.indexnow.status);
	router.post("/infrastructure/indexnow/test", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.indexnow.test);
	router.post("/infrastructure/indexnow/submit", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.indexnow.submit);
	router.post("/infrastructure/indexnow/reset", mw.checkUnavailableAPI, setMaintainerAPIContext, mw.authorizeConsoleAccess, controllers.console.indexnow.reset);

	// Cloudflare Integration (Management level)
	setupConsolePage(router, "/infrastructure/cloudflare", "management", [], controllers.console.cloudflare.getStatus);
	router.get("/infrastructure/cloudflare/analytics", controllers.console.cloudflare.getAnalytics);
	router.post("/infrastructure/cloudflare/purge-all", controllers.console.cloudflare.purgeAll);
	router.post("/infrastructure/cloudflare/purge-urls", controllers.console.cloudflare.purgeUrls);
	router.post("/infrastructure/cloudflare/dev-mode", controllers.console.cloudflare.toggleDevMode);
	router.post("/infrastructure/cloudflare/security-level", controllers.console.cloudflare.setSecurityLevel);
	router.post("/infrastructure/cloudflare/under-attack", controllers.console.cloudflare.enableUnderAttack);
	router.delete("/infrastructure/cloudflare/under-attack", controllers.console.cloudflare.disableUnderAttack);
	router.get("/infrastructure/cloudflare/settings", controllers.console.cloudflare.getSettings);
	router.get("/infrastructure/cloudflare/access-rules", controllers.console.cloudflare.listAccessRules);
	router.post("/infrastructure/cloudflare/block-ip", controllers.console.cloudflare.blockIP);
	router.delete("/infrastructure/cloudflare/access-rules/:ruleId", controllers.console.cloudflare.deleteAccessRule);
	router.post("/infrastructure/cloudflare/cache-level", controllers.console.cloudflare.setCacheLevel);
};
