/**
 * Meme Command - Generate memes
 */
const { fetch } = require("undici");

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Please provide meme text. Usage: \`${commandData.name} <top text>|<bottom text>\``,
			}],
		});
	}

	const parts = msg.suffix.split("|").map(p => p.trim());
	let templateId = "61579";
	let topText = parts[0] || "";
	let bottomText = parts[1] || "";

	// Check if first part is a template key
	if (parts.length >= 2 && parts[0].match(/^\w+$/)) {
		const templates = {
			drake: "181913649",
			distracted: "112126428",
			buttons: "87743020",
			change: "129242436",
			disaster: "97984",
			doge: "8072285",
			success: "61544",
			fry: "61520",
			grumpy: "405658",
			bad: "61585",
		};
		if (templates[parts[0].toLowerCase()]) {
			templateId = templates[parts[0].toLowerCase()];
			topText = parts[1] || "";
			bottomText = parts[2] || "";
		}
	}

	try {
		// Use imgflip API
		const params = new URLSearchParams({
			template_id: templateId,
			username: "imgflip_hubot",
			password: "imgflip_hubot",
			text0: topText,
			text1: bottomText,
		});

		const response = await fetch("https://api.imgflip.com/caption_image", {
			method: "POST",
			body: params,
		});
		const data = await response.json();

		if (!data.success) {
			return msg.send({
				embeds: [{
					color: Colors.ERR,
					description: "Failed to generate meme. Please try again.",
				}],
			});
		}

		msg.send({
			embeds: [{
				color: Colors.INFO,
				image: {
					url: data.data.url,
				},
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				description: `Failed to generate meme: ${err.message}`,
			}],
		});
	}
};
