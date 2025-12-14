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

	// Discord timestamp format styles
	const formatStyles = {
		t: "Short Time (16:20)",
		T: "Long Time (16:20:30)",
		d: "Short Date (20/04/2021)",
		D: "Long Date (20 April 2021)",
		f: "Short Date/Time (20 April 2021 16:20)",
		F: "Long Date/Time (Tuesday, 20 April 2021 16:20)",
		R: "Relative (2 months ago)",
	};

	if (!msg.suffix) {
		const now = Math.floor(Date.now() / 1000);

		// Show current timestamp with all formats
		const formatExamples = Object.entries(formatStyles).map(([style, desc]) =>
			`\`<t:${now}:${style}>\` → <t:${now}:${style}> *(${desc})*`,
		).join("\n");

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "⏰ Timestamp Converter",
				description: "Convert between Unix timestamps and human-readable dates.",
				fields: [
					{ name: "Current Unix Timestamp", value: `\`${now}\``, inline: true },
					{ name: "Current ISO Date", value: `\`${new Date().toISOString()}\``, inline: true },
					{ name: "\u200b", value: "\u200b", inline: false },
					{ name: "Discord Timestamp Formats", value: formatExamples, inline: false },
					{
						name: "Usage",
						value: [
							`\`${commandData.name}\` - Show current timestamp`,
							`\`${commandData.name} <unix>\` - Convert Unix to date`,
							`\`${commandData.name} <date>\` - Convert date to Unix`,
							`\`${commandData.name} discord <unix>\` - Get Discord formats`,
						].join("\n"),
						inline: false,
					},
				],
			}],
		});
	}

	const args = msg.suffix.split(/\s+/);
	const firstArg = args[0].toLowerCase();

	try {
		// Discord format command
		if (firstArg === "discord" || firstArg === "d") {
			const input = args.slice(1).join(" ");
			let unixTimestamp;

			if (!input) {
				unixTimestamp = Math.floor(Date.now() / 1000);
			} else if (/^\d{10,13}$/.test(input)) {
				unixTimestamp = input.length === 13 ? Math.floor(parseInt(input) / 1000) : parseInt(input);
			} else {
				const parsed = new Date(input);
				if (isNaN(parsed.getTime())) {
					return msg.send({
						embeds: [{
							color: Colors.SOFT_ERR,
							title: "❌ Invalid Input",
							description: "Could not parse the provided timestamp or date.",
						}],
					});
				}
				unixTimestamp = Math.floor(parsed.getTime() / 1000);
			}

			const formats = Object.entries(formatStyles).map(([style, desc]) => ({
				name: desc,
				value: `\`<t:${unixTimestamp}:${style}>\`\n<t:${unixTimestamp}:${style}>`,
				inline: true,
			}));

			return msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "⏰ Discord Timestamp Formats",
					description: `Unix: \`${unixTimestamp}\``,
					fields: formats,
					footer: { text: "Click the code to copy and use in Discord!" },
				}],
			});
		}

		// Parse input
		const input = msg.suffix.trim();

		// Check if input is a Unix timestamp (10-13 digits)
		if (/^\d{10,13}$/.test(input)) {
			const timestamp = input.length === 13 ? parseInt(input) : parseInt(input) * 1000;
			const date = new Date(timestamp);

			if (isNaN(date.getTime())) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						title: "❌ Invalid Timestamp",
						description: "The provided Unix timestamp is invalid.",
					}],
				});
			}

			const unixSeconds = Math.floor(timestamp / 1000);
			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "⏰ Unix to Date",
					fields: [
						{ name: "Unix Timestamp", value: `\`${input}\``, inline: true },
						{ name: "Seconds", value: `\`${unixSeconds}\``, inline: true },
						{ name: "Milliseconds", value: `\`${timestamp}\``, inline: true },
						{ name: "ISO 8601", value: `\`${date.toISOString()}\``, inline: false },
						{ name: "UTC", value: `\`${date.toUTCString()}\``, inline: false },
						{ name: "Local", value: `\`${date.toString()}\``, inline: false },
						{ name: "Discord Format", value: `<t:${unixSeconds}:F> (<t:${unixSeconds}:R>)`, inline: false },
					],
				}],
			});
		} else {
			// Try to parse as date string
			const date = new Date(input);

			if (isNaN(date.getTime())) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						title: "❌ Invalid Date",
						description: "Could not parse the provided date. Try formats like:\n`2024-01-15`, `Jan 15, 2024`, `2024-01-15T10:30:00Z`",
					}],
				});
			}

			const unixSeconds = Math.floor(date.getTime() / 1000);
			const unixMs = date.getTime();

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "⏰ Date to Unix",
					fields: [
						{ name: "Input", value: `\`${input}\``, inline: false },
						{ name: "Unix (seconds)", value: `\`${unixSeconds}\``, inline: true },
						{ name: "Unix (milliseconds)", value: `\`${unixMs}\``, inline: true },
						{ name: "ISO 8601", value: `\`${date.toISOString()}\``, inline: false },
						{ name: "Discord Format", value: `<t:${unixSeconds}:F> (<t:${unixSeconds}:R>)`, inline: false },
					],
				}],
			});
		}
	} catch (err) {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Error",
				description: `Failed to convert timestamp: ${err.message}`,
			}],
		});
	}
};
