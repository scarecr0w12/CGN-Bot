/**
 * AnalyticsCollector - Collects and processes analytics data
 *
 * This module gathers real-time data from server documents and
 * processes it into analytics-ready formats.
 */

const TierManager = require("../TierManager");

class AnalyticsCollector {
	/**
	 * Get member activity statistics for a server
	 * @param {Object} serverDocument - Server document from database
	 * @param {Object} guild - Discord guild object
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Member activity stats
	 */
	static async getMemberActivity (serverDocument, guild, options = {}) {
		const { days = 7, limit = 25 } = options;
		const members = Object.values(serverDocument.members || {});
		const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		// Active vs inactive members
		const activeMembers = members.filter(
			m => m.last_active && new Date(m.last_active) > cutoffDate,
		);
		const inactiveMembers = members.filter(
			m => !m.last_active || new Date(m.last_active) <= cutoffDate,
		);

		// Top members by messages
		const topByMessages = members
			.filter(m => (m.messages || 0) > 0)
			.sort((a, b) => (b.messages || 0) - (a.messages || 0))
			.slice(0, limit)
			.map(m => ({
				id: m._id,
				messages: m.messages || 0,
				voice: m.voice || 0,
				rank: m.rank || "No Rank",
				lastActive: m.last_active,
			}));

		// Top members by voice time
		const topByVoice = members
			.filter(m => (m.voice || 0) > 0)
			.sort((a, b) => (b.voice || 0) - (a.voice || 0))
			.slice(0, limit)
			.map(m => ({
				id: m._id,
				messages: m.messages || 0,
				voice: m.voice || 0,
				rank: m.rank || "No Rank",
				lastActive: m.last_active,
			}));

		// Recently active members
		const recentlyActive = activeMembers
			.sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
			.slice(0, limit)
			.map(m => ({
				id: m._id,
				messages: m.messages || 0,
				lastActive: m.last_active,
			}));

		// Activity rate calculation
		const activityRate = members.length > 0 ?
			Math.round((activeMembers.length / members.length) * 100) :
			0;

		// Message distribution
		const messageDistribution = {
			none: members.filter(m => (m.messages || 0) === 0).length,
			low: members.filter(m => (m.messages || 0) > 0 && (m.messages || 0) <= 50).length,
			medium: members.filter(m => (m.messages || 0) > 50 && (m.messages || 0) <= 200).length,
			high: members.filter(m => (m.messages || 0) > 200 && (m.messages || 0) <= 500).length,
			veryHigh: members.filter(m => (m.messages || 0) > 500).length,
		};

		return {
			overview: {
				totalTracked: members.length,
				activeCount: activeMembers.length,
				inactiveCount: inactiveMembers.length,
				activityRate,
				periodDays: days,
			},
			topByMessages,
			topByVoice,
			recentlyActive,
			messageDistribution,
			totalMessages: members.reduce((sum, m) => sum + (m.messages || 0), 0),
			totalVoice: members.reduce((sum, m) => sum + (m.voice || 0), 0),
		};
	}

	/**
	 * Get channel activity statistics
	 * @param {Object} serverDocument - Server document
	 * @param {Object} guild - Discord guild
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Channel activity stats
	 */
	static async getChannelActivity (serverDocument, guild, options = {}) {
		const { limit = 20 } = options;
		const channels = serverDocument.channels || {};

		// Calculate activity per channel
		const channelStats = [];
		for (const [channelId, channelData] of Object.entries(channels)) {
			const guildChannel = guild.channels?.cache?.get(channelId);
			if (!guildChannel) continue;

			channelStats.push({
				id: channelId,
				name: guildChannel.name,
				type: guildChannel.type,
				messages: channelData.messages || 0,
				isEnabled: !channelData.disabled,
			});
		}

		// Sort by message count
		channelStats.sort((a, b) => b.messages - a.messages);

		const totalMessages = channelStats.reduce((sum, c) => sum + c.messages, 0);

		// Top channels
		const topChannels = channelStats.slice(0, limit).map(c => ({
			...c,
			percentage: totalMessages > 0 ?
				Math.round((c.messages / totalMessages) * 100) :
				0,
		}));

		// Channel type distribution
		const typeDistribution = {
			text: channelStats.filter(c => c.type === 0).length,
			voice: channelStats.filter(c => c.type === 2).length,
			category: channelStats.filter(c => c.type === 4).length,
			forum: channelStats.filter(c => c.type === 15).length,
			thread: channelStats.filter(c => c.type === 11 || c.type === 12).length,
		};

		return {
			overview: {
				totalChannels: channelStats.length,
				totalMessages,
				averageMessagesPerChannel: channelStats.length > 0 ?
					Math.round(totalMessages / channelStats.length) :
					0,
			},
			topChannels,
			typeDistribution,
			allChannels: channelStats,
		};
	}

