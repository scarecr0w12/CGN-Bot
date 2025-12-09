const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("imdb")
		.setDescription("Search for movies and TV shows on IMDB")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("Movie or TV show to search for")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("type")
				.setDescription("Type of content")
				.setRequired(false)
				.addChoices(
					{ name: "Movie", value: "movie" },
					{ name: "TV Series", value: "series" },
					{ name: "Episode", value: "episode" },
				),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");
		const type = interaction.options.getString("type");
		const apiKey = process.env.OMDB_API_KEY;

		if (!apiKey) {
			return interaction.reply({
				content: "IMDB search is not configured!",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			let url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(query)}`;
			if (type) url += `&type=${type}`;

			const response = await fetch(url);
			const data = await response.json();

			if (data.Error) {
				return interaction.editReply(`Could not find: ${data.Error}`);
			}

			return interaction.editReply({
				embeds: [{
					color: 0xF5C518,
					title: `${data.Title} (${data.Year})`,
					url: `https://www.imdb.com/title/${data.imdbID}`,
					thumbnail: data.Poster !== "N/A" ? { url: data.Poster } : null,
					description: data.Plot,
					fields: [
						{ name: "Type", value: data.Type, inline: true },
						{ name: "Genre", value: data.Genre, inline: true },
						{ name: "Rating", value: data.imdbRating !== "N/A" ? `⭐ ${data.imdbRating}/10` : "N/A", inline: true },
						{ name: "Runtime", value: data.Runtime, inline: true },
						{ name: "Director", value: data.Director || "N/A", inline: true },
						{ name: "Actors", value: data.Actors || "N/A", inline: false },
					],
					footer: { text: "Source: OMDB/IMDB" },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to search IMDB!");
		}
	},
};
