module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Please provide a number to convert!", "Example: `base 255 10 16` (decimal 255 to hex)");
	}

	const args = msg.suffix.trim().split(/\s+/);

	// Support formats:
	// base <number> <from> <to>
	// base <number> to <to> (assumes from is 10)
	// base <prefix_number> to <to> (0x, 0b, 0o prefixes)

	let value = args[0];
	let fromBase = 10;
	let toBase = 16;

	// Check for prefixed numbers
	if (value.toLowerCase().startsWith("0x")) {
		fromBase = 16;
		value = value.slice(2);
	} else if (value.toLowerCase().startsWith("0b")) {
		fromBase = 2;
		value = value.slice(2);
	} else if (value.toLowerCase().startsWith("0o")) {
		fromBase = 8;
		value = value.slice(2);
	}

	if (args.length >= 3) {
		// base <number> <from> <to>
		if (args[1].toLowerCase() === "to") {
			// base <number> to <to>
			toBase = parseInt(args[2]);
		} else {
			fromBase = parseInt(args[1]);
			toBase = parseInt(args[2]);
		}
	} else if (args.length === 2) {
		// base <number> <to> (from decimal by default or detected prefix)
		toBase = parseInt(args[1]);
	}

	// Validate bases
	if (isNaN(fromBase) || isNaN(toBase) || fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Invalid Base",
				description: "Bases must be between 2 and 36.",
			}],
		});
	}

	// Parse and convert
	try {
		const decimal = parseInt(value, fromBase);

		if (isNaN(decimal)) {
			return msg.send({
				embeds: [{
					color: Colors.ERR,
					title: "Invalid Number",
					description: `\`${value}\` is not a valid base-${fromBase} number.`,
				}],
			});
		}

		const result = decimal.toString(toBase).toUpperCase();

		// Common base names
		const baseNames = {
			2: "Binary",
			8: "Octal",
			10: "Decimal",
			16: "Hexadecimal",
		};

		const fromName = baseNames[fromBase] || `Base-${fromBase}`;
		const toName = baseNames[toBase] || `Base-${toBase}`;

		// Format with common prefixes for display
		const prefixes = { 2: "0b", 8: "0o", 16: "0x" };
		const displayResult = prefixes[toBase] ? `${prefixes[toBase]}${result}` : result;
		const displayInput = prefixes[fromBase] ? `${prefixes[fromBase]}${value.toUpperCase()}` : value.toUpperCase();

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "🔢 Base Conversion",
				fields: [
					{ name: `${fromName} (Base ${fromBase})`, value: `\`${displayInput}\``, inline: true },
					{ name: "➡️", value: "\u200B", inline: true },
					{ name: `${toName} (Base ${toBase})`, value: `\`${displayResult}\``, inline: true },
				],
				footer: { text: `Decimal value: ${decimal}` },
			}],
		});
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Conversion Error",
				description: "Failed to convert the number. Please check your input.",
			}],
		});
	}
};
