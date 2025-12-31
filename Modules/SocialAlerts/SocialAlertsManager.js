const Logger = require("../../Internals/Logger");
const logger = new Logger("SocialAlertsManager");

class SocialAlertsManager {
	constructor (client) {
		this.client = client;
		this.monitors = new Map();
		this.checkInterval = 60000; // 1 minute
	}

	async initialize () {
		logger.info("Initializing Social Alerts Manager...");

		// Initialize monitors
		const TwitchMonitor = require("./TwitchMonitor");
		const YouTubeMonitor = require("./YouTubeMonitor");

		this.monitors.set("twitch", new TwitchMonitor(this.client));
		this.monitors.set("youtube", new YouTubeMonitor(this.client));

		// Start all monitors
		for (const [platform, monitor] of this.monitors) {
			try {
				await monitor.start();
				logger.info(`Started ${platform} monitor`);
			} catch (error) {
				logger.error(`Failed to start ${platform} monitor:`, error);
			}
		}

		logger.info("Social Alerts Manager initialized successfully");
	}

	async addAlert (serverConfig) {
		const { server_id, platform, account_id } = serverConfig;

		// Check tier limits
		const tierLimits = await this.checkTierLimits(server_id);
		if (!tierLimits.canAdd) {
			throw new Error(`Social alert limit reached. Upgrade to ${tierLimits.requiredTier} for more alerts.`);
		}

		// Add to database
		const SocialAlerts = this.client.database.models.socialAlerts;
		const alert = await SocialAlerts.create(serverConfig);

		// Notify monitor
		const monitor = this.monitors.get(platform);
		if (monitor) {
			await monitor.addAlert(alert);
		}

		logger.info(`Added ${platform} alert for server ${server_id}: ${account_id}`);
		return alert;
	}

	async removeAlert (alertId) {
		const SocialAlerts = this.client.database.models.socialAlerts;
		const alert = await SocialAlerts.findOne({ _id: alertId }).exec();

		if (!alert) {
			throw new Error("Alert not found");
		}

		// Notify monitor
		const monitor = this.monitors.get(alert.platform);
		if (monitor) {
			await monitor.removeAlert(alert);
		}

		await SocialAlerts.delete({ _id: alertId });
		logger.info(`Removed ${alert.platform} alert ${alertId}`);
	}

	async getServerAlerts (serverId) {
		const SocialAlerts = this.client.database.models.socialAlerts;
		return SocialAlerts.find({ server_id: serverId, enabled: true }).exec();
	}

	async checkTierLimits (serverId) {
		const TierManager = require("../TierManager");
		const tier = await TierManager.getServerTier(serverId);

		const limits = {
			free: 3,
			starter: 10,
			premium: -1, // unlimited
		};

		const maxAlerts = limits[tier] || 0;
		const currentCount = await this.getServerAlerts(serverId).then(alerts => alerts.length);

		if (maxAlerts === -1) {
			return { canAdd: true, current: currentCount, max: "Unlimited" };
		}

		return {
			canAdd: currentCount < maxAlerts,
			current: currentCount,
			max: maxAlerts,
			requiredTier: currentCount >= maxAlerts ? tier === "free" ? "Tier 1" : "Tier 2" : null,
		};
	}

	async sendAlert (alert, data) {
		try {
			const channel = await this.client.channels.fetch(alert.channel_id);
			if (!channel || !channel.isTextBased()) {
				logger.warn(`Invalid channel for alert ${alert._id}`);
				return;
			}

			// Build embed from template or use default
			const embed = this.buildEmbed(alert, data);

			// Build mention string
			let content = "";
			if (alert.role_mentions && alert.role_mentions.length > 0) {
				content = alert.role_mentions.map(roleId => `<@&${roleId}>`).join(" ");
			}

			await channel.send({ content, embeds: [embed] });
			logger.info(`Sent ${alert.platform} alert for ${alert.account_name}`);
		} catch (error) {
			logger.error(`Failed to send alert ${alert._id}:`, error);
		}
	}

	buildEmbed (alert, data) {
		const { EmbedBuilder } = require("discord.js");
		const embed = new EmbedBuilder();

		// Use custom template if available
		if (alert.template && alert.template.title) {
			embed.setTitle(this.replacePlaceholders(alert.template.title, data));
		}

		if (alert.template && alert.template.description) {
			embed.setDescription(this.replacePlaceholders(alert.template.description, data));
		} else {
			// Default templates by platform
			switch (alert.platform) {
				case "twitch":
					embed.setTitle(`${data.user_name} is now live on Twitch!`);
					embed.setDescription(data.title || "No title");
					embed.setURL(`https://twitch.tv/${data.user_login}`);
					if (data.thumbnail_url) {
						embed.setImage(data.thumbnail_url.replace("{width}", "1280").replace("{height}", "720"));
					}
					embed.addFields(
						{ name: "Game", value: data.game_name || "Unknown", inline: true },
						{ name: "Viewers", value: data.viewer_count.toString(), inline: true },
					);
					embed.setColor("#9146FF");
					break;

				case "youtube":
					embed.setTitle(`${data.channel_name} uploaded a new video!`);
					embed.setDescription(data.title || "No title");
					embed.setURL(data.url);
					if (data.thumbnail) {
						embed.setImage(data.thumbnail);
					}
					embed.setColor("#FF0000");
					break;
			}
		}

		embed.setTimestamp();
		return embed;
	}

	replacePlaceholders (text, data) {
		return text
			.replace(/{user_name}/g, data.user_name || data.channel_name || "")
			.replace(/{title}/g, data.title || "")
			.replace(/{game}/g, data.game_name || "")
			.replace(/{viewers}/g, data.viewer_count || "")
			.replace(/{url}/g, data.url || "");
	}

	async shutdown () {
		logger.info("Shutting down Social Alerts Manager...");
		for (const [platform, monitor] of this.monitors) {
			try {
				await monitor.stop();
				logger.info(`Stopped ${platform} monitor`);
			} catch (error) {
				logger.error(`Error stopping ${platform} monitor:`, error);
			}
		}
	}
}

module.exports = SocialAlertsManager;
