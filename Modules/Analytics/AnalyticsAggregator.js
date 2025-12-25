/**
 * AnalyticsAggregator - Aggregates and stores historical analytics data
 *
 * Runs daily to collect and store analytics snapshots for trend analysis.
 */

class AnalyticsAggregator {
	/**
	 * Create a daily analytics snapshot for a server
	 * @param {Object} serverDocument - Server document
	 * @param {Object} guild - Discord guild
	 * @returns {Object} Analytics snapshot for storage
	 */
	static async createDailySnapshot (serverDocument, guild) {
		const members = Object.values(serverDocument.members || {});
		const channels = serverDocument.channels || {};
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Channel activity
		const channelActivity = [];
		for (const [channelId, channelData] of Object.entries(channels)) {
			const guildChannel = guild.channels?.cache?.get(channelId);
			if (guildChannel) {
				channelActivity.push({
					channel_id: channelId,
					channel_name: guildChannel.name,
					message_count: channelData.messages || 0,
				});
			}
		}

		// Member activity summary
		const activeCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const activeMembers = members.filter(
			m => m.last_active && new Date(m.last_active) > activeCutoff,
		).length;

		// Role engagement
		const roleEngagement = [];
		const roleStats = new Map();

		for (const [memberId, member] of guild.members.cache) {
			const memberDoc = members.find(m => m._id === memberId);
			const isActive = memberDoc?.last_active && new Date(memberDoc.last_active) > activeCutoff;

			for (const [roleId, role] of member.roles.cache) {
				if (role.name === "@everyone") continue;

				if (!roleStats.has(roleId)) {
					roleStats.set(roleId, {
						role_id: roleId,
						role_name: role.name,
						member_count: 0,
						active_members: 0,
					});
				}

				const stats = roleStats.get(roleId);
				stats.member_count++;
				if (isActive) stats.active_members++;
			}
		}

		roleStats.forEach(stats => roleEngagement.push(stats));

		// Command usage
		const commandUsage = serverDocument.command_usage || {};

		// Find peak hour and most active channel
		let mostActiveChannel = null;
		let maxMessages = 0;
		channelActivity.forEach(c => {
			if (c.message_count > maxMessages) {
				maxMessages = c.message_count;
				mostActiveChannel = c.channel_name;
			}
		});

		return {
			_id: `${serverDocument._id}_${today.toISOString().split("T")[0]}`,
			server_id: serverDocument._id,
			date: today,
			channel_activity: channelActivity,
			hourly_activity: [], // Would need message timestamp tracking
			member_activity: {
				active_members: activeMembers,
				new_messages: serverDocument.messages_today || 0,
				voice_minutes: 0, // Would need voice tracking
			},
			join_leave: {
				joins: 0, // Would need event tracking
				leaves: 0,
				net_change: 0,
			},
			command_usage: commandUsage,
			role_engagement: roleEngagement,
			summary: {
				total_messages: serverDocument.messages_today || 0,
				total_members: guild.memberCount,
				peak_hour: null,
				most_active_channel: mostActiveChannel,
			},
			created_at: new Date(),
		};
	}

	/**
	 * Get analytics data for a date range
	 * @param {string} serverId - Server ID
	 * @param {number} days - Number of days to fetch
	 * @returns {Promise<Array>} Array of daily snapshots
	 */
	static async getHistoricalData (serverId, days = 30) {
		const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		try {
			const data = await Database.serverAnalytics
				.find({
					server_id: serverId,
					date: { $gte: cutoffDate },
				})
				.sort({ date: -1 })
				.exec();

			return data || [];
		} catch (err) {
			logger.warn("Failed to fetch historical analytics", { serverId }, err);
			return [];
		}
	}

	/**
	 * Calculate trends from historical data
	 * @param {Array} historicalData - Array of daily snapshots
	 * @returns {Object} Trend analysis
	 */
	static calculateTrends (historicalData) {
		if (!historicalData || historicalData.length < 2) {
			return {
				messagesTrend: 0,
				membersTrend: 0,
				activityTrend: 0,
				hasEnoughData: false,
			};
		}

		// Sort by date ascending
		const sorted = [...historicalData].sort((a, b) =>
			new Date(a.date) - new Date(b.date),
		);

		// Calculate trends (compare first half to second half)
		const midpoint = Math.floor(sorted.length / 2);
		const firstHalf = sorted.slice(0, midpoint);
		const secondHalf = sorted.slice(midpoint);

		const avgFirst = arr => arr.reduce((sum, d) =>
			sum + (d.summary?.total_messages || 0), 0) / arr.length;
		const avgSecond = arr => arr.reduce((sum, d) =>
			sum + (d.summary?.total_messages || 0), 0) / arr.length;

		const firstAvg = avgFirst(firstHalf);
		const secondAvg = avgSecond(secondHalf);

		const messagesTrend = firstAvg > 0 ?
			Math.round(((secondAvg - firstAvg) / firstAvg) * 100) :
			0;

		return {
			messagesTrend,
			membersTrend: 0, // Would need member count history
			activityTrend: messagesTrend, // Simplified
			hasEnoughData: true,
			periodDays: sorted.length,
		};
	}
}

module.exports = AnalyticsAggregator;
