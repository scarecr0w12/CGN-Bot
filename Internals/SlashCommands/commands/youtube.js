const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("youtube")
		.setDescription("Search YouTube")
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
				color: 0xFF0000,
				title: `🎬 YouTube: ${query}`,
				description: `[Click here to search YouTube](https://www.youtube.com/results?search_query=${encodedQuery})`,
				footer: { text: "YouTube Search" },
			}],
		});
	},
};
