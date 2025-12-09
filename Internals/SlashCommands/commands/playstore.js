const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("playstore")
		.setDescription("Search the Google Play Store")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("App to search for")
				.setRequired(true),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");
		const encodedQuery = encodeURIComponent(query);

		return interaction.reply({
			embeds: [{
				color: 0x01875F,
				title: `📱 Google Play: ${query}`,
				description: `[Click here to search Google Play](https://play.google.com/store/search?q=${encodedQuery}&c=apps)`,
				footer: { text: "Google Play Store" },
			}],
		});
	},
};
