const TierManager = require("../../Modules/TierManager");

module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	// Check tier access (Tier 2 required for developer tools)
	const canAccess = await TierManager.hasMinimumTierLevel(msg.guild.id, 2);
	if (!canAccess) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "🔒 Premium Feature",
				description: "Developer tools require **Tier 2 (Premium)** subscription.",
				footer: { text: "Upgrade your server to access this feature" },
			}],
		});
	}

	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Please provide text to encode or decode.", "Use `encode` or `decode` followed by your text.");
	}

	const args = msg.suffix.split(/\s+/);
	const action = args[0].toLowerCase();
	const text = args.slice(1).join(" ");

	if (!["encode", "decode", "e", "d"].includes(action)) {
		return msg.sendInvalidUsage(commandData, "Invalid action.", "Use `encode` (e) or `decode` (d) followed by your text.");
	}

	if (!text) {
		return msg.sendInvalidUsage(commandData, "No text provided.", `Use \`${commandData.name} ${action} <text>\``);
	}

	try {
		let result;
		let title;

		if (action === "encode" || action === "e") {
			result = Buffer.from(text, "utf-8").toString("base64");
			title = "🔐 Base64 Encoded";
		} else {
			// Validate base64 input
			if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						title: "❌ Invalid Base64",
						description: "The provided text is not valid Base64.",
					}],
				});
			}
			result = Buffer.from(text, "base64").toString("utf-8");
			title = "🔓 Base64 Decoded";
		}

		// Truncate if too long
		const displayResult = result.length > 1900 ? `${result.substring(0, 1900)}...\n\n*(truncated)*` : result;

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title,
				fields: [
					{ name: "Input", value: `\`\`\`\n${text.substring(0, 500)}${text.length > 500 ? "..." : ""}\n\`\`\``, inline: false },
					{ name: "Output", value: `\`\`\`\n${displayResult}\n\`\`\``, inline: false },
				],
				footer: { text: `Length: ${result.length} characters` },
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Error",
				description: `Failed to ${action} text: ${err.message}`,
			}],
		});
	}
};
