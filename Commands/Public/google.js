/**
 * Google Command - Search Google
 */
const { fetch } = require("undici");

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Please provide a search query. Usage: \`${commandData.name} <query>\``,
			}],
		});
	}

	const parts = msg.suffix.split(" ");
	let limit = 3;
	let query = msg.suffix;

	// Check if last part is a number (limit)
	const lastPart = parts[parts.length - 1];
	if (!isNaN(lastPart) && parseInt(lastPart) > 0) {
		limit = Math.min(parseInt(lastPart), 5);
		query = parts.slice(0, -1).join(" ");
	}

	// Check for API key
	const apiKey = configJSON.apis && configJSON.apis.google_api_key;
	const cseId = configJSON.apis && configJSON.apis.google_cse_id;

	if (!apiKey || !cseId) {
		// Fallback: provide a lmgtfy link
		const lmgtfy = `https://letmegooglethat.com/?q=${encodeURIComponent(query)}`;
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: `Google: ${query}`,
				description: `[Click here to search Google](${lmgtfy})`,
				footer: {
					text: "Google API not configured - showing search link instead",
				},
			}],
		});
	}

	try {
		const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=${limit}&safe=${msg.channel.nsfw ? "off" : "active"}`;
		const response = await fetch(url);
		const data = await response.json();

		if (!data.items || data.items.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "No results found for that query.",
				}],
			});
		}

		const results = data.items.slice(0, limit).map((item, i) =>
			`**${i + 1}. [${item.title}](${item.link})**\n${item.snippet || "No description"}`,
		).join("\n\n");

		msg.send({
			embeds: [{
				color: Colors.INFO,
				title: `Google: ${query}`,
				description: results,
				footer: {
					text: `Showing ${Math.min(limit, data.items.length)} results`,
				},
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: `Failed to search Google: ${err.message}`,
			}],
		});
	}
};
