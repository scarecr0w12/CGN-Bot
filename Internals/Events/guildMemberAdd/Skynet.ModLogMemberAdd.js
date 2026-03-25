const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogMemberAdd extends BaseEvent {
	requirements (member) {
		return member && member.guild && !member.user.bot;
	}

	async handle (member) {
		try {
			await ModLog.create(member.guild, "Member Joined", member.user, this.client.user, `User joined the server`);
		} catch (err) {
			logger.debug("Failed to log member join to modlog", { svrid: member.guild.id, usrid: member.user.id }, err);
		}
	}
}

module.exports = ModLogMemberAdd;
