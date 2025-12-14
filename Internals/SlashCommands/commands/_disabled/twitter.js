const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("twitter")
		.setDescription("Get a link to a Twitter/X profile")
		.addStringOption(opt =>
			opt.setName("username")
				.setDescription("Twitter username")
				.setRequired(true),
		),

	async execute (interaction) {
		const username = interaction.options.getString("username").replace(/^@/, "");

		return interaction.reply({
			embeds: [{
				color: 0x1DA1F2,
				title: `🐦 @${username}`,
				description: `[View profile on Twitter/X](https://twitter.com/${username})`,
			}],
		});
	},
};
