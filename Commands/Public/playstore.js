/**
 * Play Store Command - Search Google Play Store
 */
const { fetch } = require("undici");

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Please provide an app name to search. Usage: \`${commandData.name} <app name>\``,
			}],
		});
	}

	const query = msg.suffix.trim();

	try {
		// Use a simple search approach via Google Play web
		const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps`;

		msg.send({
			embeds: [{
				color: Colors.INFO,
				title: `Google Play Store: ${query}`,
				description: `[Click here to search Google Play Store](${searchUrl})`,
				footer: {
					text: "Direct Play Store API not available - showing search link",
				},
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: `Failed to search Play Store: ${err.message}`,
			}],
		});
	}
};
