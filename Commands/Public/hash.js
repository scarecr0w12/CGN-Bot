const crypto = require("crypto");
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

	const supportedAlgorithms = ["md5", "sha1", "sha256", "sha512", "sha3-256", "sha3-512"];

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🔑 Hash Generator",
				description: "Generate cryptographic hashes from text.",
				fields: [
					{ name: "Usage", value: `\`${commandData.name} <algorithm> <text>\`\nor\n\`${commandData.name} all <text>\``, inline: false },
					{ name: "Supported Algorithms", value: supportedAlgorithms.map(a => `\`${a}\``).join(", "), inline: false },
					{ name: "Example", value: `\`${commandData.name} sha256 hello world\``, inline: false },
				],
			}],
		});
	}

	const args = msg.suffix.split(/\s+/);
	const algorithm = args[0].toLowerCase();
	const text = args.slice(1).join(" ");

	if (!text) {
		return msg.sendInvalidUsage(commandData, "No text provided.", `Use \`${commandData.name} <algorithm> <text>\``);
	}

	try {
		if (algorithm === "all") {
			// Generate all hashes
			const hashes = supportedAlgorithms.map(algo => {
				const hash = crypto.createHash(algo.replace("-", "")).update(text).digest("hex");
				return { name: algo.toUpperCase(), value: `\`${hash}\``, inline: false };
			});

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "🔑 All Hashes",
					description: `Input: \`${text.substring(0, 100)}${text.length > 100 ? "..." : ""}\``,
					fields: hashes,
				}],
			});
		} else {
			// Normalize algorithm name
			const normalizedAlgo = algorithm.replace("-", "");

			if (!supportedAlgorithms.includes(algorithm)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						title: "❌ Unknown Algorithm",
						description: `Supported algorithms: ${supportedAlgorithms.map(a => `\`${a}\``).join(", ")}`,
					}],
				});
			}

			const hash = crypto.createHash(normalizedAlgo).update(text).digest("hex");

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: `🔑 ${algorithm.toUpperCase()} Hash`,
					fields: [
						{ name: "Input", value: `\`\`\`\n${text.substring(0, 500)}${text.length > 500 ? "..." : ""}\n\`\`\``, inline: false },
						{ name: "Hash", value: `\`\`\`\n${hash}\n\`\`\``, inline: false },
					],
					footer: { text: `Algorithm: ${algorithm.toUpperCase()} | Length: ${hash.length} characters` },
				}],
			});
		}
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Error",
				description: `Failed to generate hash: ${err.message}`,
			}],
		});
	}
};
