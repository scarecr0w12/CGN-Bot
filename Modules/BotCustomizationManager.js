/**
 * BotCustomizationManager - Handles per-server bot customization (Tier 2+)
 *
 * Features:
 * - Tier 2: Custom nickname and status per server
 * - Tier 3 (Future): Dedicated bot instances
 *
 * Technical Limitations:
 * - Bot avatar is global (cannot be per-server without webhooks)
 * - Status is global (last server to update wins)
 * - Nickname can be server-specific (guild.members.me.setNickname)
 */

const Logger = require("../Internals/Logger");
const logger = new Logger("BotCustomizationManager");

class BotCustomizationManager {
	constructor (client) {
		this.client = client;
		this.statusRotationInterval = null;
	}

	/**
	 * Initialize the manager and apply global status
	 */
	async initialize () {
		logger.info("Initializing Bot Customization Manager");

		// Apply global default status
		await this.applyGlobalStatus();

		// Start status rotation checker (every 5 minutes)
		this.statusRotationInterval = setInterval(() => {
			this.applyGlobalStatus();
		}, 5 * 60 * 1000);

		logger.info("Bot Customization Manager initialized");
	}

	/**
	 * Apply customization when bot joins a guild
	 * @param {Guild} guild - Discord guild object
	 */
	async applyOnGuildJoin (guild) {
		try {
			const serverDocument = await global.Servers.findOne({ _id: guild.id });
			if (!serverDocument) return;

			const config = serverDocument.config?.bot_customization;
			if (!config?.isEnabled) return;

			// Check tier permissions
			const hasTier = await this.checkTierPermission(guild.id);
			if (!hasTier) return;

			// Apply nickname
			await this.applyNickname(guild, config.nickname);

			logger.info(`Applied bot customization for guild ${guild.id} (${guild.name})`);
		} catch (error) {
			logger.error(`Error applying customization on guild join: ${error.message}`);
		}
	}

