const crypto = require("crypto");

const generateUUIDv4 = () => {
	const bytes = crypto.randomBytes(16);
	// Set version (4) and variant (RFC 4122)
	// eslint-disable-next-line no-bitwise
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	// eslint-disable-next-line no-bitwise
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	const hex = bytes.toString("hex");
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32),
	].join("-");
};

const generateShortId = (length = 8) => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = crypto.randomBytes(length);
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length];
	}
	return result;
};

const generateNanoId = (length = 21) => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
	const bytes = crypto.randomBytes(length);
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length];
	}
	return result;
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	const args = msg.suffix?.toLowerCase().trim().split(/\s+/) || [];
	const type = args[0] || "v4";
	let count = 1;

	// Check for count argument
	if (args[1] && !isNaN(parseInt(args[1]))) {
		count = Math.max(1, Math.min(10, parseInt(args[1])));
	} else if (!isNaN(parseInt(args[0]))) {
		count = Math.max(1, Math.min(10, parseInt(args[0])));
	}

	const ids = [];
	let title = "";
	let description = "";

	switch (type) {
		case "v4":
		case "uuid":
		case "guid":
		default: {
			for (let i = 0; i < count; i++) {
				ids.push(generateUUIDv4());
			}
			title = "🆔 UUID v4";
			description = "RFC 4122 compliant random UUID";
			break;
		}

		case "short":
		case "shortid": {
			const length = args[1] && !isNaN(parseInt(args[1])) ? Math.max(4, Math.min(32, parseInt(args[1]))) : 8;
			for (let i = 0; i < count; i++) {
				ids.push(generateShortId(length));
			}
			title = "🆔 Short ID";
			description = `${length}-character alphanumeric ID`;
			break;
		}

		case "nano":
		case "nanoid": {
			const length = args[1] && !isNaN(parseInt(args[1])) ? Math.max(4, Math.min(64, parseInt(args[1]))) : 21;
			for (let i = 0; i < count; i++) {
				ids.push(generateNanoId(length));
			}
			title = "🆔 Nano ID";
			description = `${length}-character URL-safe ID`;
			break;
		}

		case "timestamp":
		case "ts": {
			const ts = Date.now().toString(36).toUpperCase();
			const rand = generateShortId(6);
			for (let i = 0; i < count; i++) {
				ids.push(`${ts}-${generateShortId(6)}`);
			}
			title = "🆔 Timestamp ID";
			description = "Time-sortable unique identifier";
			break;
		}

		case "hex": {
			const length = args[1] && !isNaN(parseInt(args[1])) ? Math.max(4, Math.min(64, parseInt(args[1]))) : 16;
			for (let i = 0; i < count; i++) {
				ids.push(crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length));
			}
			title = "🆔 Hex ID";
			description = `${length}-character hexadecimal ID`;
			break;
		}

		case "help": {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "🆔 UUID Generator",
					description: "Generate various types of unique identifiers.",
					fields: [
						{
							name: "Types",
							value: [
								`\`${commandData.name}\` - UUID v4 (default)`,
								`\`${commandData.name} short [length]\` - Short alphanumeric ID`,
								`\`${commandData.name} nano [length]\` - NanoID (URL-safe)`,
								`\`${commandData.name} timestamp\` - Time-sortable ID`,
								`\`${commandData.name} hex [length]\` - Hexadecimal ID`,
							].join("\n"),
						},
						{
							name: "Options",
							value: `Add a number (1-10) to generate multiple IDs.\nExample: \`${commandData.name} 5\` generates 5 UUIDs`,
						},
					],
				}],
			});
		}
	}

	const idList = ids.map(id => `\`${id}\``).join("\n");

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title,
			description: `${description}\n\n${idList}`,
			footer: { text: count > 1 ? `Generated ${count} IDs` : "Cryptographically secure random generation" },
		}],
	});
};
