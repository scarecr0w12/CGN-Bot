const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("appstore")
		.setDescription("Search the Apple App Store")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("App to search for")
				.setRequired(true),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=3`,
			);
			const data = await response.json();

			if (!data.results || data.results.length === 0) {
				return interaction.editReply("No apps found!");
			}

			const embeds = data.results.map(app => ({
				color: 0x0D96F6,
				title: app.trackName,
				url: app.trackViewUrl,
				thumbnail: { url: app.artworkUrl100 },
				description: app.description ? `${app.description.substring(0, 200)}...` : "No description",
				fields: [
					{ name: "Developer", value: app.sellerName || "Unknown", inline: true },
					{ name: "Price", value: app.formattedPrice || "Free", inline: true },
					{ name: "Rating", value: app.averageUserRating ? `${app.averageUserRating.toFixed(1)}/5` : "N/A", inline: true },
				],
			}));

			return interaction.editReply({ embeds });
		} catch (err) {
			return interaction.editReply("Failed to search App Store!");
		}
	},
};
