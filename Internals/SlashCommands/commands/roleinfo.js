const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("roleinfo")
		.setDescription("Get information about a role")
		.addRoleOption(opt =>
			opt.setName("role")
				.setDescription("The role to get info about")
				.setRequired(true),
		),

	async execute (interaction) {
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
					{ name: "Managed", value: role.managed ? "Yes" : "No", inline: true },
					{ name: "Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
				],
			}],
		});
	},
};
