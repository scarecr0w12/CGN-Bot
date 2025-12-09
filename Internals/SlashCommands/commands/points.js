const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("points")
		.setDescription("Check SkynetPoints balance")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to check (defaults to you)")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const user = interaction.options.getUser("user") || interaction.user;
		const memberDocument = serverDocument.members.id(user.id);

		if (!memberDocument) {
			return interaction.reply({
				content: "Could not find member data for that user!",
				ephemeral: true,
			});
		}

		const points = memberDocument.points || 0;
		const rank = serverDocument.members
			.filter(m => (m.points || 0) > points).length + 1;

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `⭐ ${user.tag}'s Points`,
				fields: [
					{ name: "Points", value: `${points}`, inline: true },
					{ name: "Rank", value: `#${rank}`, inline: true },
				],
				thumbnail: { url: user.displayAvatarURL() },
			}],
		});
	},
};
