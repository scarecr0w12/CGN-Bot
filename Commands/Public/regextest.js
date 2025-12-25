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
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🔣 Regex Tester",
				description: "Test regular expressions against text.",
				fields: [
					{ name: "Usage", value: `\`${commandData.name} /<pattern>/[flags] | <test string>\``, inline: false },
					{
						name: "Common Flags",
						value: [
							"`g` - Global (find all matches)",
							"`i` - Case insensitive",
							"`m` - Multiline",
							"`s` - Dot matches newlines",
						].join("\n"),
						inline: true,
					},
					{
						name: "Examples",
						value: [
							`\`${commandData.name} /\\d+/g | abc123def456\``,
							`\`${commandData.name} /hello/i | Hello World\``,
							`\`${commandData.name} /^\\w+@\\w+\\.\\w+$/ | test@example.com\``,
						].join("\n"),
						inline: false,
					},
				],
			}],
		});
	}

	// Parse regex and test string
	const pipeIndex = msg.suffix.indexOf("|");
	if (pipeIndex === -1) {
		return msg.sendInvalidUsage(commandData, "Please separate pattern and test string with `|`", `Example: \`${commandData.name} /\\d+/g | test123\``);
	}

	const patternPart = msg.suffix.substring(0, pipeIndex).trim();
	const testString = msg.suffix.substring(pipeIndex + 1).trim();

	// Parse regex pattern
	const regexMatch = patternPart.match(/^\/(.+)\/([gimsuy]*)$/);
	if (!regexMatch) {
		return msg.sendInvalidUsage(commandData, "Invalid regex format.", "Use `/pattern/flags` format.");
	}

	const [, pattern, flags] = regexMatch;

	try {
		const regex = new RegExp(pattern, flags);
		const isGlobal = flags.includes("g");

		const matches = [];
		const matchDetails = [];

		if (isGlobal) {
			let match;
			while ((match = regex.exec(testString)) !== null) {
				matches.push(match[0]);
				matchDetails.push({
					match: match[0],
					index: match.index,
					groups: match.slice(1),
				});
				// Prevent infinite loops for zero-length matches
				if (match.index === regex.lastIndex) {
					regex.lastIndex++;
				}
			}
		} else {
			const match = regex.exec(testString);
			if (match) {
				matches.push(match[0]);
				matchDetails.push({
					match: match[0],
					index: match.index,
					groups: match.slice(1),
				});
			}
		}

		const hasMatch = matches.length > 0;

		// Build highlighted string
		let highlighted = testString;
		if (hasMatch && testString.length <= 500) {
			// Highlight matches with brackets
			const sortedMatches = [...matchDetails].sort((a, b) => b.index - a.index);
			for (const m of sortedMatches) {
				highlighted = `${highlighted.substring(0, m.index)}**[${m.match}]**${highlighted.substring(m.index + m.match.length)}`;
			}
		}

		const fields = [
			{ name: "Pattern", value: `\`/${pattern}/${flags}\``, inline: true },
			{ name: "Result", value: hasMatch ? `✅ ${matches.length} match${matches.length > 1 ? "es" : ""}` : "❌ No match", inline: true },
		];

		if (hasMatch) {
			const matchList = matches.slice(0, 10).map((m, i) => `${i + 1}. \`${m}\``).join("\n");
			fields.push({ name: "Matches", value: matchList + (matches.length > 10 ? `\n... and ${matches.length - 10} more` : ""), inline: false });

			// Show capture groups if any
			if (matchDetails.some(m => m.groups.length > 0)) {
				const groupInfo = matchDetails.slice(0, 5).map((m, i) =>
					m.groups.length > 0 ? `Match ${i + 1}: ${m.groups.map((g, j) => `Group ${j + 1}: \`${g}\``).join(", ")}` : null,
				).filter(Boolean);
				const groupInfoString = groupInfo.join("\n");
				if (groupInfoString) {
					fields.push({ name: "Capture Groups", value: groupInfoString, inline: false });
				}
			}
		}

		if (highlighted.length <= 500) {
			fields.push({ name: "Test String", value: highlighted || "(empty)", inline: false });
		}

		msg.send({
			embeds: [{
				color: hasMatch ? Colors.RESPONSE : Colors.SOFT_ERR,
				title: "🔣 Regex Test Result",
				fields,
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Invalid Regex",
				description: err.message,
				footer: { text: "Check your pattern syntax" },
			}],
		});
	}
};
