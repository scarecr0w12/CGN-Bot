const moment = require("moment");
const PaginatedEmbed = require("../../Modules/MessageUtils/PaginatedEmbed");
const { PermissionsBitField, PermissionFlagsBits } = require("discord.js");

const rolesPerPage = 25;

module.exports = async ({ client, Constants: { Colors, Text }, Utils: { TitlecasePermissions } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		const guildRoles = [...msg.guild.roles.cache.values()].sort((a, b) => b.position - a.position);
		const descriptions = [];
		for (let i = 0; i < guildRoles.length; i += rolesPerPage) {
			const roleSegment = guildRoles.slice(i, i + rolesPerPage).join("\n");
			descriptions.push(`These are the roles on this server:\n\n${i ? `...${i} previous roles\n` : ""}${roleSegment}${i + rolesPerPage < guildRoles.length ? `\n...and ${guildRoles.length - i - rolesPerPage} more` : ""}`);
		}

		const memberRoles = [...msg.member.roles.cache.values()].sort((a, b) => b.position - a.position);
		const totalPermissionsBitfield = memberRoles.reduce((a, b) => a | b.permissions.bitfield, 0n); // eslint-disable-line no-bitwise
		const totalPermissions = new PermissionsBitField(totalPermissionsBitfield);
		for (let i = 0; i < memberRoles.length; i += rolesPerPage) {
			const roleSegment = memberRoles.slice(i, i + rolesPerPage).join("\n");
			descriptions.push([
				`You currently have these roles:\n\n${i ? `...${i} previous roles\n` : ""}${roleSegment}${i + rolesPerPage < memberRoles.length ? `\n...and ${memberRoles.length - i - rolesPerPage} more` : ""}`,
				"\nYour roles grant you get the following permissions:",
				totalPermissionsBitfield ? `\`\`\`${TitlecasePermissions(totalPermissions.toArray(false).join(", "))}\`\`\`` : "You do not have any permissions on this server ⁉️",
				totalPermissions.has(PermissionFlagsBits.Administrator, false) ? "⚠️ You have Administrator permissions which bypasses any other permission or override" : "",
			].join("\n"));
		}
		if (descriptions.length === 2 && descriptions[0].length + descriptions[1].length < 2048) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: `This guild has ${guildRoles.length} roles`,
					description: `${descriptions[0]}\n\n${descriptions[1]}`,
				}],
			});
		}

		await new PaginatedEmbed(msg, {
			color: Colors.INFO,
			title: `This guild has ${guildRoles.length} roles`,
			description: `{description}`,
			footer: `Page {currentPage} out of {totalPages}`,
		}, {
			descriptions,
		}).init();
	} else {
		let role;
		try {
			role = await client.roleSearch(msg.suffix, msg.guild);
		} catch (err) {
			if (err.code === "FAILED_TO_FIND") {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						title: "What's that role? 🏷️",
						description: "I do not know anything about a role with that name.",
						footer: {
							text: "You can find a list of all roles by running this command without any arguments.",
						},
					}],
				});
			}
			throw err;
		}
		const permissions = role.permissions.toArray(false).join(", ");
		const elements = [
			`🎨 Color: **${role.color ? role.hexColor.toUpperCase() : "None"}**`,
			`👥 Members: **${role.members.cache.size}**`,
			`#⃣ Position: **${msg.guild.roles.cache.size - role.position}**`,
			`🕒 Created: **${moment(role.createdTimestamp).fromNow()}**`,
		];
		if (role.mentionable) {
			elements.push("📢 Mentionable by everyone");
		}
		if (role.hoist) {
			elements.push("📌 Hoisted in member list");
		}
		if (role.managed) {
			elements.push("🤖 Managed by an integration");
		}
		elements.push(`✅ Permissions:${permissions.length ? `\n\`\`\`${TitlecasePermissions(permissions)}\`\`\`` : " This role does not grant any additional permissions"}`);
		if (role.permissions.has(PermissionFlagsBits.Administrator, false)) {
			elements.push("⚠️ This role grants Administrator permissions which bypasses any other permission or override");
		}
		return msg.send({
			embeds: [{
				title: `Information about role ${role.name} :: ${role.id}`,
				color: role.color || null,
				description: elements.join("\n"),
			}],
		});
	}
};
