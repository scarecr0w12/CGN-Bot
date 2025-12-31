const Logger = require("../../../Internals/Logger");
const logger = new Logger("Dashboard-Forms");

module.exports = {
	// GET /dashboard/:id/forms
	async index(req, res) {
		try {
			const { serverDocument } = req;
			const Forms = req.app.get("client").database.models.forms;

			const forms = await Forms.find({ server_id: serverDocument._id })
				.sort({ created_at: -1 })
				.exec();

			// Get tier limits
			const TierManager = require("../../../Modules/TierManager");
			const tier = await TierManager.getServerTier(serverDocument._id);
			const tierLimits = {
				free: 2,
				starter: 5,
				premium: -1,
			};

			const maxForms = tierLimits[tier] || 0;
			const canAdd = maxForms === -1 || forms.length < maxForms;

			res.render("pages/dashboard/forms/index", {
				title: "Form Builder",
				forms,
				canAdd,
				currentCount: forms.length,
				maxForms: maxForms === -1 ? "Unlimited" : maxForms,
				tier,
			});
		} catch (error) {
			logger.error("Error loading forms:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load forms",
			});
		}
	},

	// GET /dashboard/:id/forms/create
	async create(req, res) {
		try {
			const { serverDocument } = req;

			// Get server channels for dropdown
			const guild = req.app.get("client").guilds.cache.get(serverDocument._id);
			const channels = guild ? Array.from(guild.channels.cache.values())
				.filter(c => c.type === 0)
				.map(c => ({ id: c.id, name: c.name }))
				: [];

			const roles = guild ? Array.from(guild.roles.cache.values())
				.filter(r => !r.managed && r.id !== guild.id)
				.map(r => ({ id: r.id, name: r.name }))
				: [];

			res.render("pages/dashboard/forms/editor", {
				title: "Create Form",
				form: null,
				channels,
				roles,
				isEdit: false,
			});
		} catch (error) {
			logger.error("Error loading form creator:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load form creator",
			});
		}
	},

	// GET /dashboard/:id/forms/:formId/edit
	async edit(req, res) {
		try {
			const { serverDocument } = req;
			const { formId } = req.params;
			const Forms = req.app.get("client").database.models.forms;

			const form = await Forms.findOne({ _id: formId, server_id: serverDocument._id }).exec();
			if (!form) {
				return res.status(404).render("pages/error", {
					title: "Not Found",
					statusCode: 404,
					message: "Form not found",
				});
			}

			const guild = req.app.get("client").guilds.cache.get(serverDocument._id);
			const channels = guild ? Array.from(guild.channels.cache.values())
				.filter(c => c.type === 0)
				.map(c => ({ id: c.id, name: c.name }))
				: [];

			const roles = guild ? Array.from(guild.roles.cache.values())
				.filter(r => !r.managed && r.id !== guild.id)
				.map(r => ({ id: r.id, name: r.name }))
				: [];

			res.render("pages/dashboard/forms/editor", {
				title: "Edit Form",
				form,
				channels,
				roles,
				isEdit: true,
			});
		} catch (error) {
			logger.error("Error loading form editor:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load form editor",
			});
		}
	},

	// POST /dashboard/:id/forms
	async store(req, res) {
		try {
			const { serverDocument } = req;
			const { name, description, fields, submit_channel, review_channel, auto_role_id, webhook_url } = req.body;

			if (!name || !fields) {
				return res.status(400).json({
					success: false,
					error: "Missing required fields",
				});
			}

			const formBuilder = req.app.get("client").formBuilder;
			if (!formBuilder) {
				return res.status(503).json({
					success: false,
					error: "Form Builder system not initialized",
				});
			}

			const form = await formBuilder.createForm({
				server_id: serverDocument._id,
				name,
				description: description || null,
				fields: JSON.parse(fields),
				submit_channel: submit_channel || null,
				review_channel: review_channel || null,
				auto_role_id: auto_role_id || null,
				webhook_url: webhook_url || null,
				enabled: true,
			});

			res.json({
				success: true,
				form,
			});
		} catch (error) {
			logger.error("Error creating form:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// PUT /dashboard/:id/forms/:formId
	async update(req, res) {
		try {
			const { serverDocument } = req;
			const { formId } = req.params;
			const { name, description, fields, submit_channel, review_channel, auto_role_id, webhook_url } = req.body;

			const Forms = req.app.get("client").database.models.forms;
			await Forms.update(
				{ _id: formId, server_id: serverDocument._id },
				{
					name,
					description: description || null,
					fields: JSON.parse(fields),
					submit_channel: submit_channel || null,
					review_channel: review_channel || null,
					auto_role_id: auto_role_id || null,
					webhook_url: webhook_url || null,
					updated_at: new Date(),
				},
			);

			res.json({ success: true });
		} catch (error) {
			logger.error("Error updating form:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// POST /dashboard/:id/forms/:formId/toggle
	async toggle(req, res) {
		try {
			const { serverDocument } = req;
			const { formId } = req.params;
			const { enabled } = req.body;

			const Forms = req.app.get("client").database.models.forms;
			await Forms.update(
				{ _id: formId, server_id: serverDocument._id },
				{ enabled: enabled === "true" || enabled === true },
			);

			res.json({ success: true });
		} catch (error) {
			logger.error("Error toggling form:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// DELETE /dashboard/:id/forms/:formId
	async delete(req, res) {
		try {
			const { serverDocument } = req;
			const { formId } = req.params;

			const Forms = req.app.get("client").database.models.forms;
			await Forms.delete({ _id: formId, server_id: serverDocument._id });

			res.json({ success: true });
		} catch (error) {
			logger.error("Error deleting form:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// GET /dashboard/:id/forms/:formId/responses
	async responses(req, res) {
		try {
			const { serverDocument } = req;
			const { formId } = req.params;
			const Forms = req.app.get("client").database.models.forms;

			const form = await Forms.findOne({ _id: formId, server_id: serverDocument._id }).exec();
			if (!form) {
				return res.status(404).render("pages/error", {
					title: "Not Found",
					statusCode: 404,
					message: "Form not found",
				});
			}

			// Get form responses (placeholder - implement based on your response storage)
			const responses = [];

			res.render("pages/dashboard/forms/responses", {
				title: `${form.name} - Responses`,
				form,
				responses,
			});
		} catch (error) {
			logger.error("Error loading form responses:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load form responses",
			});
		}
	},
};
