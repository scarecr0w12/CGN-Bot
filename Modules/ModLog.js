/**
 * An object representing the raw data of a ModLog entry
 * @typedef {{ type: string, affected_user: SkynetGuildMember, creator: SkynetGuildMember, reason: string, message_id: string }} ModLogEntryData
 */

const { Error } = require("../Internals/Errors/");
const { Colors } = require("../Internals/Constants");
const { GuildMember, ChannelType } = require("discord.js");

module.exports = class ModLog {
	constructor () {
		throw new Error("STATIC_CLASS", {}, this.constructor.name);
	}

	/**
	 * Format a User for use in a ModLog entry's message
	 * @param {User} user
	 * @returns {string}
	 */
	static getUserText (user) {
		return `${user.tag} <${user.id}>`;
	}

	/**
	 * Get a ModLog Entry's message
	 * @param {number} modlogID
	 * @param {string} type
	 * @param {string} affectedUserString
	 * @param {string} creatorString
	 * @param {string} reason
	 * @returns {string}
	 */
	static getEntryText (modlogID, type, affectedUserString = null, creatorString = null, reason = null) {
		const info = [
			`🔨 **Case ${modlogID}:** ${type}`,
		];
		affectedUserString && info.push(`👤 **User:** ${affectedUserString}`);
		creatorString && info.push(`🐬 **${affectedUserString ? "Moderator" : "Creator"}:** ${creatorString}`);
		reason && info.push(`❓ **Reason:** ${reason}`);

		return info.join("\n");
	}

	/**
	 * Map action types to event settings
	 * @param {string} type - The modlog entry type
	 * @returns {string|null} The event setting key, or null if always logged
	 */
	static getEventSettingKey (type) {
		const mapping = {
			Strike: "strikes",
			"Strike Removed": "strikes",
			"Strikes Cleared": "strikes",
			Kick: "kicks",
			Ban: "bans",
			"Temp Ban": "bans",
			Unban: "bans",
			Softban: "bans",
			Mute: "mutes",
			"Temp Mute": "mutes",
			Unmute: "mutes",
			"Filter Violation": "filter_violations",
			"Spam Detected": "filter_violations",
			"Raid Detected": "raid_alerts",
			"Kick (Alt Detection)": "alt_detection",
			"Ban (Alt Detection)": "alt_detection",
			Quarantine: "alt_detection",
			"Message Deleted": "message_deleted",
			"Message Edited": "message_edited",
			"Member Joined": "member_joined",
			"Member Left": "member_left",
			"Role Created": "role_created",
			"Role Deleted": "role_deleted",
			"Role Modified": "role_modified",
			"Channel Created": "channel_created",
			"Channel Deleted": "channel_deleted",
			"Channel Modified": "channel_modified",
			"Bulk Delete": "bulk_delete",
		};
		return mapping[type] || null;
	}

	/**
	 * Get severity level for an action type
	 * @param {string} type - The modlog entry type
	 * @returns {string} Severity level: low, medium, high, or critical
	 */
	static getSeverityLevel (type) {
		const severityMap = {
			Ban: "critical",
			"Temp Ban": "high",
			Softban: "high",
			Kick: "high",
			Mute: "high",
			"Temp Mute": "medium",
			Strike: "medium",
			"Raid Detected": "critical",
			"Kick (Alt Detection)": "high",
			"Ban (Alt Detection)": "critical",
			Quarantine: "high",
			"Filter Violation": "medium",
			"Spam Detected": "medium",
			"Channel Deleted": "high",
			"Role Deleted": "high",
			"Bulk Delete": "high",
		};
		return severityMap[type] || "low";
	}

	static async create (guild, type, member, creator, reason = null) {
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument) {
			return new Error("MISSING_MODLOG_CHANNEL");
		}
		const serverQueryDocument = serverDocument.query;
		if (serverDocument && serverDocument.modlog.isEnabled && serverDocument.modlog.channel_id) {
			// Check if this event type is enabled
			const eventKey = ModLog.getEventSettingKey(type);
			const modlogEvents = serverDocument.modlog.events || {};
			if (eventKey && modlogEvents[eventKey] === false) {
				// Event type is disabled, don't log
				return null;
			}
			const ch = guild.channels.cache.get(serverDocument.modlog.channel_id);
			if (ch && ch.type === ChannelType.GuildText) {
				let affectedUser;
				if (member) {
					affectedUser = ModLog.getUserText(member instanceof GuildMember ? member.user : member);
				}
				const creatorStr = creator ? ModLog.getUserText(creator instanceof GuildMember ? creator.user : creator) : "System";
				serverQueryDocument.inc("modlog.current_id");
				const description = ModLog.getEntryText(serverDocument.modlog.current_id, type, affectedUser, creatorStr, reason);
				const m = await ch.send({
					embeds: [{
						description,
						color: Colors.INFO,
						footer: {
							text: `${member ? `Use "${guild.commandPrefix}reason ${serverDocument.modlog.current_id} <reason>" to change the reason. | ` : ""}Entry created`,
						},
						timestamp: new Date,
					}],
				}).catch(() => null);
				if (m) {
					serverQueryDocument.push("modlog.entries", {
						_id: serverDocument.modlog.current_id,
						type,
						affected_user: affectedUser,
						creator: creatorStr,
						message_id: m.id,
						reason,
						canEdit: !!member,
					});
					return serverDocument.save().then(() => serverDocument.modlog.current_id);
				}
			} else {
				return new Error("INVALID_MODLOG_CHANNEL", {}, ch);
			}
		} else {
			return new Error("MISSING_MODLOG_CHANNEL");
		}
	}

	/**
	 * Update an existing ModLog Entry
	 * @param {Guild} guild
	 * @param {number} id
	 * @param {ModLogEntryData} data
	 * @returns {Promise<number|SkynetError>} The numeric ID of the ModLog Entry updated, or an error if an expected exception occurred
	 */
	static async update (guild, id, data) {
		const serverDocument = await Servers.findOne(guild.id);
		if (serverDocument.modlog.isEnabled && serverDocument.modlog.channel_id) {
			const modlogEntryQueryDocument = serverDocument.query.id("modlog.entries", parseInt(id));
			const modlogEntryDocument = modlogEntryQueryDocument.val;
			if (modlogEntryDocument) {
				const oldReason = modlogEntryDocument.reason;
				if (data.creator) modlogEntryQueryDocument.set("creator", ModLog.getUserText(data.creator.user));
				if (data.reason) {
					modlogEntryQueryDocument.set("reason", data.reason);
					// Track edit history
					const editEntry = {
						edited_at: new Date(),
						edited_by: data.creator ? ModLog.getUserText(data.creator.user) : "System",
						old_reason: oldReason,
						new_reason: data.reason,
					};
					modlogEntryQueryDocument.push("edit_history", editEntry);
				}
				const channel = guild.channels.cache.get(serverDocument.modlog.channel_id);

				if (channel && channel.type === ChannelType.GuildText) {
					const message = await channel.messages.fetch(modlogEntryDocument.message_id).catch();
					if (message) {
						await message.edit({
							embeds: [{
								description: ModLog.getEntryText(modlogEntryDocument._id, modlogEntryDocument.type, modlogEntryDocument.affected_user, modlogEntryDocument.creator, modlogEntryDocument.reason),
								color: Colors.INFO,
								footer: {
									text: `Use "/modlog reason ${serverDocument.modlog.current_id} <reason>" to change the reason. | Entry created`,
								},
								timestamp: message.embeds[0].timestamp,
							}],
						});
						await serverDocument.save();
						return modlogEntryDocument._id;
					}
				} else {
					return new Error("INVALID_MODLOG_CHANNEL", {}, channel);
				}
			} else {
				return new Error("MODLOG_ENTRY_NOT_FOUND", {}, id);
			}
		} else {
			return new Error("MISSING_MODLOG_CHANNEL");
		}
	}

	/**
	 * Search modlog entries by various criteria
	 * @param {Guild} guild
	 * @param {Object} filters - Search filters
	 * @param {string} filters.userId - Filter by affected user ID
	 * @param {string} filters.type - Filter by entry type
	 * @param {string} filters.creator - Filter by creator ID
	 * @param {Date} filters.startDate - Filter entries after this date
	 * @param {Date} filters.endDate - Filter entries before this date
	 * @param {string} filters.severity - Filter by severity level
	 * @param {number} filters.limit - Maximum results (default 50)
	 * @returns {Promise<Array>} Filtered entries
	 */
	static async search (guild, filters = {}) {
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument || !serverDocument.modlog.isEnabled) {
			return [];
		}

		let results = serverDocument.modlog.entries || [];

		if (filters.userId) {
			results = results.filter(e => e.affected_user && e.affected_user.includes(filters.userId));
		}

		if (filters.type) {
			results = results.filter(e => e.type === filters.type);
		}

		if (filters.creator) {
			results = results.filter(e => e.creator && e.creator.includes(filters.creator));
		}

		if (filters.startDate) {
			results = results.filter(e => e.timestamp >= filters.startDate);
		}

		if (filters.endDate) {
			results = results.filter(e => e.timestamp <= filters.endDate);
		}

		if (filters.severity) {
			results = results.filter(e => e.severity === filters.severity);
		}

		const limit = filters.limit || 50;
		return results.slice(-limit).reverse();
	}

	/**
	 * Get modlog statistics
	 * @param {Guild} guild
	 * @returns {Promise<Object>} Statistics object
	 */
	static async getStats (guild) {
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument || !serverDocument.modlog.isEnabled) {
			return null;
		}

		const entries = serverDocument.modlog.entries || [];
		const stats = {
			total_entries: entries.length,
			by_type: {},
			by_severity: { low: 0, medium: 0, high: 0, critical: 0 },
			by_creator: {},
			last_entry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
		};

		entries.forEach(entry => {
			stats.by_type[entry.type] = (stats.by_type[entry.type] || 0) + 1;
			stats.by_severity[entry.severity || "medium"]++;
			if (entry.creator) {
				stats.by_creator[entry.creator] = (stats.by_creator[entry.creator] || 0) + 1;
			}
		});

		return stats;
	}

	/**
	 * Export modlog entries to JSON
	 * @param {Guild} guild
	 * @param {Object} filters - Optional filters (same as search)
	 * @returns {Promise<Object>} JSON export object
	 */
	static async exportJSON (guild, filters = {}) {
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument || !serverDocument.modlog.isEnabled) {
			return null;
		}

		const entries = await ModLog.search(guild, { ...filters, limit: 10000 });
		return {
			server_id: guild.id,
			server_name: guild.name,
			exported_at: new Date().toISOString(),
			total_entries: entries.length,
			entries: entries,
		};
	}

	/**
	 * Export modlog entries to CSV
	 * @param {Guild} guild
	 * @param {Object} filters - Optional filters (same as search)
	 * @returns {Promise<string>} CSV formatted string
	 */
	static async exportCSV (guild, filters = {}) {
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument || !serverDocument.modlog.isEnabled) {
			return null;
		}

		const entries = await ModLog.search(guild, { ...filters, limit: 10000 });
		const headers = ["Case ID", "Timestamp", "Type", "Affected User", "Creator", "Reason", "Severity"];
		const rows = entries.map(e => [
			e._id,
			e.timestamp.toISOString(),
			e.type,
			e.affected_user || "N/A",
			e.creator || "N/A",
			(e.reason || "").replace(/"/g, '""'),
			e.severity || "medium",
		]);

		const csv = [
			headers.map(h => `"${h}"`).join(","),
			...rows.map(r => r.map(v => `"${v}"`).join(",")),
		].join("\n");

		return csv;
	}

	/**
	 * Clean up old modlog entries based on retention policy
	 * @param {Guild} guild
	 * @returns {Promise<number>} Number of entries deleted
	 */
	static async cleanup (guild) {
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument || !serverDocument.modlog.isEnabled) {
			return 0;
		}

		const retentionDays = serverDocument.modlog.retention_days || 90;
		const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

		const entries = serverDocument.modlog.entries || [];
		const originalLength = entries.length;

		serverDocument.query.set("modlog.entries", entries.filter(e => e.timestamp > cutoffDate));
		await serverDocument.save();

		return originalLength - serverDocument.modlog.entries.length;
	}

	static async delete (guild, id) {
		const serverDocument = await Servers.findOne(guild.id);
		if (serverDocument.modlog.isEnabled && serverDocument.modlog.channel_id) {
			const modlogEntryQueryDocument = serverDocument.query.id("modlog.entries", parseInt(id));
			const modlogEntryDocument = modlogEntryQueryDocument.val;
			if (modlogEntryDocument) {
				const channel = guild.channels.cache.get(serverDocument.modlog.channel_id);
				if (channel && channel.type === ChannelType.GuildText) {
					const message = await channel.messages.fetch(modlogEntryDocument.message_id).catch();
					if (message) message.delete().catch();
					modlogEntryQueryDocument.remove();
					await serverDocument.save();
					return id;
				} else {
					return new Error("INVALID_MODLOG_CHANNEL", {}, channel);
				}
			} else {
				return new Error("MODLOG_ENTRY_NOT_FOUND", {}, id);
			}
		} else {
			return new Error("MISSING_MODLOG_CHANNEL");
		}
	}

	/**
	 * Enables ModLog features in a guild and channel
	 * @param {SkynetGuild} guild
	 * @param {Channel} channel
	 * @returns {Promise<Snowflake|SkynetError|null>} The Snowflake ID of the channel modlog has been enabled in, if successful. If an expected error occurred, this will return a SkynetError object
	 */
	static async enable (guild, channel) {
		if (!guild) return null;
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument) return null;
		if (channel && channel.type === ChannelType.GuildText) {
			serverDocument.query.set("modlog.isEnabled", true);
			serverDocument.query.set("modlog.channel_id", channel.id);
			await serverDocument.save();
			return channel.id;
		} else {
			return new Error("INVALID_MODLOG_CHANNEL", {}, channel);
		}
	}

	/**
	 * Disables ModLog featuers in a guild
	 * @param {SkynetGuild} guild
	 * @returns {Promise<string|null>} The String ID of the channel modlog was enabled in, if successful.
	 */
	static async disable (guild) {
		if (!guild) return null;
		const serverDocument = await Servers.findOne(guild.id);
		if (!serverDocument) return null;
		const oldChannelID = serverDocument.modlog.channel_id;
		serverDocument.query.set("modlog.isEnabled", false);
		serverDocument.query.set("modlog.channel_id", null);
		await serverDocument.save();
		return oldChannelID;
	}
};
