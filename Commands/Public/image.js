/**
 * Image Command - Search Google Images
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

	const query = msg.suffix.replace(/random$/i, "").trim();
	const isRandom = /random$/i.test(msg.suffix);

	// Check for API key (from environment)
	const apiKey = process.env.GOOGLE_API_KEY;
	const cseId = process.env.GOOGLE_CSE_ID;

	if (!apiKey || !cseId) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Google Image Search is not configured. Please set up Google API credentials.",
			}],
		});
	}

	try {
		const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&searchType=image&q=${encodeURIComponent(query)}&safe=${msg.channel.nsfw ? "off" : "active"}`;
		const response = await fetch(url);
		const data = await response.json();

		if (!data.items || data.items.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "No images found for that query.",
				}],
			});
		}

		const item = isRandom ? data.items[Math.floor(Math.random() * data.items.length)] : data.items[0];

		msg.send({
			embeds: [{
				color: Colors.INFO,
				title: item.title,
				image: {
					url: item.link,
				},
				footer: {
					text: `Search: ${query}`,
				},
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: `Failed to search for images: ${err.message}`,
			}],
		});
	}
};
