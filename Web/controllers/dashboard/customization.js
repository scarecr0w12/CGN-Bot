/**
 * Bot Customization Controller
 * Handles dashboard UI for bot personalization features (Tier 2+)
 */

module.exports = {
	async get (req, res) {
		const { guild } = res.locals;
		const serverDocument = await global.Servers.findOne({ _id: guild.id });

		const customization = serverDocument?.config?.bot_customization || {
			nickname: "",
			status_text: "",
			status_type: "PLAYING",
			status_state: "online",
			isEnabled: false,
		};

		res.render("pages/admin-bot-customization", {
			...req.isAPI ? {} : res.locals.dashboardData,
			customization,
		});
	},

	async post (req, res) {
		const { guild } = res.locals;
		const { nickname, status_text, status_type, status_state, isEnabled } = req.body;

		try {
			// Check tier permission
			const TierManager = require("../../../Modules/TierManager");
			const tier = await TierManager.getServerTier(guild.id);

			if (!tier || (tier.tier_id !== "premium" && tier.tier_id !== "enterprise")) {
				return res.status(403).json({
					success: false,
					message: "Bot customization requires Tier 2 (Premium) or higher",
				});
			}

			// Update configuration
			const serverDocument = await global.Servers.findOne({ _id: guild.id });
			if (!serverDocument) {
				return res.status(404).json({ success: false, message: "Server not found" });
			}

			if (!serverDocument.config) {
				serverDocument.config = {};
			}
			if (!serverDocument.config.bot_customization) {
				serverDocument.config.bot_customization = {};
			}

			// Update settings
			serverDocument.config.bot_customization.nickname = nickname || "";
			serverDocument.config.bot_customization.status_text = status_text || "";
			serverDocument.config.bot_customization.status_type = status_type || "PLAYING";
			serverDocument.config.bot_customization.status_state = status_state || "online";
			serverDocument.config.bot_customization.isEnabled = isEnabled === "true" || isEnabled === true;

			await serverDocument.save();

			// Apply changes via BotCustomizationManager
			if (req.app.client?.botCustomization) {
				await req.app.client.botCustomization.updateCustomization(guild.id, {
					nickname: serverDocument.config.bot_customization.nickname,
					status_text: serverDocument.config.bot_customization.status_text,
					status_type: serverDocument.config.bot_customization.status_type,
					status_state: serverDocument.config.bot_customization.status_state,
					isEnabled: serverDocument.config.bot_customization.isEnabled,
				});
			}

			res.json({ success: true, message: "Bot customization settings updated" });
		} catch (error) {
			req.app.client?.logger.error(`Error updating bot customization: ${error.message}`);
			res.status(500).json({ success: false, message: error.message });
		}
	},

	async reset (req, res) {
		const { guild } = res.locals;

		try {
			if (req.app.client?.botCustomization) {
				await req.app.client.botCustomization.resetCustomization(guild.id);
			}

			res.json({ success: true, message: "Bot customization reset to defaults" });
		} catch (error) {
			req.app.client?.logger.error(`Error resetting bot customization: ${error.message}`);
			res.status(500).json({ success: false, message: error.message });
		}
	},
};
