const { EmbedBuilder, EmbedTemplateManager } = require("../../../Modules/EmbedBuilder");

const controllers = module.exports;

/**
 * GET /:svrid/embed-builder
 * Display the embed builder interface
 */
controllers.builder = async (req, { res }) => {
	const templateManager = new EmbedTemplateManager(global.Database);
	const templates = await templateManager.getServerTemplates(req.svr.id, 50);

	res.setPageData({
		page: "admin-embed-builder.ejs",
		pageTitle: "Embed Builder",
		templates,
	});
	res.render();
};

/**
 * POST /:svrid/embed-builder/preview
 * Generate embed preview
 */
controllers.preview = async (req, res) => {
	const embedData = req.body;

	// Validate embed
	const validation = EmbedBuilder.validate(embedData);
	if (!validation.valid) {
		return res.status(400).json({
			success: false,
			errors: validation.errors,
		});
	}

	// Convert to Discord embed format
	const embed = EmbedBuilder.createFromData(embedData);
	const jsonEmbed = EmbedBuilder.toJSON(embed);

	res.json({
		success: true,
		embed: jsonEmbed,
		characterCount: EmbedBuilder.getTotalLength(embedData),
	});
};

/**
 * POST /:svrid/embed-builder/send
 * Send embed to a channel
 */
controllers.send = async (req, res) => {
	const { embedData, channelId } = req.body;

	if (!channelId) {
		return res.status(400).json({
			success: false,
			error: "Channel ID is required",
		});
	}

	// Validate embed
	const validation = EmbedBuilder.validate(embedData);
	if (!validation.valid) {
		return res.status(400).json({
			success: false,
			errors: validation.errors,
		});
	}

	try {
		const guild = req.app.client.guilds.cache.get(req.svr.id);
		if (!guild) {
			return res.status(404).json({
				success: false,
				error: "Server not found",
			});
		}

		const channel = guild.channels.cache.get(channelId);
		if (!channel) {
			return res.status(404).json({
				success: false,
				error: "Channel not found",
			});
		}

		if (!channel.isTextBased()) {
			return res.status(400).json({
				success: false,
				error: "Channel is not text-based",
			});
		}

		// Create and send embed
		const embed = EmbedBuilder.createFromData(embedData);
		await channel.send({ embeds: [embed] });

		res.json({
			success: true,
			message: "Embed sent successfully!",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

/**
 * POST /:svrid/embed-builder/template/save
 * Save embed as template
 */
controllers.saveTemplate = async (req, res) => {
	const { name, description, embedData } = req.body;

	if (!name || !embedData) {
		return res.status(400).json({
			success: false,
			error: "Name and embed data are required",
		});
	}

	// Validate embed
	const validation = EmbedBuilder.validate(embedData);
	if (!validation.valid) {
		return res.status(400).json({
			success: false,
			errors: validation.errors,
		});
	}

	try {
		const templateManager = new EmbedTemplateManager(global.Database);
		const template = await templateManager.createTemplate(
			req.svr.id,
			req.user.id,
			name,
			embedData,
			description || "",
		);

		res.json({
			success: true,
			template: {
				id: template._id,
				name: template.name,
				description: template.description,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

/**
 * GET /:svrid/embed-builder/template/:templateId
 * Load template
 */
controllers.loadTemplate = async (req, res) => {
	const { templateId } = req.params;

	const templateManager = new EmbedTemplateManager(global.Database);
	const template = await templateManager.getTemplate(templateId);

	if (!template) {
		return res.status(404).json({
			success: false,
			error: "Template not found",
		});
	}

	if (template.server_id !== req.svr.id) {
		return res.status(403).json({
			success: false,
			error: "Template belongs to another server",
		});
	}

	res.json({
		success: true,
		template: {
			id: template._id,
			name: template.name,
			description: template.description,
			embedData: template.embed_data,
			useCount: template.use_count,
		},
	});
};

/**
 * DELETE /:svrid/embed-builder/template/:templateId
 * Delete template
 */
controllers.deleteTemplate = async (req, res) => {
	const { templateId } = req.params;

	const templateManager = new EmbedTemplateManager(global.Database);
	const template = await templateManager.getTemplate(templateId);

	if (!template) {
		return res.status(404).json({
			success: false,
			error: "Template not found",
		});
	}

	if (template.server_id !== req.svr.id) {
		return res.status(403).json({
			success: false,
			error: "Template belongs to another server",
		});
	}

	// Check permissions - only creator or admin can delete
	const serverDocument = req.svr.document;
	const member = req.svr.members[req.user.id];
	const hasAdminPerm = req.app.client.getUserBotAdmin(req.svr, serverDocument, member) >= 3;
	const isCreator = template.created_by === req.user.id;

	if (!hasAdminPerm && !isCreator) {
		return res.status(403).json({
			success: false,
			error: "Only the template creator or administrators can delete this template",
		});
	}

	await templateManager.deleteTemplate(templateId);

	res.json({
		success: true,
		message: "Template deleted successfully",
	});
};
