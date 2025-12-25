/**
 * Role Command - Manage roles and role assignments
 */
module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	const { serverDocument } = documents;
	const suffix = msg.suffix ? msg.suffix.trim() : "";

	if (!suffix) {
		// List joinable roles
		const customRoles = serverDocument.config.custom_roles || [];
		const joinableRoles = customRoles.filter(r => r.isJoinable);

		if (joinableRoles.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "Server Roles",
					description: "There are no joinable roles configured for this server.\nAdmins can configure joinable roles in the dashboard.",
				}],
			});
		}

		const roleList = joinableRoles.map(r => {
			const role = msg.guild.roles.cache.get(r._id);
			return role ? `• ${role.name}` : null;
		}).filter(Boolean).join("\n");

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "Joinable Roles",
				description: roleList || "No roles available",
				footer: {
					text: `Use ${commandData.name} <role name> to join/leave a role`,
				},
			}],
		});
	}

	// Try to find and toggle the role
	const roleName = suffix.split("|")[0].trim().toLowerCase();
	const role = msg.guild.roles.cache.find(r => r.name.toLowerCase() === roleName);

	if (!role) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Could not find a role named "${roleName}".`,
			}],
		});
	}

	// Check if role is joinable
	const customRoles = serverDocument.config.custom_roles || [];
	const customRole = customRoles.find(r => r._id === role.id);

	if (!customRole || !customRole.isJoinable) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "That role is not joinable.",
			}],
		});
	}

	// Check bot permissions and role hierarchy
	const { PermissionFlagsBits } = require("discord.js");
	if (!msg.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "I need the **Manage Roles** permission to manage roles.",
			}],
		});
	}

	if (msg.guild.members.me.roles.highest.position <= role.position) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "I cannot manage this role. It's higher than or equal to my highest role.",
			}],
		});
	}

	try {
		if (msg.member.roles.cache.has(role.id)) {
			await msg.member.roles.remove(role);
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `You have left the **${role.name}** role.`,
				}],
			});
		} else {
			await msg.member.roles.add(role);
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `You have joined the **${role.name}** role.`,
				}],
			});
		}
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: "I don't have permission to manage that role.",
			}],
		});
	}
};
