const BaseEvent = require("../BaseEvent.js");

/**
 * Handle reaction removal for role panels
 */
class RolePanelReactionRemove extends BaseEvent {
	async handle (reaction, user) {
		if (user.bot) return;
		if (!reaction.message.guild) return;

		// Fetch partial reaction/message if needed
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch {
				return;
			}
		}

		if (reaction.message.partial) {
			try {
				await reaction.message.fetch();
			} catch {
				return;
			}
		}

		const messageId = reaction.message.id;
		const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;

		// Find panel by message ID
		const panel = await global.RolePanels.findOne({
			message_id: messageId,
			type: "reaction",
		});

		if (!panel) return;

		// Verify mode doesn't allow removal
		if (panel.mode === "verify") return;

		// Find role entry matching this emoji
		const roleEntry = panel.roles.find(r => {
			if (!r.emoji) return false;
			return r.emoji === emoji ||
				r.emoji === reaction.emoji.name ||
				r.emoji === reaction.emoji.id ||
				r.emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>` ||
				r.emoji === `<a:${reaction.emoji.name}:${reaction.emoji.id}>`;
		});

		if (!roleEntry) return;

		const guild = reaction.message.guild;
		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) return;

		const role = guild.roles.cache.get(roleEntry.role_id);
		if (!role) return;

		try {
			const hasRole = member.roles.cache.has(roleEntry.role_id);

			if (!hasRole) return;

			// Remove role
			await member.roles.remove(role, "Role panel reaction removed");

			logger.verbose(`Removed role ${role.name} from ${user.tag} via reaction panel`, {
				svrid: guild.id,
				usrid: user.id,
			});
		} catch (err) {
			logger.warn("Failed to remove role via reaction panel", { svrid: guild.id, usrid: user.id }, err);
		}
	}
}

module.exports = RolePanelReactionRemove;
