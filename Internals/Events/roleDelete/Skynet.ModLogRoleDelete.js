const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogRoleDelete extends BaseEvent {
	requirements (role) {
		return role && role.guild;
	}

	async handle (role) {
		try {
			const reason = `Role deleted: ${role.name}`;
			await ModLog.create(role.guild, "Role Deleted", null, this.client.user, reason);
		} catch (err) {
			logger.debug("Failed to log role deletion to modlog", { svrid: role.guild.id, roleid: role.id }, err);
		}
	}
}

module.exports = ModLogRoleDelete;
