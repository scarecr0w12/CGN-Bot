const Logger = require("../../../Internals/Logger");
const logger = new Logger("Dashboard-SocialAlerts");

module.exports = {
	// GET /dashboard/:id/socialalerts
	async index (req, res) {
		try {
			const { serverDocument } = req;
			const SocialAlerts = req.app.get("client").database.models.socialAlerts;

			// Get all alerts for this server
			const alerts = await SocialAlerts.find({ server_id: serverDocument._id })
				.sort({ created_at: -1 })
				.exec();

			// Get tier limits
			const TierManager = require("../../../Modules/TierManager");
			const tier = await TierManager.getServerTier(serverDocument._id);
			const tierLimits = {
				free: 3,
				starter: 10,
				premium: -1,
			};

			const maxAlerts = tierLimits[tier] || 0;
			const canAdd = maxAlerts === -1 || alerts.length < maxAlerts;

			res.render("pages/dashboard/socialalerts", {
				title: "Social Media Alerts",
				alerts,
				canAdd,
				currentCount: alerts.length,
				maxAlerts: maxAlerts === -1 ? "Unlimited" : maxAlerts,
				tier,
			});
		} catch (error) {
			logger.error("Error loading social alerts:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load social alerts",
			});
		}
	},

	// POST /dashboard/:id/socialalerts/add
	async add (req, res) {
		try {
			const { serverDocument } = req;
			const { platform, account, channel_id, template, role_mentions } = req.body;

			if (!platform || !account || !channel_id) {
				return res.status(400).json({
					success: false,
					error: "Missing required fields",
				});
			}

			const socialAlerts = req.app.get("client").socialAlerts;
			if (!socialAlerts) {
				return res.status(503).json({
					success: false,
					error: "Social Alerts system not initialized",
				});
			}

			// Resolve account ID based on platform
			let accountId;
			let accountName;

			if (platform === "twitch") {
				const monitor = socialAlerts.monitors.get("twitch");
				const userInfo = await monitor.getUserByLogin(account);
				if (!userInfo) {
					return res.status(404).json({
						success: false,
						error: "Twitch user not found",
					});
				}
				accountId = userInfo.id;
				accountName = userInfo.login;
			} else if (platform === "youtube") {
				const monitor = socialAlerts.monitors.get("youtube");
				const channelInfo = await monitor.getChannelByUsername(account);
				if (!channelInfo) {
					return res.status(404).json({
						success: false,
						error: "YouTube channel not found",
					});
				}
				accountId = channelInfo.id;
				accountName = channelInfo.title;
			}

			// Add alert
			const alert = await socialAlerts.addAlert(serverDocument._id, {
				channel_id,
				platform,
				account_id: accountId,
				account_name: accountName,
				template: template || null,
				role_mentions: role_mentions ? role_mentions.split(",").map(r => r.trim()) : null,
			});

			res.json({
				success: true,
				alert,
			});
		} catch (error) {
			logger.error("Error adding social alert:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// POST /dashboard/:id/socialalerts/:alertId/toggle
	async toggle (req, res) {
		try {
			const { alertId } = req.params;
			const { enabled } = req.body;

			const SocialAlerts = req.app.get("client").database.models.socialAlerts;
			await SocialAlerts.update({ _id: alertId }, { enabled: enabled === "true" || enabled === true });

			res.json({ success: true });
		} catch (error) {
			logger.error("Error toggling social alert:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// DELETE /dashboard/:id/socialalerts/:alertId
	async delete (req, res) {
		try {
			const { alertId } = req.params;
			const { serverDocument } = req;

			const socialAlerts = req.app.get("client").socialAlerts;
			await socialAlerts.removeAlert(serverDocument._id, alertId);

			res.json({ success: true });
		} catch (error) {
			logger.error("Error deleting social alert:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},
};
