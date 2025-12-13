/**
 * Dashboard Ticket Controllers - Server ticket system management (Tier 2)
 */

const controllers = module.exports;

/**
 * Check if server has Tier 2 access for tickets
 */
const checkTier2Access = serverDocument => {
	const tier = serverDocument.subscription?.tier_id || "free";
	return tier !== "free";
};

/**
 * Ticket settings page
 */
controllers.settings = async (req, { res }) => {
	const { document: serverDocument } = req.svr;

	// Check tier access
	if (!checkTier2Access(serverDocument)) {
		return res.setPageData({
			page: "admin-feature-locked.ejs",
			featureName: "Ticket System",
			requiredTier: "Premium",
			featureDescription: "Create a professional support ticket system for your server with custom categories, ticket panels, and transcript logging.",
		}).render();
	}

	const ticketConfig = serverDocument.tickets || {};
	const categories = ticketConfig.categories || [];
	const panels = ticketConfig.panels || [];

	// Get channel and role lists
	const textChannels = Object.values(req.svr.channels)
		.filter(ch => ch.type === 0)
		.map(ch => ({ id: ch.id, name: ch.name }));

	const categoryChannels = Object.values(req.svr.channels)
		.filter(ch => ch.type === 4)
		.map(ch => ({ id: ch.id, name: ch.name }));

	const roles = Object.values(req.svr.roles)
		.filter(r => r.id !== req.svr.id)
		.map(r => ({ id: r.id, name: r.name, color: r.color }));

	// Get ticket statistics
	const openTickets = await global.ServerTickets.find({
		server_id: req.svr.id,
		status: { $in: ["open", "in_progress", "on_hold"] },
	}).exec();

	const stats = {
		total: ticketConfig.total_tickets || 0,
		closed: ticketConfig.closed_tickets || 0,
		open: openTickets?.length || 0,
	};

	res.setConfigData({
		ticketConfig,
		categories,
		panels,
		textChannels,
		categoryChannels,
		roles,
		stats,
	}).setPageData({
		page: "admin-tickets.ejs",
	}).render();
};

/**
 * Update ticket settings
 */
controllers.update = async (req, res) => {
	const { document: serverDocument } = req.svr;

	if (!checkTier2Access(serverDocument)) {
		return res.status(403).json({ error: "Premium subscription required" });
	}

	const {
		enabled,
		ticket_category_id: ticketCategoryId,
		transcript_channel_id: transcriptChannelId,
		log_channel_id: logChannelId,
		support_roles: supportRoles,
		default_welcome_message: defaultWelcomeMessage,
		channel_name_pattern: channelNamePattern,
		max_tickets_per_user: maxTicketsPerUser,
		auto_close_enabled: autoCloseEnabled,
		auto_close_inactive_hours: autoCloseInactiveHours,
		auto_close_warning_hours: autoCloseWarningHours,
	} = req.body;

	try {
		const query = serverDocument.query;

		if (enabled !== undefined) {
			query.set("tickets.enabled", enabled === "true" || enabled === true);
		}
		if (ticketCategoryId !== undefined) {
			query.set("tickets.ticket_category_id", ticketCategoryId || null);
		}
		if (transcriptChannelId !== undefined) {
			query.set("tickets.transcript_channel_id", transcriptChannelId || null);
		}
		if (logChannelId !== undefined) {
			query.set("tickets.log_channel_id", logChannelId || null);
		}
		if (supportRoles !== undefined) {
			const roles = Array.isArray(supportRoles) ? supportRoles : [supportRoles].filter(Boolean);
			query.set("tickets.support_roles", roles);
		}
		if (defaultWelcomeMessage !== undefined) {
			query.set("tickets.default_welcome_message", defaultWelcomeMessage);
		}
		if (channelNamePattern !== undefined) {
			query.set("tickets.channel_name_pattern", channelNamePattern || "ticket-{number}");
		}
		if (maxTicketsPerUser !== undefined) {
			query.set("tickets.max_tickets_per_user", parseInt(maxTicketsPerUser, 10) || 3);
		}
		if (autoCloseEnabled !== undefined) {
			query.set("tickets.auto_close.enabled", autoCloseEnabled === "true" || autoCloseEnabled === true);
		}
		if (autoCloseInactiveHours !== undefined) {
			query.set("tickets.auto_close.inactive_hours", parseInt(autoCloseInactiveHours, 10) || 48);
		}
		if (autoCloseWarningHours !== undefined) {
			query.set("tickets.auto_close.warning_hours", parseInt(autoCloseWarningHours, 10) || 24);
		}

		await serverDocument.save();
		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to update ticket settings", { svrid: req.svr.id }, err);
		res.status(500).json({ error: "Failed to update settings" });
	}
};

/**
 * Add a ticket category
 */
