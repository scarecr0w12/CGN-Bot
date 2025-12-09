/**
 * IMDB Command - Search movies and TV shows
 */
const { fetch } = require("undici");

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Please provide a movie or TV show title. Usage: \`${commandData.name} <title>\``,
			}],
		});
	}

	const parts = msg.suffix.split(" ");
	let type = null;
	let query = msg.suffix;

	// Check for type prefix
	if (["movie", "series", "episode"].includes(parts[0].toLowerCase())) {
		type = parts[0].toLowerCase();
		query = parts.slice(1).join(" ");
	}

	// Check for OMDb API key
	const apiKey = configJSON.apis && configJSON.apis.omdb_api_key;

	if (!apiKey) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "IMDB search is not configured. Please set up an OMDb API key.",
			}],
		});
	}

	try {
		let url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(query)}`;
		if (type) url += `&type=${type}`;

		const response = await fetch(url);
		const data = await response.json();

		if (data.Response === "False") {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Could not find "${query}". ${data.Error || ""}`,
				}],
			});
		}

		const fields = [
			{ name: "Year", value: data.Year || "N/A", inline: true },
			{ name: "Rated", value: data.Rated || "N/A", inline: true },
			{ name: "Runtime", value: data.Runtime || "N/A", inline: true },
			{ name: "Genre", value: data.Genre || "N/A", inline: true },
			{ name: "Director", value: data.Director || "N/A", inline: true },
			{ name: "IMDB Rating", value: data.imdbRating ? `${data.imdbRating}/10` : "N/A", inline: true },
		];

		if (data.Actors && data.Actors !== "N/A") {
			fields.push({ name: "Actors", value: data.Actors, inline: false });
		}

		msg.send({
			embeds: [{
				color: Colors.INFO,
				title: data.Title,
				url: `https://www.imdb.com/title/${data.imdbID}`,
				description: data.Plot || "No plot available.",
				thumbnail: {
					url: data.Poster !== "N/A" ? data.Poster : null,
				},
				fields: fields,
				footer: {
					text: `Type: ${data.Type} | IMDB ID: ${data.imdbID}`,
				},
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: `Failed to search IMDB: ${err.message}`,
			}],
		});
	}
};
