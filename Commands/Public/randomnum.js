const crypto = require("crypto");

const secureRandom = (min, max) => {
	const range = max - min + 1;
	const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
	const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;

	let randomValue;
	do {
		randomValue = parseInt(crypto.randomBytes(bytesNeeded).toString("hex"), 16);
	} while (randomValue > maxValid);

	return min + (randomValue % range);
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	const args = msg.suffix?.trim().split(/\s+/) || [];

	let min = 1;
	let max = 100;
	let count = 1;
	let unique = false;

	// Parse arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i].toLowerCase();

		if (arg === "unique" || arg === "-u") {
			unique = true;
		} else if (arg === "count" || arg === "-c" || arg === "x") {
			if (args[i + 1] && !isNaN(parseInt(args[i + 1]))) {
				count = Math.max(1, Math.min(20, parseInt(args[i + 1])));
				i++;
			}
		} else if (!isNaN(parseInt(args[i]))) {
			const num = parseInt(args[i]);
			if (i === 0 || (args[i - 1].toLowerCase() !== "count" && args[i - 1].toLowerCase() !== "-c" && args[i - 1].toLowerCase() !== "x")) {
				if (min === 1 && max === 100) {
					// First number
					if (args[i + 1] && !isNaN(parseInt(args[i + 1]))) {
						min = num;
					} else {
						max = num;
					}
				} else if (max === 100 || min !== 1) {
					max = num;
				}
			}
		}
	}

	// Ensure min <= max
	if (min > max) [min, max] = [max, min];

	// Validate unique request
	const range = max - min + 1;
	if (unique && count > range) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Cannot Generate Unique Numbers",
				description: `You requested ${count} unique numbers, but the range ${min}-${max} only has ${range} possible values.`,
			}],
		});
	}

	// Generate numbers
	const numbers = [];
	if (unique) {
		const used = new Set();
		while (numbers.length < count) {
			const num = secureRandom(min, max);
			if (!used.has(num)) {
				used.add(num);
				numbers.push(num);
			}
		}
	} else {
		for (let i = 0; i < count; i++) {
			numbers.push(secureRandom(min, max));
		}
	}

	// Format output
	if (count === 1) {
		msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🎲 Random Number",
				description: `# ${numbers[0]}`,
				footer: { text: `Range: ${min} to ${max}` },
			}],
		});
	} else {
		const stats = {
			sum: numbers.reduce((a, b) => a + b, 0),
			avg: (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2),
			min: Math.min(...numbers),
			max: Math.max(...numbers),
		};

		msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: `🎲 ${count} Random Numbers`,
				description: `\`\`\`${numbers.join(", ")}\`\`\``,
				fields: [
					{ name: "Range", value: `${min} - ${max}`, inline: true },
					{ name: "Sum", value: `${stats.sum}`, inline: true },
					{ name: "Average", value: `${stats.avg}`, inline: true },
				],
				footer: { text: unique ? "All numbers are unique" : "Numbers may repeat" },
			}],
		});
	}
};
