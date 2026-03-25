const BaseEvent = require("../BaseEvent.js");
const ModLog = require("../../../Modules/ModLog");

class ModLogRoleUpdate extends BaseEvent {
	requirements (oldRole, newRole) {
		return oldRole && newRole && oldRole.guild && newRole.guild;
	}

	async handle (oldRole, newRole) {
		const changes = [];

		if (oldRole.name !== newRole.name) {
			changes.push(`Name: ${oldRole.name} → ${newRole.name}`);
		}
		if (oldRole.color !== newRole.color) {
			changes.push(`Color: #${oldRole.color.toString(16).padStart(6, "0")} → #${newRole.color.toString(16).padStart(6, "0")}`);
		}
		if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
			changes.push(`Permissions modified`);
		}
		if (oldRole.hoist !== newRole.hoist) {
			changes.push(`Display separately: ${oldRole.hoist} → ${newRole.hoist}`);
		}
		if (oldRole.mentionable !== newRole.mentionable) {
			changes.push(`Mentionable: ${oldRole.mentionable} → ${newRole.mentionable}`);
		}

		if (changes.length === 0) return;

		try {
			const reason = `Role modified: ${changes.join(", ")}`;
			await ModLog.create(newRole.guild, "Role Modified", null, this.client.user, reason);
		} catch (err) {
			logger.debug("Failed to log role modification to modlog", { svrid: newRole.guild.id, roleid: newRole.id }, err);
		}
	}
}

module.exports = ModLogRoleUpdate;