	/**
	 * Get role engagement statistics
	 * @param {Object} serverDocument - Server document
	 * @param {Object} guild - Discord guild
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Role engagement stats
	 */
	static async getRoleEngagement (serverDocument, guild, options = {}) {
		const { days = 7, limit = 20 } = options;
		const members = Object.values(serverDocument.members || {});
		const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		const roleStats = new Map();

		// Iterate through guild members to get role data
		for (const [memberId, member] of guild.members.cache) {
			const memberDoc = members.find(m => m._id === memberId);
			const isActive = memberDoc?.last_active && new Date(memberDoc.last_active) > cutoffDate;

			for (const [roleId, role] of member.roles.cache) {
				if (role.name === "@everyone") continue;

				if (!roleStats.has(roleId)) {
					roleStats.set(roleId, {
						id: roleId,
						name: role.name,
						color: role.hexColor,
						position: role.position,
						memberCount: 0,
						activeMembers: 0,
						totalMessages: 0,
					});
				}

				const stats = roleStats.get(roleId);
				stats.memberCount++;
				if (isActive) stats.activeMembers++;
				stats.totalMessages += memberDoc?.messages || 0;
			}
		}

		// Convert to array and calculate engagement rate
		const roleArray = Array.from(roleStats.values()).map(r => ({
			...r,
			engagementRate: r.memberCount > 0 ?
				Math.round((r.activeMembers / r.memberCount) * 100) :
				0,
			avgMessages: r.memberCount > 0 ?
				Math.round(r.totalMessages / r.memberCount) :
				0,
		}));

		// Sort by member count
		roleArray.sort((a, b) => b.memberCount - a.memberCount);

		// Top roles by engagement
		const topByEngagement = [...roleArray]
			.filter(r => r.memberCount >= 3) // Min 3 members for meaningful engagement
			.sort((a, b) => b.engagementRate - a.engagementRate)
			.slice(0, limit);

		// Top roles by activity (messages)
		const topByActivity = [...roleArray]
			.sort((a, b) => b.totalMessages - a.totalMessages)
			.slice(0, limit);

		return {
			overview: {
				totalRoles: roleArray.length,
				totalMembers: guild.memberCount,
				periodDays: days,
			},
			topBySize: roleArray.slice(0, limit),
			topByEngagement,
			topByActivity,
			allRoles: roleArray,
		};
	}

	/**
	 * Get join/leave analytics
	 * @param {Object} serverDocument - Server document
	 * @param {Object} guild - Discord guild
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Join/leave stats
	 */
	static async getJoinLeaveAnalytics (serverDocument, guild, options = {}) {
		const { days = 30 } = options;
		const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		// Members who joined during period (from Discord API)
		const recentJoins = [];
		for (const [memberId, member] of guild.members.cache) {
			if (member.joinedAt && member.joinedAt > cutoffDate) {
				recentJoins.push({
					id: memberId,
					username: member.user.username,
					joinedAt: member.joinedAt,
					accountAge: Math.floor((Date.now() - member.user.createdAt) / (24 * 60 * 60 * 1000)),
				});
			}
		}

		// Sort by join date (newest first)
		recentJoins.sort((a, b) => b.joinedAt - a.joinedAt);

		// Calculate daily join counts
		const dailyJoins = {};
		for (let i = 0; i < days; i++) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split("T")[0];
			dailyJoins[dateKey] = 0;
		}

		recentJoins.forEach(j => {
			const dateKey = j.joinedAt.toISOString().split("T")[0];
			if (dailyJoins[dateKey] !== undefined) {
				dailyJoins[dateKey]++;
			}
		});

