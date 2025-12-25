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
		return msg.sendInvalidUsage(commandData, "Please provide JSON to minify.", "Paste your JSON after the command.");
	}

	// Extract JSON from code blocks if present
	let jsonInput = msg.suffix;
	const codeBlockMatch = jsonInput.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (codeBlockMatch) {
		jsonInput = codeBlockMatch[1].trim();
	}

	try {
		// Parse and re-stringify without whitespace
		const parsed = JSON.parse(jsonInput);
		const minified = JSON.stringify(parsed);
		const originalSize = jsonInput.length;
		const minifiedSize = minified.length;
		const saved = originalSize - minifiedSize;
		const percent = ((saved / originalSize) * 100).toFixed(1);

		// Check if output is too long for Discord
		if (minified.length > 1900) {
			const buffer = Buffer.from(minified, "utf-8");
			return msg.send({
				content: `📄 Output too large for embed. Saved ${saved} characters (${percent}% reduction)`,
				files: [{
					attachment: buffer,
					name: "minified.json",
				}],
			});
		}

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "📦 Minified JSON",
				description: `\`\`\`json\n${minified}\n\`\`\``,
				fields: [
					{ name: "Original Size", value: `${originalSize} chars`, inline: true },
					{ name: "Minified Size", value: `${minifiedSize} chars`, inline: true },
					{ name: "Saved", value: `${saved} chars (${percent}%)`, inline: true },
				],
			}],
		});
	} catch (err) {
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
