/**
 * Pokedex Command - Search Pokemon database
 */
const { fetch } = require("undici");

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Please provide a Pokemon name or number. Usage: \`${commandData.name} <pokemon>\``,
			}],
		});
	}

	const query = msg.suffix.toLowerCase().trim();

	try {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`);

		if (!response.ok) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Could not find a Pokemon named "${msg.suffix}".`,
				}],
			});
		}

		const pokemon = await response.json();

		// Get species data for description
		const speciesResponse = await fetch(pokemon.species.url);
		const species = await speciesResponse.json();

		const flavorEntry = species.flavor_text_entries.find(e => e.language.name === "en");
		const description = flavorEntry ? flavorEntry.flavor_text.replace(/[\n\f]/g, " ") : "No description available.";

		const types = pokemon.types.map(t => t.type.name).join(", ");
		const abilities = pokemon.abilities.map(a => a.ability.name).join(", ");
		const stats = pokemon.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join("\n");

		msg.send({
			embeds: [{
				color: Colors.INFO,
				title: `#${pokemon.id} ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`,
				thumbnail: {
					url: pokemon.sprites.front_default,
				},
				description: description,
				fields: [
					{
						name: "Type",
						value: types,
						inline: true,
					},
					{
						name: "Height / Weight",
						value: `${pokemon.height / 10}m / ${pokemon.weight / 10}kg`,
						inline: true,
					},
					{
						name: "Abilities",
						value: abilities,
						inline: false,
					},
					{
						name: "Base Stats",
						value: stats,
						inline: false,
					},
				],
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: `Failed to fetch Pokemon data: ${err.message}`,
			}],
		});
	}
};
