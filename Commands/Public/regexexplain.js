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
		return msg.sendInvalidUsage(commandData, "Please provide a regex pattern to explain.", `Example: \`${commandData.name} /^\\w+@\\w+\\.\\w+$/i\``);
	}

	// Parse regex pattern
	const patternPart = msg.suffix.trim();
	const regexMatch = patternPart.match(/^\/(.+)\/([gimsuy]*)$/);

	let pattern, flags;
	if (regexMatch) {
		[, pattern, flags] = regexMatch;
	} else {
		pattern = patternPart;
		flags = "";
	}

	// Validate pattern
	try {
		const testRegex = new RegExp(pattern, flags);
		if (!testRegex) return; // Satisfy linter
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Invalid Regex",
				description: err.message,
			}],
		});
	}

	// Token explanations
	const tokenExplanations = {
		"^": "Start of string/line",
		$: "End of string/line",
		".": "Any character (except newline)",
		"\\d": "Digit (0-9)",
		"\\D": "Non-digit",
		"\\w": "Word character (a-z, A-Z, 0-9, _)",
		"\\W": "Non-word character",
		"\\s": "Whitespace (space, tab, newline)",
		"\\S": "Non-whitespace",
		"\\b": "Word boundary",
		"\\B": "Non-word boundary",
		"\\n": "Newline",
		"\\r": "Carriage return",
		"\\t": "Tab",
		"\\0": "Null character",
		"*": "0 or more (greedy)",
		"+": "1 or more (greedy)",
		"?": "0 or 1 (optional)",
		"*?": "0 or more (lazy)",
		"+?": "1 or more (lazy)",
		"??": "0 or 1 (lazy)",
		"|": "Alternation (OR)",
		"\\\\": "Escaped backslash",
		"\\.": "Literal dot",
		"\\*": "Literal asterisk",
		"\\+": "Literal plus",
		"\\?": "Literal question mark",
		"\\(": "Literal open parenthesis",
		"\\)": "Literal close parenthesis",
		"\\[": "Literal open bracket",
		"\\]": "Literal close bracket",
		"\\{": "Literal open brace",
		"\\}": "Literal close brace",
		"\\^": "Literal caret",
		"\\$": "Literal dollar sign",
	};

	const flagExplanations = {
		g: "**g** - Global: Find all matches",
		i: "**i** - Case Insensitive: Ignore case",
		m: "**m** - Multiline: ^ and $ match line boundaries",
		s: "**s** - Dotall: . matches newlines",
		u: "**u** - Unicode: Enable Unicode support",
		y: "**y** - Sticky: Match at exact position",
	};

	// Parse and explain the pattern
	const explanations = [];
	let i = 0;

	while (i < pattern.length) {
		const remaining = pattern.substring(i);

		// Check for escape sequences
		if (remaining.startsWith("\\")) {
			const twoChar = remaining.substring(0, 2);
			if (tokenExplanations[twoChar]) {
				explanations.push({ token: twoChar, explanation: tokenExplanations[twoChar] });
				i += 2;
				continue;
			}
			// Generic escape
			if (remaining.length > 1) {
				explanations.push({ token: twoChar, explanation: `Escaped '${remaining[1]}'` });
				i += 2;
				continue;
			}
		}

		// Check for character class
		if (remaining.startsWith("[")) {
			const endBracket = remaining.indexOf("]", 1);
			if (endBracket !== -1) {
				const charClass = remaining.substring(0, endBracket + 1);
				const isNegated = charClass[1] === "^";
				const content = charClass.substring(isNegated ? 2 : 1, charClass.length - 1);
				explanations.push({
					token: charClass,
					explanation: isNegated ? `NOT any of: ${content}` : `Any of: ${content}`,
				});
				i += charClass.length;
				continue;
			}
		}

		// Check for groups
		if (remaining.startsWith("(")) {
			if (remaining.startsWith("(?:")) {
				explanations.push({ token: "(?:", explanation: "Non-capturing group start" });
				i += 3;
				continue;
			} else if (remaining.startsWith("(?=")) {
				explanations.push({ token: "(?=", explanation: "Positive lookahead start" });
				i += 3;
				continue;
			} else if (remaining.startsWith("(?!")) {
				explanations.push({ token: "(?!", explanation: "Negative lookahead start" });
				i += 3;
				continue;
			} else if (remaining.startsWith("(?<=")) {
				explanations.push({ token: "(?<=", explanation: "Positive lookbehind start" });
				i += 4;
				continue;
			} else if (remaining.startsWith("(?<!")) {
				explanations.push({ token: "(?<!", explanation: "Negative lookbehind start" });
				i += 4;
				continue;
			} else {
				explanations.push({ token: "(", explanation: "Capturing group start" });
				i += 1;
				continue;
			}
		}

		if (remaining.startsWith(")")) {
			explanations.push({ token: ")", explanation: "Group end" });
			i += 1;
			continue;
		}

		// Check for quantifiers with braces
		const braceMatch = remaining.match(/^\{(\d+)(?:,(\d*))?\}/);
		if (braceMatch) {
			const [full, min, max] = braceMatch;
			if (max === undefined) {
				explanations.push({ token: full, explanation: `Exactly ${min} times` });
			} else if (max === "") {
				explanations.push({ token: full, explanation: `${min} or more times` });
			} else {
				explanations.push({ token: full, explanation: `${min} to ${max} times` });
			}
			i += full.length;
			continue;
		}

		// Simple tokens
		const char = remaining[0];
		if (tokenExplanations[char]) {
			explanations.push({ token: char, explanation: tokenExplanations[char] });
		} else if (char.match(/[a-zA-Z0-9]/)) {
			explanations.push({ token: char, explanation: `Literal '${char}'` });
		} else {
			explanations.push({ token: char, explanation: `Character '${char}'` });
		}
		i += 1;
	}

	// Build explanation text
	const explanationText = explanations.slice(0, 25).map(e =>
		`\`${e.token}\` → ${e.explanation}`,
	).join("\n");

	const fields = [
		{ name: "Pattern", value: `\`/${pattern}/${flags}\``, inline: false },
	];

	if (flags) {
		fields.push({
			name: "Flags",
			value: flags.split("").map(f => flagExplanations[f] || `**${f}**`).join("\n"),
			inline: false,
		});
	}

	fields.push({
		name: "Breakdown",
		value: explanationText + (explanations.length > 25 ? `\n... and ${explanations.length - 25} more tokens` : ""),
		inline: false,
	});

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "📖 Regex Explanation",
			fields,
			footer: { text: `${explanations.length} tokens parsed` },
		}],
	});
};
