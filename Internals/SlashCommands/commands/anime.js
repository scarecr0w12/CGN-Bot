const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("anime")
		.setDescription("Search for anime on Kitsu.io")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("The anime to search for")
				.setRequired(true),
		)
		.addIntegerOption(opt =>
			opt.setName("limit")
				.setDescription("Number of results (1-5)")
				.setMinValue(1)
				.setMaxValue(5)
				.setRequired(false),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");
		const limit = interaction.options.getInteger("limit") || 1;

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}`,
			);
			const data = await response.json();

			if (!data.data || data.data.length === 0) {
				return interaction.editReply("No anime found with that query! 🔍");
			}

			const embeds = data.data.slice(0, limit).map(anime => {
				const attr = anime.attributes;
				return {
					color: 0x3669FA,
					title: attr.titles.en || attr.titles.en_jp || attr.canonicalTitle,
					url: `https://kitsu.io/anime/${anime.id}`,
					thumbnail: { url: attr.posterImage && attr.posterImage.medium ? attr.posterImage.medium : "" },
					description: attr.synopsis ? (attr.synopsis.substring(0, 300) + (attr.synopsis.length > 300 ? "..." : "")) : "No synopsis available",
					fields: [
						{ name: "Type", value: attr.subtype || "Unknown", inline: true },
						{ name: "Episodes", value: `${attr.episodeCount || "?"}`, inline: true },
						{ name: "Status", value: attr.status || "Unknown", inline: true },
						{ name: "Rating", value: attr.averageRating ? `${attr.averageRating}/100` : "N/A", inline: true },
					],
				};
			});

			return interaction.editReply({ embeds });
		} catch (err) {
			return interaction.editReply("Failed to search for anime! Please try again later.");
		}
	},
};
