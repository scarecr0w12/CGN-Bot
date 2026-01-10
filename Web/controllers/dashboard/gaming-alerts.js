const Logger = require("../../../Internals/Logger");
const logger = new Logger("Dashboard-GamingAlerts");

module.exports = {
	// GET /dashboard/:id/gaming-alerts
	async index (req, res) {
		try {
			const { serverDocument } = req;
			const GamingAlerts = req.app.get("client").database.models.gamingAlerts;

			const config = await GamingAlerts.findOne({ server_id: serverDocument._id }).exec();

			const channels = req.app.client.guilds.cache.get(req.svr.id)?.channels.cache
				.filter(c => c.isTextBased())
				.map(c => ({ id: c.id, name: c.name })) ||
				[];

			const roles = req.app.client.guilds.cache.get(req.svr.id)?.roles.cache
				.filter(r => !r.managed && r.id !== req.svr.id)
				.map(r => ({ id: r.id, name: r.name })) ||
				[];

			const tier = serverDocument.tier || "free";

			res.render("pages/dashboard/gaming-alerts", {
				title: "Gaming Alerts",
				config: config || null,
				channels,
				roles,
				tier,
			});
		} catch (error) {
			logger.error("Error loading gaming alerts page:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load gaming alerts",
			});
		}
	},

	// POST /dashboard/:id/gaming-alerts
	async update (req, res) {
		try {
			const { serverDocument } = req;
			const {
				enabled,
				channel_id,
				epic_free_games,
				steam_sales,
				steam_free_games,
				role_mention,
				custom_message,
				min_discount,
				max_price,
				free_only,
				steam_tags,
			} = req.body;

			const GamingAlerts = req.app.get("client").database.models.gamingAlerts;
			const config = await GamingAlerts.findOne({ server_id: serverDocument._id }).exec();

			const updateData = {
				enabled: enabled === "true",
				channel_id: channel_id || null,
				epic_free_games: epic_free_games === "true",
				steam_sales: steam_sales === "true",
				steam_free_games: steam_free_games === "true",
				role_mention: role_mention || null,
				custom_message: custom_message || null,
				min_discount: parseInt(min_discount) || 50,
				price_filters: {
					max_price: max_price ? parseFloat(max_price) : null,
					free_only: free_only === "true",
				},
				steam_tags: steam_tags ? steam_tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
				updated_at: new Date(),
			};

			if (!config) {
				await GamingAlerts.create({
					server_id: serverDocument._id,
					...updateData,
				});
			} else {
				await GamingAlerts.update(
					{ server_id: serverDocument._id },
					updateData,
				);
			}

			res.json({ success: true });
		} catch (error) {
			logger.error("Error updating gaming alerts:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// POST /dashboard/:id/gaming-alerts/test
	async test (req, res) {
		try {
			const { serverDocument } = req;
			const gamingAlerts = req.app.get("client").gamingAlerts;

			if (!gamingAlerts) {
				return res.status(503).json({
					success: false,
					error: "Gaming alerts system is not available",
				});
			}

			const result = await gamingAlerts.testAlert(serverDocument._id);

			res.json({
				success: true,
				type: result.type,
				game: result.game,
			});
		} catch (error) {
			logger.error("Error testing gaming alert:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// GET /dashboard/:id/gaming-alerts/history
	async history (req, res) {
		try {
			const { serverDocument } = req;
			const limit = parseInt(req.query.limit) || 50;

			const GamingAlertHistory = req.app.get("client").database.models.gamingAlertHistory;
			const history = await GamingAlertHistory.find({ server_id: serverDocument._id })
				.sort({ notified_at: -1 })
				.limit(limit)
				.exec();

			res.json({
				success: true,
				history,
			});
		} catch (error) {
			logger.error("Error fetching gaming alert history:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},
};
