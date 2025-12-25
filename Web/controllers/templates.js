/**
 * Server Templates Controller
 * Handles template selection and application for servers
 */

const { ServerTemplates } = require("../../Modules");
const { renderError } = require("../helpers");
const CacheManager = require("../../Modules/CacheManager");
const { GetGuild } = require("../../Modules").getGuild;

const controllers = module.exports;

/**
 * Get list of available templates
 * GET /api/templates
 */
controllers.getTemplates = async (req, res) => {
	try {
		const templates = ServerTemplates.getTemplates();
		res.json({ templates });
	} catch (err) {
		logger.warn("Failed to get templates", {}, err);
		res.status(500).json({ error: "Failed to get templates" });
	}
};

/**
 * Apply a template to a server
 * POST /api/templates/apply
 * Body: { serverId, templateId }
 */
controllers.applyTemplate = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const { serverId, templateId } = req.body;

	if (!serverId || !templateId) {
		return res.status(400).json({ error: "Missing serverId or templateId" });
	}

	if (!ServerTemplates.isValidTemplate(templateId)) {
		return res.status(400).json({ error: "Invalid template" });
	}

	try {
		// Verify user has admin access to server
		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize(req.user.id);

		if (!svr.success) {
			return res.status(404).json({ error: "Server not found" });
		}

		const serverDocument = await CacheManager.getServer(serverId);
		if (!serverDocument) {
			return res.status(404).json({ error: "Server not found" });
		}

		const member = svr.members[req.user.id];
		if (req.app.client.getUserBotAdmin(svr, serverDocument, member) < 3) {
			return res.status(403).json({ error: "Insufficient permissions" });
		}

		// Apply the template
		await ServerTemplates.applyTemplate(serverDocument, templateId, req.app.client);
		await serverDocument.save();

		const template = ServerTemplates.getTemplate(templateId);
		res.json({
			success: true,
			message: `Applied "${template.name}" template successfully`,
			templateId,
		});
	} catch (err) {
		logger.warn("Failed to apply template", { serverId, templateId }, err);
		res.status(500).json({ error: "Failed to apply template" });
	}
};

/**
 * Template selection page for new servers
 * GET /setup/templates/:serverId
 */
controllers.templateSelectionPage = async (req, { res }) => {
	if (!req.isAuthenticated()) {
		return res.redirect("/login");
	}

	const { serverId } = req.params;

	try {
		// Verify user has admin access
		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize(req.user.id);

		if (!svr.success) {
			return renderError(res, "Server not found", undefined, 404);
		}

		const serverDocument = await CacheManager.getServer(serverId);
		if (!serverDocument) {
			return renderError(res, "Server not found", undefined, 404);
		}

		const member = svr.members[req.user.id];
		if (req.app.client.getUserBotAdmin(svr, serverDocument, member) < 3) {
			return renderError(res, "You don't have permission to configure this server", undefined, 403);
		}

		const webp = req.accepts("image/webp") === "image/webp";
		const templates = ServerTemplates.getTemplates();
		const appliedTemplate = serverDocument.config?.applied_template;

		res.setPageData({
			page: "setup-templates.ejs",
			pageTitle: "Choose a Template",
			serverData: {
				id: svr.id,
				name: svr.name,
				icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons", webp),
			},
			templates,
			appliedTemplate,
		});

		res.render();
	} catch (err) {
		logger.warn("Failed to load template selection page", { serverId }, err);
		renderError(res, "Failed to load template selection");
	}
};
