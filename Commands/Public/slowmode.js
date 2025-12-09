const { PermissionFlagsBits } = require("discord.js");
const DurationParser = require("../../Modules/MessageUtils/DurationParser");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	// Check bot permissions
	if (!msg.channel.permissionsFor(msg.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Missing Permissions",
				description: "I need the **Manage Channels** permission to set slowmode!",
			}],
		});
	}

	if (!msg.suffix) {
		// Show current slowmode
		const currentSlowmode = msg.channel.rateLimitPerUser;
		if (currentSlowmode === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					description: `🐌 This channel has no slowmode. Use \`${msg.guild.commandPrefix}${commandData.name} <duration>\` to set one.`,
					footer: { text: "Examples: 5s, 30s, 1m, 5m, 1h" },
				}],
			});
		}

		const formatted = formatDuration(currentSlowmode);
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: `🐌 Current slowmode: **${formatted}**`,
				footer: { text: `Use "${msg.guild.commandPrefix}${commandData.name} off" to disable` },
			}],
		});
	}

	const input = msg.suffix.toLowerCase().trim();

	// Disable slowmode
	if (["off", "disable", "0", "none", "clear"].includes(input)) {
		try {
			await msg.channel.setRateLimitPerUser(0, `Slowmode disabled by ${msg.author.tag}`);
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "🐌 Slowmode has been **disabled** for this channel!",
				}],
			});
		} catch (err) {
			return msg.send({
				embeds: [{
					color: Colors.ERROR,
					description: "Failed to disable slowmode!",
				}],
			});
		}
	}

	// Parse duration
	let seconds = 0;

	// Try simple number (assume seconds)
	if (/^\d+$/.test(input)) {
		seconds = parseInt(input);
	} else {
		// Parse duration string
		const durationMatch = input.match(/^(\d+)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours)?$/i);
		if (durationMatch) {
			const value = parseInt(durationMatch[1]);
			const unit = (durationMatch[2] || "s").toLowerCase();

			switch (unit.charAt(0)) {
				case "s":
					seconds = value;
					break;
				case "m":
					seconds = value * 60;
					break;
				case "h":
					seconds = value * 3600;
					break;
				default:
					seconds = value;
			}
		} else {
			// Try DurationParser as fallback
			try {
				const parsed = DurationParser.parse(input);
				if (parsed && parsed.duration) {
					seconds = Math.floor(parsed.duration / 1000);
				}
			} catch (e) {
				// Ignore parsing errors
			}
		}
	}

	if (seconds <= 0) {
		return msg.send({
			embeds: [{
				color: Colors.INVALID,
				description: "Please provide a valid duration!",
				footer: { text: "Examples: 5s, 30s, 1m, 5m, 1h, or just a number in seconds" },
			}],
		});
	}

	// Discord max slowmode is 6 hours (21600 seconds)
	if (seconds > 21600) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Slowmode cannot exceed **6 hours** (21600 seconds)!",
			}],
		});
	}

	try {
		await msg.channel.setRateLimitPerUser(seconds, `Slowmode set by ${msg.author.tag}`);
		const formatted = formatDuration(seconds);
		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				description: `🐌 Slowmode set to **${formatted}** for this channel!`,
			}],
		});
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "Failed to set slowmode!",
			}],
		});
	}
};

function formatDuration (seconds) {
	if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
	if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return secs > 0 ? `${minutes}m ${secs}s` : `${minutes} minute${minutes !== 1 ? "s" : ""}`;
	}
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours !== 1 ? "s" : ""}`;
}
