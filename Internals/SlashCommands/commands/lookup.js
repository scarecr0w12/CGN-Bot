const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("lookup")
		.setDescription("Look up information about anime, Pokémon, and more")
		.addStringOption(opt =>
			opt.setName("type")
				.setDescription("What to look up")
				.setRequired(true)
				.addChoices(
					{ name: "Anime", value: "anime" },
					{ name: "Pokémon", value: "pokemon" },
					{ name: "Manga", value: "manga" },
				),
		)
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("Name to search for")
				.setRequired(true),
		),

	async execute (interaction) {
		const type = interaction.options.getString("type");
		const query = interaction.options.getString("query");

		await interaction.deferReply();

		try {
			switch (type) {
				case "anime":
					return await handleAnime(interaction, query);
				case "pokemon":
					return await handlePokemon(interaction, query);
				case "manga":
					return await handleManga(interaction, query);
				default:
					return interaction.editReply("Invalid lookup type!");
			}
		} catch (err) {
			return interaction.editReply(`Failed to look up: ${err.message}`);
		}
	},
};

async function handleAnime (interaction, query) {
	const response = await fetch(
		`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=1`,
	);
	const data = await response.json();

	if (!data.data || data.data.length === 0) {
		return interaction.editReply("No anime found!");
	}

	const anime = data.data[0];
	const attr = anime.attributes;

	return interaction.editReply({
		embeds: [{
			color: 0x3669FA,
			title: attr.titles.en || attr.titles.en_jp || attr.canonicalTitle,
			url: `https://kitsu.io/anime/${anime.id}`,
			thumbnail: { url: attr.posterImage?.medium || "" },
			description: attr.synopsis ?
				attr.synopsis.substring(0, 300) + (attr.synopsis.length > 300 ? "..." : "") :
				"No synopsis available",
			fields: [
				{ name: "Type", value: attr.subtype || "Unknown", inline: true },
				{ name: "Episodes", value: `${attr.episodeCount || "?"}`, inline: true },
				{ name: "Status", value: attr.status || "Unknown", inline: true },
				{ name: "Rating", value: attr.averageRating ? `${attr.averageRating}/100` : "N/A", inline: true },
			],
			footer: { text: "Source: Kitsu.io" },
		}],
	});
}

async function handlePokemon (interaction, query) {
	const pokemon = query.toLowerCase();
	const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemon)}`);

	if (!response.ok) {
		return interaction.editReply("Pokémon not found!");
	}

	const data = await response.json();
	const speciesRes = await fetch(data.species.url);
	const speciesData = await speciesRes.json();

	const description = speciesData.flavor_text_entries.find(e => e.language.name === "en");
	const types = data.types.map(t => t.type.name).join(", ");
	const abilities = data.abilities.map(a => a.ability.name).join(", ");

	return interaction.editReply({
		embeds: [{
			color: 0xFFCB05,
			title: `#${data.id} ${data.name.charAt(0).toUpperCase() + data.name.slice(1)}`,
			thumbnail: { url: data.sprites.other["official-artwork"].front_default || data.sprites.front_default },
			description: description ? description.flavor_text.replace(/\f/g, " ") : "No description",
			fields: [
				{ name: "Types", value: types, inline: true },
				{ name: "Height", value: `${data.height / 10}m`, inline: true },
				{ name: "Weight", value: `${data.weight / 10}kg`, inline: true },
				{ name: "Abilities", value: abilities, inline: false },
				{
					name: "Base Stats",
					value: data.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(" | "),
					inline: false,
				},
			],
			footer: { text: "Source: PokéAPI" },
		}],
	});
}

async function handleManga (interaction, query) {
	const response = await fetch(
		`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(query)}&page[limit]=1`,
	);
	const data = await response.json();

	if (!data.data || data.data.length === 0) {
		return interaction.editReply("No manga found!");
	}

	const manga = data.data[0];
	const attr = manga.attributes;

	return interaction.editReply({
		embeds: [{
			color: 0xE91E63,
			title: attr.titles.en || attr.titles.en_jp || attr.canonicalTitle,
			url: `https://kitsu.io/manga/${manga.id}`,
			thumbnail: { url: attr.posterImage?.medium || "" },
			description: attr.synopsis ?
				attr.synopsis.substring(0, 300) + (attr.synopsis.length > 300 ? "..." : "") :
				"No synopsis available",
			fields: [
				{ name: "Type", value: attr.subtype || "Unknown", inline: true },
				{ name: "Chapters", value: `${attr.chapterCount || "?"}`, inline: true },
				{ name: "Status", value: attr.status || "Unknown", inline: true },
				{ name: "Rating", value: attr.averageRating ? `${attr.averageRating}/100` : "N/A", inline: true },
			],
			footer: { text: "Source: Kitsu.io" },
		}],
	});
}
