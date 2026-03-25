const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");
const { ChannelType } = require("discord.js");

class ModLogChannelCreate extends BaseEvent {
	requirements (channel) {
		return channel && channel.guild;
	}

	async handle (channel) {
		try {
			const typeMap = {
				[ChannelType.GuildText]: "Text",
				[ChannelType.GuildVoice]: "Voice",
				[ChannelType.GuildCategory]: "Category",
				[ChannelType.GuildNews]: "News",
				[ChannelType.GuildStageVoice]: "Stage",
				[ChannelType.GuildForum]: "Forum",
			};
			const type = typeMap[channel.type] || "Unknown";
			const reason = `Channel created: ${type} channel`;
			await ModLog.create(channel.guild, "Channel Created", null, this.client.user, reason);
		} catch (err) {
			logger.debug("Failed to log channel creation to modlog", { svrid: channel.guild.id, chid: channel.id }, err);
		}
	}
}

module.exports = ModLogChannelCreate;
