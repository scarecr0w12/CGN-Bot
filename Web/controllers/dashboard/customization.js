/**
 * Bot Customization Controller
 * Handles dashboard UI for bot personalization features (Tier 2+)
 */

const Logger = require("../../../Internals/Logger");
const logger = new Logger("Customization");

module.exports = {
	async get (req, res) {
		try {
			const serverDocument = req.svr.document;

			const customization = serverDocument?.config?.bot_customization || {
				nickname: "",
				status_text: "",
				status_type: "PLAYING",
				status_state: "online",
				isEnabled: false,
			};

			const botMember = req.svr.members?.[req.app.client.user.id];
			const botName = botMember?.nickname || req.app.client.user.username;

			res.setPageData({
				page: "admin-bot-customization.ejs",
				customization,
				botName,
			});
			res.render();
		} catch (error) {
			logger.error("Error loading bot customization page", {}, error);
			return res.status(500).render("pages/error.ejs", {
				error_text: "Error",
				error_line: "Failed to load bot customization settings.",
			});
		}
	},

	async post (req, res) {
		const { nickname, status_text, status_type, status_state, isEnabled } = req.body;

		try {
			// Check tier permission
			const TierManager = require("../../../Modules/TierManager");
			const tier = await TierManager.getServerTier(req.svr.id);

			if (!tier || (tier.tier_id !== "premium" && tier.tier_id !== "enterprise")) {
				return res.status(403).json({
					success: false,
					message: "Bot customization requires Tier 2 (Premium) or higher",
				});
			}

			// Update configuration
			const serverDocument = req.svr.document;
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
				await req.app.client.botCustomization.updateCustomization(req.svr.id, {
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
		try {
			if (req.app.client?.botCustomization) {
				await req.app.client.botCustomization.resetCustomization(req.svr.id);
			}

			res.json({ success: true, message: "Bot customization reset to defaults" });
		} catch (error) {
			req.app.client?.logger.error(`Error resetting bot customization: ${error.message}`);
			res.status(500).json({ success: false, message: error.message });
		}
	},
};
