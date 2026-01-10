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
		};
		return mapping[type] || null;
	}

	static async create (guild, type, member, creator, reason = null) {
		const serverDocument = await Servers.findOne(guild.id);
		const serverQueryDocument = serverDocument.query;
		if (serverDocument && serverDocument.modlog.isEnabled && serverDocument.modlog.channel_id) {
			// Check if this event type is enabled
			const eventKey = ModLog.getEventSettingKey(type);
			if (eventKey && !serverDocument.modlog.events[eventKey]) {
				// Event type is disabled, don't log
				return null;
			}
			const ch = guild.channels.cache.get(serverDocument.modlog.channel_id);
			if (ch && ch.type === ChannelType.GuildText) {
				let affectedUser;
				if (member) {
					affectedUser = ModLog.getUserText(member instanceof GuildMember ? member.user : member);
				}
				let creatorStr;
				if (creator) {
					creatorStr = ModLog.getUserText(creator instanceof GuildMember ? creator.user : creator);
				}
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
				if (data.creator) modlogEntryQueryDocument.set("creator", ModLog.getUserText(data.creator.user));
				if (data.reason) modlogEntryQueryDocument.set("reason", data.reason);
				const channel = guild.channels.cache.get(serverDocument.modlog.channel_id);

				if (channel && channel.type === ChannelType.GuildText) {
					const message = await channel.messages.fetch(modlogEntryDocument.message_id).catch();
					if (message) {
						await message.edit({
							embeds: [{
								description: ModLog.getEntryText(modlogEntryDocument._id, modlogEntryDocument.type, modlogEntryDocument.affected_user, modlogEntryDocument.creator, modlogEntryDocument.reason),
								color: Colors.INFO,
								footer: {
									text: `Use "${guild.commandPrefix}reason ${serverDocument.modlog.current_id} <reason>" to change the reason. | Entry created`,
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
