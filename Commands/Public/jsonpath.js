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
				title: "🔍 JSONPath Query",
				description: "Query JSON data using path expressions.",
				fields: [
					{ name: "Usage", value: `\`${commandData.name} <path> | <json>\``, inline: false },
					{
						name: "Path Syntax",
						value: [
							"`$` - Root object",
							"`.key` - Access property",
							"`[0]` - Array index",
							"`[*]` - All array elements",
							"`.key1.key2` - Nested access",
						].join("\n"),
						inline: false,
					},
					{
						name: "Examples",
						value: [
							`\`${commandData.name} $.name | {"name": "John"}\``,
							`\`${commandData.name} $.users[0].name | {"users": [{"name": "Alice"}]}\``,
							`\`${commandData.name} $.items[*].price | {"items": [{"price": 10}, {"price": 20}]}\``,
						].join("\n"),
						inline: false,
					},
				],
			}],
		});
	}

	// Split path and JSON by pipe
	const pipeIndex = msg.suffix.indexOf("|");
	if (pipeIndex === -1) {
		return msg.sendInvalidUsage(commandData, "Please separate path and JSON with `|`", `Example: \`${commandData.name} $.name | {"name": "test"}\``);
	}

	const pathExpr = msg.suffix.substring(0, pipeIndex).trim();
	let jsonInput = msg.suffix.substring(pipeIndex + 1).trim();

	// Extract JSON from code blocks if present
	const codeBlockMatch = jsonInput.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (codeBlockMatch) {
		jsonInput = codeBlockMatch[1].trim();
	}

	if (!pathExpr) {
		return msg.sendInvalidUsage(commandData, "No path provided.", "Path should start with `$`");
	}

	try {
		const data = JSON.parse(jsonInput);

		// Simple JSONPath implementation
		const queryPath = (obj, path) => {
			// Remove leading $
			let normalizedPath = path.startsWith("$") ? path.substring(1) : path;
			if (normalizedPath.startsWith(".")) normalizedPath = normalizedPath.substring(1);

			if (!normalizedPath) return obj;

			const results = [];
			const parts = [];
			let current = "";
			let inBracket = false;

			// Parse path into parts
			for (const char of normalizedPath) {
				if (char === "[") {
					if (current) parts.push({ type: "key", value: current });
					current = "";
					inBracket = true;
				} else if (char === "]") {
					if (current === "*") {
						parts.push({ type: "wildcard" });
					} else {
						parts.push({ type: "index", value: parseInt(current) });
					}
					current = "";
					inBracket = false;
				} else if (char === "." && !inBracket) {
					if (current) parts.push({ type: "key", value: current });
					current = "";
				} else {
					current += char;
				}
			}
			if (current) parts.push({ type: "key", value: current });

			// Traverse
			const traverse = (value, partIndex) => {
				if (partIndex >= parts.length) {
					results.push(value);
					return;
				}

				const part = parts[partIndex];

				if (part.type === "key") {
					if (value && typeof value === "object" && part.value in value) {
						traverse(value[part.value], partIndex + 1);
					}
				} else if (part.type === "index") {
					if (Array.isArray(value) && part.value < value.length) {
						traverse(value[part.value], partIndex + 1);
					}
				} else if (part.type === "wildcard") {
					if (Array.isArray(value)) {
						for (const item of value) {
							traverse(item, partIndex + 1);
						}
					}
				}
			};

			traverse(obj, 0);
			return results.length === 1 ? results[0] : results;
		};

		const result = queryPath(data, pathExpr);
		const resultStr = JSON.stringify(result, null, 2);

		if (result === undefined || (Array.isArray(result) && result.length === 0)) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "🔍 No Results",
					description: `Path \`${pathExpr}\` returned no matches.`,
				}],
			});
		}

		// Check output length
		if (resultStr.length > 1900) {
			const buffer = Buffer.from(resultStr, "utf-8");
			return msg.send({
				content: `🔍 Query result for \`${pathExpr}\`:`,
				files: [{
					attachment: buffer,
					name: "result.json",
				}],
			});
		}

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "🔍 JSONPath Result",
				description: `\`\`\`json\n${resultStr}\n\`\`\``,
				footer: { text: `Path: ${pathExpr}` },
			}],
		});
	} catch (err) {
		if (err instanceof SyntaxError) {
			msg.send({
				embeds: [{
					color: Colors.ERR,
					title: "❌ Invalid JSON",
					description: err.message,
				}],
			});
		} else {
			msg.send({
				embeds: [{
					color: Colors.ERR,
					title: "❌ Query Error",
					description: err.message,
				}],
			});
		}
	}
};
