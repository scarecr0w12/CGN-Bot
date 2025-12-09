const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("pokedex")
		.setDescription("Search the Pokédex")
		.addStringOption(opt =>
			opt.setName("pokemon")
				.setDescription("Pokémon name or number")
				.setRequired(true),
		),

	async execute (interaction) {
		const pokemon = interaction.options.getString("pokemon").toLowerCase();

		await interaction.deferReply();

		try {
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemon)}`);

			if (!response.ok) {
				return interaction.editReply("Pokémon not found!");
			}

			const data = await response.json();

			const speciesRes = await fetch(data.species.url);
			const speciesData = await speciesRes.json();

			const description = speciesData.flavor_text_entries
				.find(e => e.language.name === "en");

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
					footer: { text: "Data from PokéAPI" },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch Pokémon data!");
		}
	},
};
