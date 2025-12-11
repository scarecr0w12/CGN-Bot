/**
 * Bot List Integration Module
 * Handles stats posting and vote webhook processing for top.gg and discordbotlist.com
 */

const fetch = require("node-fetch");

class BotLists {
	constructor(client) {
		this.client = client;
		this.postInterval = null;
	}

	/**
	 * Initialize the bot lists module - call after client is ready
	 */
	async init() {
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
	async getConfig() {
		const siteSettings = await SiteSettings.findOne("main");
		return siteSettings?.bot_lists || {};
	}

	/**
	 * Get vote reward configuration
	 */
	async getVoteRewardsConfig() {
		const siteSettings = await SiteSettings.findOne("main");
		return siteSettings?.vote_rewards || {};
	}

	/**
	 * Post stats to all enabled bot lists
	 */
	async postAllStats() {
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
	}

	/**
	 * Post stats to top.gg
	 */
	async postToTopgg(stats, token) {
		try {
			const response = await fetch(`https://top.gg/api/bots/${this.client.user.id}/stats`, {
				method: "POST",
				headers: {
					"Authorization": token,
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
	async postToDiscordBotList(stats, token) {
		try {
			const response = await fetch(`https://discordbotlist.com/api/v1/bots/${this.client.user.id}/stats`, {
				method: "POST",
				headers: {
					"Authorization": token,
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
	 * Post slash commands to discordbotlist.com
	 * @param {string} [token] - Optional API token override
	 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
	 */
	async postCommandsToDiscordBotList(token = null) {
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
					"Authorization": `Bot ${apiToken}`,
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
	 * Sync commands to all enabled bot lists
	 */
	async syncAllCommands() {
		const config = await this.getConfig();
		const results = {};

		if (config.discordbotlist?.isEnabled && config.discordbotlist?.api_token && config.discordbotlist?.sync_commands) {
			results.discordbotlist = await this.postCommandsToDiscordBotList(config.discordbotlist.api_token);
		}

		return results;
	}

	/**
	 * Process an incoming vote webhook
	 * @param {string} site - The site the vote came from (topgg, discordbotlist)
	 * @param {object} data - The vote data from the webhook
	 */
	async processVote(site, data) {
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

		if (config.isEnabled) {
			pointsAwarded = config.points_per_vote || 100;
			if (isWeekend) {
				pointsAwarded *= config.weekend_multiplier || 2;
			}

			// Award points to user
			const userDoc = await Users.findOne(userId);
			if (userDoc) {
				userDoc.query.inc("points", pointsAwarded);
				await userDoc.save();
			} else {
				// Create user document if it doesn't exist
				const newUser = Users.new({ _id: userId, points: pointsAwarded });
				await newUser.save();
			}
		}

		// Record the vote
		const voteId = `${site}_${userId}_${Date.now()}`;
		const vote = Votes.new({
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
	async sendVoteNotification(userId, site, points, channelId) {
		try {
			const channel = await this.client.channels.fetch(channelId).catch(() => null);
			if (!channel) return;

			const user = await this.client.users.fetch(userId).catch(() => null);
			const siteName = site === "topgg" ? "top.gg" : "Discord Bot List";

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
	isWeekend() {
		const day = new Date().getUTCDay();
		return day === 0 || day === 6; // Sunday or Saturday
	}

	/**
	 * Get vote stats for a user
	 */
	async getUserVotes(userId, limit = 50) {
		return Votes.find({ user_id: userId }).sort({ timestamp: -1 }).limit(limit).exec();
	}

	/**
	 * Get recent votes across all users
	 */
	async getRecentVotes(limit = 50) {
		return Votes.find({}).sort({ timestamp: -1 }).limit(limit).exec();
	}

	/**
	 * Get vote count for a user in the last 12 hours
	 */
	async getRecentVoteCount(userId) {
		const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
		return Votes.count({ user_id: userId, timestamp: { $gte: twelveHoursAgo } });
	}

	/**
	 * Get total vote counts by site
	 */
	async getVoteStats() {
		const [topggCount, dblCount, totalCount] = await Promise.all([
			Votes.count({ site: "topgg" }),
			Votes.count({ site: "discordbotlist" }),
			Votes.count({}),
		]);
		return { topgg: topggCount, discordbotlist: dblCount, total: totalCount };
	}

	/**
	 * Clean up on shutdown
	 */
	destroy() {
		if (this.postInterval) {
			clearInterval(this.postInterval);
			this.postInterval = null;
		}
	}
}

module.exports = BotLists;
