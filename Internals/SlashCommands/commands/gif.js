const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("gif")
		.setDescription("Search for a GIF on Giphy")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("What to search for")
				.setRequired(true),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");
		const apiKey = process.env.GIPHY_API_KEY;

		if (!apiKey) {
			return interaction.reply({
				content: "GIF search is not configured!",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=1&rating=pg-13`,
			);
			const data = await response.json();

			if (!data.data || data.data.length === 0) {
				return interaction.editReply("No GIFs found! 🔍");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: `GIF: ${query}`,
					image: { url: data.data[0].images.original.url },
					footer: { text: "Powered by Giphy" },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to search for GIFs!");
		}
	},
};
