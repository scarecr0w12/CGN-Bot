const { setupPage, setupDashboardPage } = require("../helpers");
const middleware = require("../middleware");
const controllers = require("../controllers");

module.exports = router => {
	// Admin console support for legacy URL's
	router.use("/", (req, res, next) => {
		if (req.query.svrid) {
			res.redirect(307, `/dashboard/${req.query.svrid}${req.path}`);
		} else {
			return next();
		}
	});

	// Dashboard
	setupPage(router, "/", [], controllers.dashboard.home);
	setupDashboardPage(router, "/overview", [], controllers.dashboard.overview);

	// Commands
	setupDashboardPage(router, "/commands/command-options", [], controllers.dashboard.commands.options);
	setupDashboardPage(router, "/commands/command-list", [], controllers.dashboard.commands.list);
	setupDashboardPage(router, "/commands/rss-feeds", [], controllers.dashboard.commands.rss, "rss_feeds");
	setupDashboardPage(router, "/commands/game-updates", [], controllers.dashboard.commands.gameUpdates, "game_updates");
	setupDashboardPage(router, "/commands/streamers", [], controllers.dashboard.commands.streamers, "streamers_data");
	setupDashboardPage(router, "/commands/tags", [], controllers.dashboard.commands.tags, "tags");
	setupDashboardPage(router, "/commands/auto-translation", [], controllers.dashboard.commands.translation, "translated_messages");
	setupDashboardPage(router, "/commands/trivia-sets", [], controllers.dashboard.commands.trivia, "trivia_sets");
	setupDashboardPage(router, "/commands/api-keys", [], controllers.dashboard.commands.APIKeys);
	setupDashboardPage(router, "/commands/tag-reaction", [], controllers.dashboard.commands.reaction);

	// Stats and Points
	setupDashboardPage(router, "/stats-points/stats-collection", [], controllers.dashboard.stats.collection);
	setupDashboardPage(router, "/stats-points/ranks", [], controllers.dashboard.stats.ranks, "ranks_list");
	setupDashboardPage(router, "/stats-points/skynet-points", [], controllers.dashboard.stats.points);
	setupDashboardPage(router, "/stats-points/economy", [], controllers.dashboard.stats.economy);
	setupDashboardPage(router, "/stats-points/economy-stats", [], controllers.dashboard.stats.economyStats);
	setupDashboardPage(router, "/stats-points/advanced-stats", [], controllers.dashboard.stats.advancedStats);
	setupDashboardPage(router, "/stats-points/analytics", [], controllers.dashboard.stats.analyticsOverview);
	// Premium analytics endpoints
	router.get("/:svrid/stats-points/analytics-data", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.stats.analyticsData);
	router.get("/:svrid/stats-points/analytics-export", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.stats.analyticsExport);
	router.get("/:svrid/stats-points/analytics", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.stats.analytics);

	// Embed Builder
	setupDashboardPage(router, "/embed-builder", [], controllers.dashboard.embedBuilder.builder);
	router.post("/:svrid/embed-builder/preview", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.embedBuilder.preview);
	router.post("/:svrid/embed-builder/send",
		[middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess],
		controllers.dashboard.embedBuilder.send);
	router.post("/:svrid/embed-builder/template/save",
		[middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess],
		controllers.dashboard.embedBuilder.saveTemplate);
	router.get("/:svrid/embed-builder/template/:templateId",
		[middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess],
		controllers.dashboard.embedBuilder.loadTemplate);
	router.delete("/:svrid/embed-builder/template/:templateId",
		[middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess],
		controllers.dashboard.embedBuilder.deleteTemplate);

	// Administration
	setupDashboardPage(router, "/administration/admins", [], controllers.dashboard.administration.admins, "admins");
	setupDashboardPage(router, "/administration/moderation", [], controllers.dashboard.administration.moderation);
	setupDashboardPage(router, "/administration/blocked", [], controllers.dashboard.administration.blocked, "blocked");
	setupDashboardPage(router, "/administration/muted", [], controllers.dashboard.administration.muted, "muted");
	setupDashboardPage(router, "/administration/strikes", [], controllers.dashboard.administration.strikes);
	setupDashboardPage(router, "/administration/status-messages", [], controllers.dashboard.administration.status);
	setupDashboardPage(router, "/administration/filters", [], controllers.dashboard.administration.filters);
	setupDashboardPage(router, "/administration/message-of-the-day", [], controllers.dashboard.administration.MOTD);
	setupDashboardPage(router, "/administration/voicetext-channels", [], controllers.dashboard.administration.voicetext);
	setupDashboardPage(router, "/administration/roles", [], controllers.dashboard.administration.roles);
	setupDashboardPage(router, "/administration/logs", [], controllers.dashboard.administration.logs);

	// Scan members API endpoint
	router.post("/:svrid/administration/scan-members", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.administration.scanMembers);

	// Search members API endpoint
	router.get("/:svrid/search-members", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.administration.searchMembers);

	// Other
	setupDashboardPage(router, "/other/name-display", [], controllers.dashboard.other.nameDisplay);
	setupDashboardPage(router, "/other/ongoing-activities", [], controllers.dashboard.other.activities);
	setupDashboardPage(router, "/other/public-data", [], controllers.dashboard.other.public);
	setupDashboardPage(router, "/other/extensions", [], controllers.dashboard.other.extensions, "extensions");
	setupDashboardPage(router, "/other/extensions/settings", [], controllers.dashboard.other.extensionSettings);
	setupDashboardPage(router, "/other/extension-builder", [], controllers.dashboard.other.extensionBuilder);
	setupDashboardPage(router, "/other/export", [], controllers.dashboard.other.export);
	// Widgets
	setupPage(router, "/:svrid/widgets", [], controllers.widgets.widgetGenerator);
	// Server Profile (Tier 1+)
	setupPage(router, "/:svrid/server-profile", [], controllers.server.profileEditor);

	// AI
	setupDashboardPage(router, "/ai/settings", [], controllers.dashboard.ai.settings);
	setupDashboardPage(router, "/ai/governance", [], controllers.dashboard.ai.governance);
	setupDashboardPage(router, "/ai/memory", [], controllers.dashboard.ai.memory);
	setupDashboardPage(router, "/ai/personality", [], controllers.dashboard.ai.personality);
	router.get("/:svrid/ai/models", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.ai.models);
	router.post("/:svrid/ai/test-qdrant", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.ai.testQdrant);
	router.post("/:svrid/ai/clear-vector-memory", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.ai.clearVectorMemory);
	router.get("/:svrid/ai/vector-stats", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.ai.vectorStats);

	// Subscription Management (per-server premium)
	setupDashboardPage(router, "/subscription", [], controllers.dashboard.subscription.manage);
	router.post("/:svrid/subscription/redeem", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.subscription.redeemPoints);
	router.post("/:svrid/subscription/cancel", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.subscription.cancel);

	// Ticket System (Tier 2)
	setupDashboardPage(router, "/tickets/settings", [], controllers.dashboard.tickets.settings);
	setupDashboardPage(router, "/tickets", [], controllers.dashboard.tickets.list);
	setupDashboardPage(router, "/tickets/:ticketId", [], controllers.dashboard.tickets.view);
	router.post("/:svrid/tickets/update", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.tickets.update);
	router.post("/:svrid/tickets/category/add", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.tickets.addCategory);
	router.post("/:svrid/tickets/category/delete", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.tickets.deleteCategory);
	router.post("/:svrid/tickets/ticket/update", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.tickets.updateTicket);

	// Server Management (Tier 2)
	setupDashboardPage(router, "/server-management/channels", [], controllers.dashboard.serverManagement.channels);
	setupDashboardPage(router, "/server-management/roles", [], controllers.dashboard.serverManagement.roles);

	// Social Media Alerts
	setupDashboardPage(router, "/socialalerts", [], controllers.dashboard.socialalerts.index);
	router.post("/:svrid/socialalerts/add", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.socialalerts.add);
	router.post("/:svrid/socialalerts/:alertId/toggle", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.socialalerts.toggle);
	router.delete("/:svrid/socialalerts/:alertId", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.socialalerts.delete);

	// Form Builder
	setupDashboardPage(router, "/forms", [], controllers.dashboard.forms.index);
	setupDashboardPage(router, "/forms/create", [], controllers.dashboard.forms.create);
	setupDashboardPage(router, "/forms/:formId/edit", [], controllers.dashboard.forms.edit);
	setupDashboardPage(router, "/forms/:formId/responses", [], controllers.dashboard.forms.responses);
	router.post("/:svrid/forms", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.forms.store);
	router.put("/:svrid/forms/:formId", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.forms.update);
	router.post("/:svrid/forms/:formId/toggle", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.forms.toggle);
	router.delete("/:svrid/forms/:formId", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], controllers.dashboard.forms.delete);

	// Helper endpoint for getting channels
	router.get("/:svrid/channels", [middleware.checkUnavailableAPI, middleware.markAsAPI, middleware.authorizeDashboardAccess], (req, res) => {
		const guild = req.app.get("client").guilds.cache.get(req.params.svrid);
		if (!guild) return res.status(404).json({ error: "Guild not found" });
		const channels = Array.from(guild.channels.cache.values()).map(c => ({
			id: c.id,
			name: c.name,
			type: c.type,
		}));
		res.json(channels);
	});
};
