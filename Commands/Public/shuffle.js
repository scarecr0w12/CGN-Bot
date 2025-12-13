const ArgParser = require("../../Modules/MessageUtils/Parser");
const crypto = require("crypto");

// Fisher-Yates shuffle with cryptographically secure random
const secureShuffle = array => {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const randomBytes = crypto.randomBytes(4);
		const randomIndex = randomBytes.readUInt32BE(0) % (i + 1);
		[result[i], result[randomIndex]] = [result[randomIndex], result[i]];
	}
	return result;
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Please provide items to shuffle!", "Separate items with spaces or `|` for multi-word items.");
	}

	// Parse items - support both space and pipe separation
	let items;
	if (msg.suffix.includes("|")) {
		items = ArgParser.parseQuoteArgs(msg.suffix, "|").map(i => i.trim()).filter(i => i.length > 0);
	} else {
		items = msg.suffix.trim().split(/\s+/).filter(i => i.length > 0);
	}

	if (items.length < 2) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Not Enough Items",
				description: "You need at least 2 items to shuffle!",
			}],
		});
	}

	if (items.length > 100) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Too Many Items",
				description: "Please provide no more than 100 items to shuffle.",
			}],
		});
	}

	const shuffled = secureShuffle(items);

	// Format output based on item count
	let description;
	if (shuffled.length <= 20) {
		description = shuffled.map((item, i) => `**${i + 1}.** ${item}`).join("\n");
	} else {
		description = `\`\`\`\n${shuffled.join("\n")}\`\`\``;
	}

	// Check if output would be too long
	if (description.length > 4000) {
		description = `\`\`\`\n${shuffled.join(", ")}\`\`\``;
		if (description.length > 4000) {
			description = `${description.slice(0, 3990)}...\`\`\``;
		}
	}

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🔀 Shuffled List",
			description,
			footer: { text: `${shuffled.length} items shuffled` },
		}],
	});
};
