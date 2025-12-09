const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("role")
		.setDescription("Manage roles")
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Add a role to a member")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("The user to add the role to")
						.setRequired(true),
				)
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("The role to add")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Remove a role from a member")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("The user to remove the role from")
						.setRequired(true),
				)
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("The role to remove")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("info")
				.setDescription("Get information about a role")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("The role to get info about")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		// Check admin level for add/remove
		if (["add", "remove"].includes(subcommand)) {
			const adminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, interaction.member);
			if (adminLevel < 1) {
				return interaction.reply({
					content: "You need to be an admin to manage roles!",
					ephemeral: true,
				});
			}
		}

		switch (subcommand) {
			case "add": {
				const user = interaction.options.getUser("user");
				const role = interaction.options.getRole("role");
				const member = await interaction.guild.members.fetch(user.id).catch(() => null);

				if (!member) {
					return interaction.reply({
						content: "Could not find that user!",
						ephemeral: true,
					});
				}

				try {
					await member.roles.add(role, `Added by @${interaction.user.tag}`);
					return interaction.reply({
						embeds: [{
							color: 0x00FF00,
							description: `Added ${role} to **@${user.tag}**`,
						}],
					});
				} catch (err) {
					return interaction.reply({
						content: `Failed to add role: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "remove": {
				const user = interaction.options.getUser("user");
				const role = interaction.options.getRole("role");
				const member = await interaction.guild.members.fetch(user.id).catch(() => null);

				if (!member) {
					return interaction.reply({
						content: "Could not find that user!",
						ephemeral: true,
					});
				}

				try {
					await member.roles.remove(role, `Removed by @${interaction.user.tag}`);
					return interaction.reply({
						embeds: [{
							color: 0x00FF00,
							description: `Removed ${role} from **@${user.tag}**`,
						}],
					});
				} catch (err) {
					return interaction.reply({
						content: `Failed to remove role: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "info": {
				const role = interaction.options.getRole("role");
				const memberCount = role.members.size;

				return interaction.reply({
					embeds: [{
						color: role.color || 0x3669FA,
						title: `Role: ${role.name}`,
						fields: [
							{ name: "ID", value: role.id, inline: true },
							{ name: "Color", value: role.hexColor, inline: true },
							{ name: "Members", value: `${memberCount}`, inline: true },
							{ name: "Position", value: `${role.position}`, inline: true },
							{ name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
							{ name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
							{ name: "Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
						],
					}],
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
