/**
 * Bot List Integration Module
 * Handles stats posting and vote webhook processing for:
 * - top.gg
 * - discordbotlist.com
 * - discord.bots.gg
 * - discordlist.gg
 * - bots.ondiscord.xyz
 */

const fetch = require("node-fetch");
const VoteRewardsManager = require("./VoteRewardsManager");

class BotLists {
	constructor (client) {
		this.client = client;
		this.postInterval = null;
	}

	/**
	 * Initialize the bot lists module - call after client is ready
	 */
	async init () {
		// Start auto-posting stats every 30 minutes
		this.postInterval = setInterval(() => this.postAllStats(), 30 * 60 * 1000);
		// Post immediately on startup (after 10 second delay)
		setTimeout(() => this.postAllStats(), 10000);
		// Sync commands on startup (after 15 second delay to ensure slash commands are loaded)
		setTimeout(() => this.syncAllCommands(), 15000);
		logger.info("BotLists module initialized");
	}

	/**
	 * Get current bot list configuration from site settings
	 */
	async getConfig () {
		const siteSettings = await SiteSettings.findOne("main");
		return siteSettings?.bot_lists || {};
	}

	/**
	 * Get vote reward configuration
	 */
	async getVoteRewardsConfig () {
		const siteSettings = await SiteSettings.findOne("main");
		return siteSettings?.vote_rewards || {};
	}

	/**
	 * Post stats to all enabled bot lists
	 */
	async postAllStats () {
		const config = await this.getConfig();
		const stats = {
			guilds: this.client.guilds.cache.size,
			users: this.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
			shards: this.client.shard?.count || 1,
		};

		if (config.topgg?.isEnabled && config.topgg?.api_token && config.topgg?.auto_post_stats) {
			await this.postToTopgg(stats, config.topgg.api_token);
		}

		if (config.discordbotlist?.isEnabled && config.discordbotlist?.api_token && config.discordbotlist?.auto_post_stats) {
			await this.postToDiscordBotList(stats, config.discordbotlist.api_token);
		}

		if (config.discordbotsgg?.isEnabled && config.discordbotsgg?.api_token && config.discordbotsgg?.auto_post_stats) {
			await this.postToDiscordBotsGG(stats, config.discordbotsgg.api_token);
		}

		if (config.discordlistgg?.isEnabled && config.discordlistgg?.api_token && config.discordlistgg?.auto_post_stats) {
			await this.postToDiscordListGG(stats, config.discordlistgg.api_token);
		}

		if (config.botsondiscord?.isEnabled && config.botsondiscord?.api_token && config.botsondiscord?.auto_post_stats) {
			await this.postToBotsOnDiscord(stats, config.botsondiscord.api_token);
		}

		if (config.topbotlist?.isEnabled && config.topbotlist?.api_token && config.topbotlist?.auto_post_stats) {
			await this.postToTopBotList(stats, config.topbotlist.api_token);
		}
	}

	/**
	 * Post stats to top.gg
	 */
	async postToTopgg (stats, token) {
		try {
			const response = await fetch(`https://top.gg/api/bots/${this.client.user.id}/stats`, {
				method: "POST",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					server_count: stats.guilds,
					shard_count: stats.shards,
				}),
			});

