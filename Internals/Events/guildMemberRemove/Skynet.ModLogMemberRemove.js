const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogMemberRemove extends BaseEvent {
	requirements (member) {
		return member && member.guild && !member.user.bot;
	}

	async handle (member) {
		try {
			await ModLog.create(member.guild, "Member Left", member.user, this.client.user, `User left the server`);
		} catch (err) {
			logger.debug("Failed to log member leave to modlog", { svrid: member.guild.id, usrid: member.user.id }, err);
		}
	}
}

module.exports = ModLogMemberRemove;
