const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("image")
		.setDescription("Search for an image")
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
				color: 0x3669FA,
				title: `🖼️ Image Search: ${query}`,
				description: `[Click here to search Google Images](https://www.google.com/search?tbm=isch&q=${encodedQuery})`,
				footer: { text: "Google Image Search" },
			}],
		});
	},
};