			if (response.ok) {
				logger.debug("Posted stats to top.gg", { guilds: stats.guilds });
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post stats to top.gg", { status: response.status, body: text });
			}
		} catch (err) {
			logger.error("Error posting to top.gg", {}, err);
		}
	}

	/**
	 * Post stats to discordbotlist.com
	 */
	async postToDiscordBotList (stats, token) {
		try {
			const response = await fetch(`https://discordbotlist.com/api/v1/bots/${this.client.user.id}/stats`, {
				method: "POST",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					guilds: stats.guilds,
					users: stats.users,
				}),
			});

			if (response.ok) {
				logger.debug("Posted stats to discordbotlist.com", { guilds: stats.guilds });
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post stats to discordbotlist.com", { status: response.status, body: text });
			}
		} catch (err) {
			logger.error("Error posting to discordbotlist.com", {}, err);
		}
	}

	/**
	 * Post stats to discord.bots.gg
	 */
	async postToDiscordBotsGG (stats, token) {
		try {
			const response = await fetch(`https://discord.bots.gg/api/v1/bots/${this.client.user.id}/stats`, {
				method: "POST",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					guildCount: stats.guilds,
					shardCount: stats.shards,
				}),
			});

			if (response.ok) {
				logger.debug("Posted stats to discord.bots.gg", { guilds: stats.guilds });
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post stats to discord.bots.gg", { status: response.status, body: text });
			}
		} catch (err) {
			logger.error("Error posting to discord.bots.gg", {}, err);
		}
	}

	/**
	 * Post stats to discordlist.gg
	 */
	async postToDiscordListGG (stats, token) {
		try {
			const guildCount = parseInt(stats.guilds, 10) || 0;
			const response = await fetch(`https://api.discordlist.gg/v0/bots/${this.client.user.id}/guilds?count=${guildCount}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				logger.debug("Posted stats to discordlist.gg", { guilds: stats.guilds });
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post stats to discordlist.gg", { status: response.status, body: text });
			}
		} catch (err) {
			logger.error("Error posting to discordlist.gg", {}, err);
		}
	}

	/**
	 * Post stats to bots.ondiscord.xyz
	 */
	async postToBotsOnDiscord (stats, token) {
		try {
			const response = await fetch(`https://bots.ondiscord.xyz/bot-api/bots/${this.client.user.id}/guilds`, {
				method: "POST",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					guildCount: stats.guilds,
				}),
			});

			if (response.status === 204 || response.ok) {
				logger.debug("Posted stats to bots.ondiscord.xyz", { guilds: stats.guilds });
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post stats to bots.ondiscord.xyz", { status: response.status, body: text });
			}
		} catch (err) {
			logger.error("Error posting to bots.ondiscord.xyz", {}, err);
		}
	}

	/**
	 * Post stats to topbotlist.net
	 */
	async postToTopBotList (stats, token) {
		try {
			const response = await fetch(`https://topbotlist.net/api/bots/${this.client.user.id}/stats`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					server_count: stats.guilds,
					shard_count: stats.shards,
				}),
			});

			if (response.ok) {
				logger.debug("Posted stats to topbotlist.net", { guilds: stats.guilds });
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post stats to topbotlist.net", { status: response.status, body: text });
			}
		} catch (err) {
			logger.error("Error posting to topbotlist.net", {}, err);
		}
	}

	/**
	 * Post slash commands to discordbotlist.com
	 * @param {string} [token] - Optional API token override
	 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
	 */
	async postCommandsToDiscordBotList (token = null) {
		try {
			const config = await this.getConfig();
			const apiToken = token || config.discordbotlist?.api_token;

			if (!apiToken) {
				return { success: false, error: "No API token configured for discordbotlist.com" };
			}

			// Get slash commands from handler
			const slashHandler = this.client.slashCommands;
			if (!slashHandler || !slashHandler.commands || slashHandler.commands.size === 0) {
				return { success: false, error: "No slash commands loaded" };
			}

			// Convert commands to Discord API format
			const commandsData = slashHandler.commands.map(cmd => cmd.data.toJSON());

			const response = await fetch(`https://discordbotlist.com/api/v1/bots/${this.client.user.id}/commands`, {
				method: "POST",
				headers: {
					Authorization: `Bot ${apiToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(commandsData),
			});

			if (response.ok) {
				logger.info("Posted slash commands to discordbotlist.com", { count: commandsData.length });
				return { success: true, count: commandsData.length };
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post commands to discordbotlist.com", { status: response.status, body: text });
				return { success: false, error: `HTTP ${response.status}: ${text}` };
			}
		} catch (err) {
			logger.error("Error posting commands to discordbotlist.com", {}, err);
			return { success: false, error: err.message };
		}
	}

	/**
	 * Post slash commands to topbotlist.net
	 * @param {string} [token] - Optional API token override
	 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
	 */
	async postCommandsToTopBotList (token = null) {
		try {
			const config = await this.getConfig();
			const apiToken = token || config.topbotlist?.api_token;

			if (!apiToken) {
				return { success: false, error: "No API token configured for topbotlist.net" };
			}

			// Get slash commands from handler
			const slashHandler = this.client.slashCommands;
			if (!slashHandler || !slashHandler.commands || slashHandler.commands.size === 0) {
				return { success: false, error: "No slash commands loaded" };
			}

			// Convert commands to Discord API format (topbotlist expects same format)
			const commandsData = slashHandler.commands.map(cmd => cmd.data.toJSON());

			const response = await fetch(`https://topbotlist.net/api/bots/${this.client.user.id}/commands`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(commandsData),
			});

			if (response.ok) {
				logger.info("Posted slash commands to topbotlist.net", { count: commandsData.length });
				return { success: true, count: commandsData.length };
			} else {
				const text = await response.text().catch(() => "");
				logger.warn("Failed to post commands to topbotlist.net", { status: response.status, body: text });
				return { success: false, error: `HTTP ${response.status}: ${text}` };
			}
		} catch (err) {
			logger.error("Error posting commands to topbotlist.net", {}, err);
			return { success: false, error: err.message };
		}
	}

	/**
	 * Sync commands to all enabled bot lists
	 */
	async syncAllCommands () {
		const config = await this.getConfig();
		const results = {};

		if (config.discordbotlist?.isEnabled && config.discordbotlist?.api_token && config.discordbotlist?.sync_commands) {
			results.discordbotlist = await this.postCommandsToDiscordBotList(config.discordbotlist.api_token);
		}

		if (config.topbotlist?.isEnabled && config.topbotlist?.api_token && config.topbotlist?.sync_commands) {
			results.topbotlist = await this.postCommandsToTopBotList(config.topbotlist.api_token);
		}

		return results;
	}

	/**
	 * Process an incoming vote webhook
	 * @param {string} site - The site the vote came from (topgg, discordbotlist)
	 * @param {object} data - The vote data from the webhook
	 */
	async processVote (site, data) {
		const userId = data.user || data.id;
		if (!userId) {
			logger.warn("Vote webhook missing user ID", { site, data });
			return null;
		}

		// Skip test votes
		if (data.type === "test") {
			logger.info("Received test vote webhook", { site, userId });
			return { userId, test: true };
		}

		const config = await this.getVoteRewardsConfig();
		const isWeekend = data.isWeekend || this.isWeekend();
		let pointsAwarded = 0;

		// Process vote through VoteRewardsManager (new separate point system)
		if (config.isEnabled) {
			try {
				const result = await VoteRewardsManager.processVote(userId, site, isWeekend);
				if (result.success) {
					pointsAwarded = result.pointsAwarded;
				}
			} catch (err) {
				logger.error("Failed to process vote rewards", { userId, site }, err);
			}
		}

		// Record the vote in Votes collection (for history/analytics)
		const voteId = `${site}_${userId}_${Date.now()}`;
		const vote = Database.Votes.new({
			_id: voteId,
			user_id: userId,
			site,
			timestamp: new Date(),
			is_weekend: isWeekend,
			points_awarded: pointsAwarded,
			username: data.username,
			avatar: data.avatar,
		});
		await vote.save();

		// Send notification if configured
		if (config.notification_channel_id) {
			await this.sendVoteNotification(userId, site, pointsAwarded, config.notification_channel_id);
		}

		logger.info("Processed vote", { site, userId, pointsAwarded, isWeekend });
		return { userId, pointsAwarded, isWeekend };
	}

	/**
	 * Send a vote notification to a channel
	 */
	async sendVoteNotification (userId, site, points, channelId) {
		try {
			const channel = await this.client.channels.fetch(channelId).catch(() => null);
			if (!channel) return;

			const user = await this.client.users.fetch(userId).catch(() => null);
			const siteNames = {
				topgg: "top.gg",
				discordbotlist: "Discord Bot List",
				discordbotsgg: "Discord Bots GG",
				discordlistgg: "DiscordList.gg",
				botsondiscord: "Bots on Discord",
				topbotlist: "TopBotList",
			};
			const siteName = siteNames[site] || site;

			await channel.send({
				embeds: [{
					color: 0x5865F2,
					author: {
						name: user?.username || "Someone",
						icon_url: user?.displayAvatarURL() || undefined,
					},
					description: `🗳️ **${user?.username || "Someone"}** voted on **${siteName}**!${points > 0 ? `\n+${points} points awarded` : ""}`,
					timestamp: new Date().toISOString(),
				}],
			});
		} catch (err) {
			logger.debug("Failed to send vote notification", { channelId }, err);
		}
	}

	/**
	 * Check if it's currently a weekend (for bonus points)
	 */
	isWeekend () {
		const day = new Date().getUTCDay();
		return day === 0 || day === 6; // Sunday or Saturday
	}

	/**
	 * Get vote stats for a user
	 */
	async getUserVotes (userId, limit = 50) {
		return Database.Votes.find({ user_id: userId })
			.sort({ timestamp: -1 })
			.limit(limit)
			.exec();
	}

	/**
	 * Get recent votes across all users
	 */
	async getRecentVotes (limit = 50) {
		return Database.Votes.find({})
			.sort({ timestamp: -1 })
			.limit(limit)
			.exec();
	}

	/**
	 * Get vote count for a user in the last 12 hours
	 */
	async getRecentVoteCount (userId) {
		const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
		return Database.Votes.count({ user_id: userId, timestamp: { $gte: twelveHoursAgo } });
	}

	/**
	 * Get total vote counts by site
	 */
	async getVoteStats () {
		const [topggCount, dblCount, topbotlistCount, totalCount] = await Promise.all([
			Database.Votes.count({ site: "topgg" }),
			Database.Votes.count({ site: "discordbotlist" }),
			Database.Votes.count({ site: "topbotlist" }),
			Database.Votes.count({}),
		]);
		return { topgg: topggCount, discordbotlist: dblCount, topbotlist: topbotlistCount, total: totalCount };
	}

	/**
	 * Clean up on shutdown
	 */
	destroy () {
		if (this.postInterval) {
			clearInterval(this.postInterval);
			this.postInterval = null;
		}
	}
}

module.exports = BotLists;
