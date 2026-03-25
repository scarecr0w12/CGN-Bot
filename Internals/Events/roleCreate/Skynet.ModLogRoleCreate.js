const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogRoleCreate extends BaseEvent {
	requirements (role) {
		return role && role.guild;
	}

	async handle (role) {
		try {
			const reason = `Role created with color #${role.color.toString(16).padStart(6, "0")}`;
			await ModLog.create(role.guild, "Role Created", null, this.client.user, reason);
		} catch (err) {
			logger.debug("Failed to log role creation to modlog", { svrid: role.guild.id, roleid: role.id }, err);
		}
	}
}

module.exports = ModLogRoleCreate;
