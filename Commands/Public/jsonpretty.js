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
		return msg.sendInvalidUsage(commandData, "Please provide JSON to format.", "Paste your JSON after the command.");
	}

	// Extract JSON from code blocks if present
	let jsonInput = msg.suffix;
	const codeBlockMatch = jsonInput.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (codeBlockMatch) {
		jsonInput = codeBlockMatch[1].trim();
	}

	try {
		// Parse and re-stringify with indentation
		const parsed = JSON.parse(jsonInput);
		const formatted = JSON.stringify(parsed, null, 2);

		// Check if output is too long for Discord
		if (formatted.length > 1900) {
			// Create a file attachment instead
			const buffer = Buffer.from(formatted, "utf-8");
			return msg.send({
				content: "📄 Output too large for embed, sending as file:",
				files: [{
					attachment: buffer,
					name: "formatted.json",
				}],
			});
		}

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "📄 Formatted JSON",
				description: `\`\`\`json\n${formatted}\n\`\`\``,
				footer: { text: `${Object.keys(parsed).length} top-level keys | ${formatted.length} characters` },
			}],
		});
	} catch (err) {
		// Try to provide helpful error message
		let errorDetail = err.message;
		const posMatch = errorDetail.match(/position (\d+)/i);
		if (posMatch) {
			const pos = parseInt(posMatch[1]);
			const context = jsonInput.substring(Math.max(0, pos - 20), pos + 20);
			errorDetail += `\n\nNear: \`...${context}...\``;
		}

		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Invalid JSON",
				description: errorDetail,
				footer: { text: "Check for missing quotes, commas, or brackets" },
			}],
		});
	}
};
