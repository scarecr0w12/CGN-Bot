const BaseEvent = require("../BaseEvent.js");

/**
 * Handle reaction-based role panels
 */
class RolePanelReaction extends BaseEvent {
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

		// Find role entry matching this emoji
		const roleEntry = panel.roles.find(r => {
			if (!r.emoji) return false;
			// Check both custom emoji format and unicode
			return r.emoji === emoji ||
				r.emoji === reaction.emoji.name ||
				r.emoji === reaction.emoji.id ||
				r.emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>` ||
				r.emoji === `<a:${reaction.emoji.name}:${reaction.emoji.id}>`;
		});

		if (!roleEntry) {
			// Remove non-configured reaction
			await reaction.users.remove(user.id).catch(() => null);
			return;
		}

		const guild = reaction.message.guild;
		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) return;

		const role = guild.roles.cache.get(roleEntry.role_id);
		if (!role) return;

		// Check require_role if set
		if (panel.require_role_id) {
			if (!member.roles.cache.has(panel.require_role_id)) {
				await reaction.users.remove(user.id).catch(() => null);
				return;
			}
		}

		try {
			const hasRole = member.roles.cache.has(roleEntry.role_id);

			if (hasRole) {
				// For reaction panels, we handle removal in messageReactionRemove
				// Here we just acknowledge if they already have it
				return;
			}

			// Handle unique mode - remove other roles first
			if (panel.mode === "unique") {
				const currentRoles = panel.roles
					.filter(r => member.roles.cache.has(r.role_id) && r.role_id !== roleEntry.role_id)
					.map(r => r.role_id);

				for (const rid of currentRoles) {
					const rToRemove = guild.roles.cache.get(rid);
					if (rToRemove) {
						await member.roles.remove(rToRemove, "Role panel unique mode").catch(() => null);
						// Also remove the reaction for the old role
						const oldEntry = panel.roles.find(r => r.role_id === rid);
						if (oldEntry?.emoji) {
							const reactions = reaction.message.reactions.cache;
							for (const [, r] of reactions) {
								const emojiMatch = oldEntry.emoji === r.emoji.name ||
									oldEntry.emoji === `<:${r.emoji.name}:${r.emoji.id}>`;
								if (emojiMatch) {
									await r.users.remove(user.id).catch(() => null);
								}
							}
						}
					}
				}
			}

			// Add role
			await member.roles.add(role, "Role panel reaction");

			logger.verbose(`Added role ${role.name} to ${user.tag} via reaction panel`, {
				svrid: guild.id,
				usrid: user.id,
			});
		} catch (err) {
			logger.warn("Failed to add role via reaction panel", { svrid: guild.id, usrid: user.id }, err);
		}
	}
}

module.exports = RolePanelReaction;
