const { setupConsolePage, setupRedirection } = require("../helpers");
const controllers = require("../controllers");

module.exports = router => {
	setupRedirection(router, "/", "/maintainer");
	setupConsolePage(router, "/maintainer", "maintainer", [], controllers.console.maintainer);

	// Server Settings
	setupConsolePage(router, "/servers/server-list", "maintainer", [], controllers.console.servers.list);
	setupConsolePage(router, "/servers/big-message", "maintainer", [], controllers.console.servers.bigmessage);

	// Global Settings
	setupConsolePage(router, "/global-options/blocklist", "administration", [], controllers.console.options.blocklist);
	setupConsolePage(router, "/global-options/bot-user", "administration", [], controllers.console.options.bot);
	setupConsolePage(router, "/global-options/homepage", "administration", [], controllers.console.options.homepage);
	setupConsolePage(router, "/global-options/wiki-contributors", "administration", [], controllers.console.options.contributors);
	setupConsolePage(router, "/global-options/donations", "administration", [], controllers.console.options.donations);

	// Membership System (Sudo/Host only)
	setupConsolePage(router, "/membership/features", "administration", [], controllers.console.membership.features);
	setupConsolePage(router, "/membership/tiers", "administration", [], controllers.console.membership.tiers);
	setupConsolePage(router, "/membership/oauth", "administration", [], controllers.console.membership.oauth);
	setupConsolePage(router, "/membership/payments", "administration", [], controllers.console.membership.payments);

	// Management Settings
	setupConsolePage(router, "/management/maintainers", "management", [], controllers.console.management.maintainers);
	setupConsolePage(router, "/management/shards", "management", [], controllers.console.management.shards);
	setupConsolePage(router, "/management/injection", "management", [], controllers.console.management.injection);
	setupConsolePage(router, "/management/version", "management", [], controllers.console.management.version);
	setupConsolePage(router, "/management/eval", "eval", [], controllers.console.management.eval);
	setupConsolePage(router, "/management/logs", "management", [], controllers.console.management.logs);
};
