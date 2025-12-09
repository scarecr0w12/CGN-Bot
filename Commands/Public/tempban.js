const { create: CreateModLog } = require("../../Modules/ModLog");
const ArgParser = require("../../Modules/MessageUtils/Parser");
const DurationParser = require("../../Modules/MessageUtils/DurationParser");

module.exports = async ({ client, Constants: { Colors }, configJS }, { serverDocument, serverQueryDocument }, msg, commandData) => {
	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Who do you want me to temporarily ban? ⏰");
	}

	const [inputMember, ...rest] = ArgParser.parseQuoteArgs(msg.suffix, msg.suffix.includes("|") ? "|" : " ");

	// Find the member
	const member = await client.memberSearch(inputMember.trim(), msg.guild).catch(() => null);

	if (!member) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "I couldn't find a matching member in this guild... 🧐",
			}],
		});
	}

	// Parse duration from rest
	if (rest.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.INVALID,
				description: "Please specify a duration!",
				footer: { text: "Examples: 1h, 1d, 1w, 30m" },
			}],
		});
	}

	const durationStr = rest[0];
	const reason = rest.slice(1).join(" ").trim() || "No reason specified";

	// Parse duration
	let durationMs = 0;
	const durationMatch = durationStr.match(/^(\d+)\s*(m|min|minutes?|h|hr|hours?|d|days?|w|weeks?)$/i);

	if (durationMatch) {
		const value = parseInt(durationMatch[1]);
		const unit = durationMatch[2].toLowerCase();

		if (unit.startsWith("m")) durationMs = value * 60 * 1000;
		else if (unit.startsWith("h")) durationMs = value * 60 * 60 * 1000;
		else if (unit.startsWith("d")) durationMs = value * 24 * 60 * 60 * 1000;
		else if (unit.startsWith("w")) durationMs = value * 7 * 24 * 60 * 60 * 1000;
	} else {
		// Try DurationParser
		try {
			const parsed = DurationParser.parse(durationStr);
			if (parsed && parsed.duration) {
				durationMs = parsed.duration;
			}
		} catch (e) {
			// Ignore parsing errors
		}
	}

	if (durationMs <= 0) {
		return msg.send({
			embeds: [{
				color: Colors.INVALID,
				description: "Please provide a valid duration!",
				footer: { text: "Examples: 30m, 1h, 1d, 1w" },
			}],
		});
	}

	// Max duration: 28 days
	const maxDuration = 28 * 24 * 60 * 60 * 1000;
	if (durationMs > maxDuration) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Temporary ban cannot exceed **28 days**!",
			}],
		});
	}

	// Permission checks
	const { canClientBan, memberAboveAffected } = client.canDoActionOnMember(msg.guild, msg.member, member, "ban");
	
	if (!canClientBan) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "I'm sorry, but I can't do that... 😔",
				description: "I'm missing permissions to ban that user!",
			}],
		});
	}

	if (!memberAboveAffected) {
		return msg.send({
			embeds: [{
				color: Colors.MISSING_PERMS,
				title: "I'm sorry, but I cannot let you do that! 😶",
				description: "You cannot tempban someone who's above you!",
			}],
		});
	}

	const unbanDate = new Date(Date.now() + durationMs);
	const durationFormatted = formatDuration(durationMs);

	// Confirmation
	await msg.send({
		embeds: [{
			color: Colors.INPUT,
			title: `Waiting on @__${client.getName(serverDocument, msg.member)}__'s input...`,
			description: `Are you sure you want to temporarily ban **@${client.getName(serverDocument, member)}** for **${durationFormatted}**?\n\nReason:\`\`\`css\n${reason}\`\`\``,
			footer: { text: `They will be automatically unbanned on ${unbanDate.toUTCString()}` },
		}],
	});

	const collector = msg.channel.createMessageCollector({
		filter: m => m.author.id === msg.author.id,
		time: 60000,
		max: 1,
	});

	collector.on("collect", async message => {
		try {
			await message.delete().catch(() => null);
		} catch (_) {
			// Ignore delete errors
		}

		if (!configJS.yesStrings.includes(message.content.toLowerCase().trim())) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					description: "Temporary ban canceled! 😓",
				}],
			});
		}

		try {
			// DM the user before banning
			try {
				await member.user.send({
					embeds: [{
						color: Colors.RED,
						description: `You've been temporarily banned from \`${msg.guild.name}\`! ⏰🔨`,
						fields: [
							{ name: "Duration", value: durationFormatted, inline: true },
							{ name: "Reason", value: reason, inline: true },
							{ name: "Moderator", value: `@${msg.author.tag}`, inline: true },
							{ name: "Unban Date", value: unbanDate.toUTCString(), inline: false },
						],
						thumbnail: { url: msg.guild.iconURL() },
					}],
				});
			} catch (_) {}

			// Ban the user
			await member.ban({
				deleteMessageSeconds: 86400,
				reason: `[Tempban: ${durationFormatted}] ${reason} | By @${msg.author.tag}`,
			});

			// Store tempban for auto-unban
			if (!serverDocument.tempbans) {
				serverQueryDocument.set("tempbans", []);
			}
			serverQueryDocument.push("tempbans", {
				user_id: member.id,
				unban_at: unbanDate.getTime(),
				reason: reason,
				moderator_id: msg.author.id,
			});

			// Create ModLog entry
			await CreateModLog(msg.guild, "Temp Ban", member, msg.author, `[${durationFormatted}] ${reason}`);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `**@${client.getName(serverDocument, member)}** has been temporarily banned! ⏰🔨`,
					fields: [
						{ name: "Duration", value: durationFormatted, inline: true },
						{ name: "Unban Date", value: `<t:${Math.floor(unbanDate.getTime() / 1000)}:F>`, inline: true },
					],
				}],
			});
		} catch (err) {
			return msg.send({
				embeds: [{
					color: Colors.ERROR,
					description: "Failed to tempban the user!",
					footer: { text: err.message },
				}],
			});
		}
	});

	collector.on("end", (collected, endReason) => {
		if (endReason === "time" && collected.size === 0) {
			msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Temporary ban timed out! 😓",
				}],
			});
		}
	});
};

function formatDuration (ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);

	if (weeks > 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
	if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
	if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
	if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
	return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}
