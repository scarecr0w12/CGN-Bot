const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("google")
		.setDescription("Search Google")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("What to search for")
				.setRequired(true),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");
		const encodedQuery = encodeURIComponent(query);

		return interaction.reply({
			embeds: [{
				color: 0x4285F4,
				title: `🔍 Google: ${query}`,
				description: `[Click here to search](https://www.google.com/search?q=${encodedQuery})`,
				footer: { text: "Google Search" },
			}],
		});
	},
};