controllers.addCategory = async (req, res) => {
	const { document: serverDocument } = req.svr;

	if (!checkTier2Access(serverDocument)) {
		return res.status(403).json({ error: "Premium subscription required" });
	}

	const { name, description, emoji, ping_roles: pingRoles, welcome_message: welcomeMessage } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Category name is required" });
	}

	try {
		const categories = serverDocument.tickets?.categories || [];
		const categoryId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

		// Check for duplicate
		if (categories.some(c => c._id === categoryId)) {
			return res.status(400).json({ error: "A category with this name already exists" });
		}

		categories.push({
			_id: categoryId,
			name,
			description: description || "",
			emoji: emoji || "🎫",
			ping_roles: Array.isArray(pingRoles) ? pingRoles : [pingRoles].filter(Boolean),
			welcome_message: welcomeMessage || "",
		});

		serverDocument.query.set("tickets.categories", categories);
		await serverDocument.save();

		res.json({ success: true, categoryId });
	} catch (err) {
		logger.error("Failed to add ticket category", { svrid: req.svr.id }, err);
		res.status(500).json({ error: "Failed to add category" });
	}
};

/**
 * Delete a ticket category
 */
controllers.deleteCategory = async (req, res) => {
	const { document: serverDocument } = req.svr;

	if (!checkTier2Access(serverDocument)) {
		return res.status(403).json({ error: "Premium subscription required" });
	}

	const { category_id: categoryId } = req.body;

	if (!categoryId) {
		return res.status(400).json({ error: "Category ID is required" });
	}

	try {
		const categories = (serverDocument.tickets?.categories || []).filter(c => c._id !== categoryId);
		serverDocument.query.set("tickets.categories", categories);
		await serverDocument.save();

		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to delete ticket category", { svrid: req.svr.id }, err);
		res.status(500).json({ error: "Failed to delete category" });
	}
};

/**
 * List server tickets
 */
controllers.list = async (req, { res }) => {
	const { document: serverDocument } = req.svr;

	if (!checkTier2Access(serverDocument)) {
		return res.setPageData({
			page: "admin-feature-locked.ejs",
			featureName: "Ticket System",
			requiredTier: "Premium",
			featureDescription: "Create a professional support ticket system for your server.",
		}).render();
	}

	const status = req.query.status || "";
	const filter = { server_id: req.svr.id };
	if (status) filter.status = status;

	const tickets = await global.ServerTickets.find(filter)
		.sort({ created_at: -1 })
		.limit(50)
		.exec();

	// Get counts
	const statusCounts = {
		open: 0,
		in_progress: 0,
		on_hold: 0,
		closed: 0,
	};

	const allTickets = await global.ServerTickets.find({ server_id: req.svr.id }).exec();
	for (const t of allTickets || []) {
		if (statusCounts[t.status] !== undefined) {
			statusCounts[t.status]++;
		}
	}

	res.setConfigData({
		tickets: tickets || [],
		statusCounts,
		activeStatus: status,
	}).setPageData({
		page: "admin-tickets-list.ejs",
	}).render();
};

/**
 * View a specific ticket
 */
controllers.view = async (req, { res }) => {
	const { document: serverDocument } = req.svr;
	const ticketId = req.params.ticketId;

	if (!checkTier2Access(serverDocument)) {
		return res.redirect(`/dashboard/${req.svr.id}/tickets`);
	}

	const ticket = await global.ServerTickets.findOne(ticketId);
	if (!ticket || ticket.server_id !== req.svr.id) {
		return res.redirect(`/dashboard/${req.svr.id}/tickets`);
	}

	const messages = await global.ServerTicketMessages.find({ ticket_id: ticketId })
		.sort({ created_at: 1 })
		.exec();

	res.setConfigData({
		ticket,
		messages: messages || [],
	}).setPageData({
		page: "admin-ticket-view.ejs",
	}).render();
};

/**
 * Update ticket status/priority
 */
controllers.updateTicket = async (req, res) => {
	const { document: serverDocument } = req.svr;

	if (!checkTier2Access(serverDocument)) {
		return res.status(403).json({ error: "Premium subscription required" });
	}

	const { ticket_id: ticketId, status, priority, assigned_to: assignedTo, internal_notes: internalNotes } = req.body;

	if (!ticketId) {
		return res.status(400).json({ error: "Ticket ID is required" });
	}

	try {
		const ticket = await global.ServerTickets.findOne(ticketId);
		if (!ticket || ticket.server_id !== req.svr.id) {
			return res.status(404).json({ error: "Ticket not found" });
		}

		if (status) ticket.query.set("status", status);
		if (priority) ticket.query.set("priority", priority);
		if (assignedTo !== undefined) ticket.query.set("assigned_to", assignedTo || null);
		if (internalNotes !== undefined) ticket.query.set("internal_notes", internalNotes);
		ticket.query.set("updated_at", new Date());

		await ticket.save();
		res.json({ success: true });
	} catch (err) {
		logger.error("Failed to update ticket", { svrid: req.svr.id, ticketId }, err);
		res.status(500).json({ error: "Failed to update ticket" });
	}
};
