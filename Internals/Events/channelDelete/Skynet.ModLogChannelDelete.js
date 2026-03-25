const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogChannelDelete extends BaseEvent {
	requirements (channel) {
		return channel && channel.guild;
	}

	async handle (channel) {
		try {
			const reason = `Channel deleted: ${channel.name}`;
			await ModLog.create(channel.guild, "Channel Deleted", null, this.client.user, reason);
		} catch (err) {
			logger.debug("Failed to log channel deletion to modlog", { svrid: channel.guild.id, chid: channel.id }, err);
		}
	}
}

module.exports = ModLogChannelDelete;