	/**
	 * Update bot customization for a specific guild
	 * @param {string} guildId - Guild ID
	 * @param {Object} settings - Customization settings
	 */
	async updateCustomization (guildId, settings) {
		try {
			const guild = this.client.guilds.cache.get(guildId);
			if (!guild) {
				throw new Error("Guild not found or bot not in guild");
			}

			// Check tier permissions
			const hasTier = await this.checkTierPermission(guildId);
			if (!hasTier) {
				throw new Error("This feature requires Tier 2 (Premium) or higher");
			}

			// Update database
			const serverDocument = await global.Servers.findOne({ _id: guildId });
			if (!serverDocument) {
				throw new Error("Server configuration not found");
			}

			// Merge settings
			if (!serverDocument.config) {
				serverDocument.config = {};
			}
			if (!serverDocument.config.bot_customization) {
				serverDocument.config.bot_customization = {};
			}

			Object.assign(serverDocument.config.bot_customization, settings);
			await serverDocument.save();

			// Apply changes immediately if enabled
			if (serverDocument.config.bot_customization.isEnabled) {
				await this.applyNickname(guild, serverDocument.config.bot_customization.nickname);

				// Apply status (will affect all servers since status is global)
				if (serverDocument.config.bot_customization.status_text) {
					await this.applyStatus(
						serverDocument.config.bot_customization.status_text,
						serverDocument.config.bot_customization.status_type,
						serverDocument.config.bot_customization.status_state,
					);
				}
			}

			logger.info(`Updated bot customization for guild ${guildId}`);
			return true;
		} catch (error) {
			logger.error(`Error updating customization: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Apply nickname to bot in a guild
	 * @param {Guild} guild - Discord guild
	 * @param {string} nickname - Custom nickname
	 */
	async applyNickname (guild, nickname) {
		try {
			if (!nickname) {
				// Reset to default
				await guild.members.me.setNickname(null);
			} else {
				await guild.members.me.setNickname(nickname);
			}
			logger.debug(`Set nickname in ${guild.name}: ${nickname || "(reset)"}`);
		} catch (error) {
			logger.error(`Failed to set nickname in ${guild.name}: ${error.message}`);
		}
	}

	/**
	 * Apply custom status (global)
	 * @param {string} text - Status text
	 * @param {string} type - Status type (PLAYING, WATCHING, etc.)
	 * @param {string} state - Status state (online, idle, dnd)
	 */
	async applyStatus (text, type = "PLAYING", state = "online") {
		try {
			const { ActivityType, PresenceUpdateStatus } = require("discord.js");

			// Map string to ActivityType
			const activityTypeMap = {
				PLAYING: ActivityType.Playing,
				WATCHING: ActivityType.Watching,
				LISTENING: ActivityType.Listening,
				COMPETING: ActivityType.Competing,
				STREAMING: ActivityType.Streaming,
			};

			// Map string to PresenceUpdateStatus
			const statusMap = {
				online: PresenceUpdateStatus.Online,
				idle: PresenceUpdateStatus.Idle,
				dnd: PresenceUpdateStatus.DoNotDisturb,
				invisible: PresenceUpdateStatus.Invisible,
			};

			await this.client.user.setPresence({
				activities: text ? [{
					name: text,
					type: activityTypeMap[type] || ActivityType.Playing,
				}] : [],
				status: statusMap[state] || PresenceUpdateStatus.Online,
			});

			logger.debug(`Set global status: ${type} ${text} (${state})`);
		} catch (error) {
			logger.error(`Failed to set status: ${error.message}`);
		}
	}

	/**
	 * Apply global default status (when no custom status is set)
	 */
	async applyGlobalStatus () {
		try {
			// Check if any Tier 2+ server has custom status enabled
			const servers = await global.Servers.find({
				"config.bot_customization.isEnabled": true,
				"config.bot_customization.status_text": { $ne: "" },
			}).exec();

			if (servers.length > 0) {
				// Apply the first active custom status found
				const config = servers[0].config.bot_customization;
				await this.applyStatus(config.status_text, config.status_type, config.status_state);
			} else {
				// Apply default status
				const { ActivityType, PresenceUpdateStatus } = require("discord.js");
				await this.client.user.setPresence({
					activities: [{
						name: "discord.gg/SE6xHmvKrZ | /help",
						type: ActivityType.Playing,
					}],
					status: PresenceUpdateStatus.Online,
				});
			}
		} catch (error) {
			logger.error(`Failed to apply global status: ${error.message}`);
		}
	}

	/**
	 * Check if guild has required tier for bot customization
	 * @param {string} guildId - Guild ID
	 * @returns {Promise<boolean>}
	 */
	async checkTierPermission (guildId) {
		try {
			const TierManager = require("./TierManager");
			const tier = await TierManager.getServerTier(guildId);

			// Tier 2 (premium) or Tier 3 required
			return tier?.tier_id === "premium" || tier?.tier_id === "enterprise";
		} catch (error) {
			logger.error(`Error checking tier permission: ${error.message}`);
			return false;
		}
	}

	/**
	 * Get current customization settings for a guild
	 * @param {string} guildId - Guild ID
	 * @returns {Promise<Object>}
	 */
	async getCustomization (guildId) {
		try {
			const serverDocument = await global.Servers.findOne({ _id: guildId });
			if (!serverDocument?.config?.bot_customization) {
				return {
					nickname: "",
					status_text: "",
					status_type: "PLAYING",
					status_state: "online",
					isEnabled: false,
				};
			}
			return serverDocument.config.bot_customization;
		} catch (error) {
			logger.error(`Error getting customization: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Reset customization to defaults
	 * @param {string} guildId - Guild ID
	 */
	async resetCustomization (guildId) {
		try {
			const guild = this.client.guilds.cache.get(guildId);
			if (!guild) {
				throw new Error("Guild not found");
			}

			// Reset nickname
			await guild.members.me.setNickname(null);

			// Update database
			const serverDocument = await global.Servers.findOne({ _id: guildId });
			if (serverDocument?.config?.bot_customization) {
				serverDocument.config.bot_customization = {
					nickname: "",
					status_text: "",
					status_type: "PLAYING",
					status_state: "online",
					isEnabled: false,
				};
				await serverDocument.save();
			}

			// Reapply global status
			await this.applyGlobalStatus();

			logger.info(`Reset bot customization for guild ${guildId}`);
			return true;
		} catch (error) {
			logger.error(`Error resetting customization: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Cleanup on shutdown
	 */
	shutdown () {
		if (this.statusRotationInterval) {
			clearInterval(this.statusRotationInterval);
		}
	}
}

module.exports = BotCustomizationManager;