		// Account age distribution
		const accountAgeDistribution = {
			new: recentJoins.filter(j => j.accountAge < 7).length, // < 1 week
			recent: recentJoins.filter(j => j.accountAge >= 7 && j.accountAge < 30).length, // 1 week - 1 month
			established: recentJoins.filter(j => j.accountAge >= 30 && j.accountAge < 180).length, // 1-6 months
			veteran: recentJoins.filter(j => j.accountAge >= 180).length, // 6+ months
		};

		// Growth rate calculation
		const totalJoins = recentJoins.length;
		const avgDailyJoins = days > 0 ? (totalJoins / days).toFixed(2) : 0;

		return {
			overview: {
				periodDays: days,
				totalJoins,
				avgDailyJoins: parseFloat(avgDailyJoins),
				currentMembers: guild.memberCount,
			},
			recentJoins: recentJoins.slice(0, 25),
			dailyJoins,
			accountAgeDistribution,
			// Note: Leave tracking requires event logging which we may not have
			leaves: {
				note: "Leave tracking requires modlog events to be enabled",
			},
		};
	}

	/**
	 * Get command usage statistics
	 * @param {Object} serverDocument - Server document
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Command usage stats
	 */
	static async getCommandStats (serverDocument, options = {}) {
		const { limit = 25 } = options;
		const commandUsage = serverDocument.command_usage || {};

		// Convert to array and sort
		const commands = Object.entries(commandUsage)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		const totalUsage = commands.reduce((sum, c) => sum + c.count, 0);

		// Top commands with percentage
		const topCommands = commands.slice(0, limit).map(c => ({
			...c,
			percentage: totalUsage > 0 ? Math.round((c.count / totalUsage) * 100) : 0,
		}));

		// Category distribution (if we can determine categories)
		const categoryUsage = {};
		// Note: Would need command metadata to properly categorize

		return {
			overview: {
				totalCommands: commands.length,
				totalUsage,
				avgUsagePerCommand: commands.length > 0 ?
					Math.round(totalUsage / commands.length) :
					0,
			},
			topCommands,
			allCommands: commands,
			categoryUsage,
		};
	}

	/**
	 * Generate activity heatmap data
	 * @param {Object} serverDocument - Server document
	 * @param {Object} analyticsData - Historical analytics data
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Heatmap data
	 */
	static async getActivityHeatmap (serverDocument, analyticsData = []) {
		// Initialize 7x24 grid (days x hours)
		const heatmap = [];
		for (let day = 0; day < 7; day++) {
			heatmap[day] = new Array(24).fill(0);
		}

		// If we have historical hourly data, use it
		if (analyticsData.length > 0) {
			analyticsData.forEach(dayData => {
				const dayOfWeek = new Date(dayData.date).getDay();
				(dayData.hourly_activity || []).forEach(h => {
					heatmap[dayOfWeek][h.hour] += h.message_count || 0;
				});
			});
		}

		// Find peak times
		let peakHour = 0;
		let peakDay = 0;
		let maxActivity = 0;

		for (let day = 0; day < 7; day++) {
			for (let hour = 0; hour < 24; hour++) {
				if (heatmap[day][hour] > maxActivity) {
					maxActivity = heatmap[day][hour];
					peakHour = hour;
					peakDay = day;
				}
			}
		}

		// Day names
		const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

		// Calculate totals per day
		const dailyTotals = heatmap.map((dayData, index) => ({
			day: dayNames[index],
			total: dayData.reduce((sum, h) => sum + h, 0),
		}));

		// Calculate totals per hour
		const hourlyTotals = [];
		for (let hour = 0; hour < 24; hour++) {
			let total = 0;
			for (let day = 0; day < 7; day++) {
				total += heatmap[day][hour];
			}
			hourlyTotals.push({ hour, total });
		}

		return {
			heatmap,
			peak: {
				day: dayNames[peakDay],
				hour: peakHour,
				activity: maxActivity,
			},
			dailyTotals,
			hourlyTotals,
			dayNames,
		};
	}

	/**
	 * Check if server has analytics access
	 * @param {string} serverId - Server ID
	 * @returns {Promise<boolean>}
	 */
	static async hasAccess (serverId) {
		return TierManager.hasMinimumTierLevel(serverId, 2);
	}
}

module.exports = AnalyticsCollector;
