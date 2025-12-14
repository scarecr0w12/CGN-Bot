/**
 * AnalyticsExporter - Exports analytics data to various formats
 *
 * Supports CSV and JSON export for:
 * - Member activity data
 * - Channel statistics
 * - Command usage
 * - Role engagement
 */

class AnalyticsExporter {
	/**
	 * Export data to CSV format
	 * @param {Array} data - Array of objects to export
	 * @param {Array} columns - Column definitions [{key, label}]
	 * @returns {string} CSV formatted string
	 */
	static toCSV (data, columns) {
		if (!data || data.length === 0) {
			return columns.map(c => c.label).join(",");
		}

		// Header row
		const header = columns.map(c => `"${c.label}"`).join(",");

		// Data rows
		const rows = data.map(item => columns.map(col => {
			let value = item[col.key];
			if (value === undefined || value === null) value = "";
			if (typeof value === "string") {
				// Escape quotes and wrap in quotes
				value = `"${value.replace(/"/g, '""')}"`;
			} else if (value instanceof Date) {
				value = `"${value.toISOString()}"`;
			}
			return value;
		}).join(","));

		return [header, ...rows].join("\n");
	}

	/**
	 * Export member activity to CSV
	 * @param {Object} memberData - Member activity data from collector
	 * @returns {string} CSV string
	 */
	static exportMemberActivity (memberData) {
		const columns = [
			{ key: "id", label: "Member ID" },
			{ key: "messages", label: "Messages" },
			{ key: "voice", label: "Voice Minutes" },
			{ key: "rank", label: "Rank" },
			{ key: "lastActive", label: "Last Active" },
		];

		return this.toCSV(memberData.topByMessages || [], columns);
	}

	/**
	 * Export channel activity to CSV
	 * @param {Object} channelData - Channel activity data from collector
	 * @returns {string} CSV string
	 */
	static exportChannelActivity (channelData) {
		const columns = [
			{ key: "id", label: "Channel ID" },
			{ key: "name", label: "Channel Name" },
			{ key: "messages", label: "Messages" },
			{ key: "percentage", label: "Percentage" },
		];

		return this.toCSV(channelData.topChannels || [], columns);
	}

	/**
	 * Export command stats to CSV
	 * @param {Object} commandData - Command stats from collector
	 * @returns {string} CSV string
	 */
	static exportCommandStats (commandData) {
		const columns = [
			{ key: "name", label: "Command" },
			{ key: "count", label: "Usage Count" },
			{ key: "percentage", label: "Percentage" },
		];

		return this.toCSV(commandData.topCommands || [], columns);
	}

	/**
	 * Export role engagement to CSV
	 * @param {Object} roleData - Role engagement data from collector
	 * @returns {string} CSV string
	 */
	static exportRoleEngagement (roleData) {
		const columns = [
			{ key: "id", label: "Role ID" },
			{ key: "name", label: "Role Name" },
			{ key: "memberCount", label: "Members" },
			{ key: "activeMembers", label: "Active Members" },
			{ key: "engagementRate", label: "Engagement %" },
			{ key: "totalMessages", label: "Total Messages" },
		];

		return this.toCSV(roleData.allRoles || [], columns);
	}

	/**
	 * Export join/leave analytics to CSV
	 * @param {Object} joinLeaveData - Join/leave data from collector
	 * @returns {string} CSV string
	 */
	static exportJoinLeave (joinLeaveData) {
		const columns = [
			{ key: "id", label: "Member ID" },
			{ key: "username", label: "Username" },
			{ key: "joinedAt", label: "Joined At" },
			{ key: "accountAge", label: "Account Age (Days)" },
		];

		return this.toCSV(joinLeaveData.recentJoins || [], columns);
	}

	/**
	 * Generate comprehensive server analytics report
	 * @param {Object} allData - Object containing all analytics data
	 * @returns {Object} Report with multiple CSV exports
	 */
	static generateFullReport (allData) {
		return {
			memberActivity: this.exportMemberActivity(allData.memberActivity || {}),
			channelActivity: this.exportChannelActivity(allData.channelActivity || {}),
			commandStats: this.exportCommandStats(allData.commandStats || {}),
			roleEngagement: this.exportRoleEngagement(allData.roleEngagement || {}),
			joinLeave: this.exportJoinLeave(allData.joinLeave || {}),
			generatedAt: new Date().toISOString(),
		};
	}

	/**
	 * Export to JSON with metadata
	 * @param {Object} data - Analytics data
	 * @param {string} type - Type of analytics
	 * @returns {string} JSON string
	 */
	static toJSON (data, type) {
		return JSON.stringify({
			type,
			generatedAt: new Date().toISOString(),
			data,
		}, null, 2);
	}
}

module.exports = AnalyticsExporter;
