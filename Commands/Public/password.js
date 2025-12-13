const crypto = require("crypto");

const CHARSETS = {
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	numbers: "0123456789",
	symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
	similar: "il1Lo0O",
	ambiguous: "{}[]()/\\'\"`~,;:.<>",
};

const generatePassword = (length, options) => {
	let charset = "";

	if (options.lowercase) charset += CHARSETS.lowercase;
	if (options.uppercase) charset += CHARSETS.uppercase;
	if (options.numbers) charset += CHARSETS.numbers;
	if (options.symbols) charset += CHARSETS.symbols;

	// Remove similar characters if requested
	if (options.excludeSimilar) {
		for (const char of CHARSETS.similar) {
			charset = charset.replace(new RegExp(char, "g"), "");
		}
	}

	if (charset.length === 0) {
		charset = CHARSETS.lowercase + CHARSETS.uppercase + CHARSETS.numbers;
	}

	let password = "";
	const randomBytes = crypto.randomBytes(length);

	for (let i = 0; i < length; i++) {
		password += charset[randomBytes[i] % charset.length];
	}

	return password;
};

const calculateStrength = password => {
	let score = 0;
	const length = password.length;

	// Length score
	if (length >= 8) score += 1;
	if (length >= 12) score += 1;
	if (length >= 16) score += 1;
	if (length >= 20) score += 1;

	// Character variety
	if (/[a-z]/.test(password)) score += 1;
	if (/[A-Z]/.test(password)) score += 1;
	if (/[0-9]/.test(password)) score += 1;
	if (/[^a-zA-Z0-9]/.test(password)) score += 1;

	// Strength labels
	if (score <= 2) return { label: "Weak", emoji: "🔴", bar: "██░░░░░░░░" };
	if (score <= 4) return { label: "Fair", emoji: "🟠", bar: "████░░░░░░" };
	if (score <= 6) return { label: "Good", emoji: "🟡", bar: "██████░░░░" };
	if (score <= 7) return { label: "Strong", emoji: "🟢", bar: "████████░░" };
	return { label: "Very Strong", emoji: "💪", bar: "██████████" };
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	const args = msg.suffix?.toLowerCase().trim().split(/\s+/) || [];

	// Default options
	let length = 16;
	const options = {
		lowercase: true,
		uppercase: true,
		numbers: true,
		symbols: false,
		excludeSimilar: false,
	};

	// Parse arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (!isNaN(parseInt(arg))) {
			length = Math.max(4, Math.min(128, parseInt(arg)));
		} else if (arg === "symbols" || arg === "special" || arg === "-s") {
			options.symbols = true;
		} else if (arg === "nosimilar" || arg === "-ns") {
			options.excludeSimilar = true;
		} else if (arg === "simple" || arg === "alpha") {
			options.numbers = false;
			options.symbols = false;
		} else if (arg === "pin" || arg === "numeric") {
			options.lowercase = false;
			options.uppercase = false;
			options.numbers = true;
			options.symbols = false;
		} else if (arg === "strong" || arg === "full") {
			options.symbols = true;
			options.excludeSimilar = true;
			if (length < 20) length = 20;
		}
	}

	// Generate password
	const password = generatePassword(length, options);
	const strength = calculateStrength(password);

	// Build character set description
	const charsetParts = [];
	if (options.lowercase) charsetParts.push("a-z");
	if (options.uppercase) charsetParts.push("A-Z");
	if (options.numbers) charsetParts.push("0-9");
	if (options.symbols) charsetParts.push("symbols");

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🔐 Generated Password",
			description: `\`\`\`${password}\`\`\``,
			fields: [
				{ name: "Length", value: `${length} characters`, inline: true },
				{ name: "Character Set", value: charsetParts.join(", "), inline: true },
				{ name: `Strength ${strength.emoji}`, value: `\`${strength.bar}\` ${strength.label}`, inline: true },
			],
			footer: { text: "⚠️ This message will be visible to others in this channel. Copy the password and delete if needed." },
		}],
	});
};
