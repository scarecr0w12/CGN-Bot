const moment = require("moment");
const DurationParser = require("../../Modules/MessageUtils/DurationParser");

// In-memory storage for snooze sessions
const snoozeSessions = new Map();

module.exports = async ({ client, Constants: { Colors } }, { serverDocument, memberDocument }, msg, commandData) => {
	const args = msg.suffix?.trim().split(/\s+/) || [];
	const action = args[0]?.toLowerCase() || "";
	const key = `${msg.guild.id}:${msg.author.id}`;

	switch (action) {
		case "on":
		case "start":
		case "enable": {
			// Check if already snoozed
			if (snoozeSessions.has(key)) {
				const session = snoozeSessions.get(key);
				const remaining = moment.duration(session.endTime - Date.now()).humanize();
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `😴 You're already snoozed! ${remaining} remaining.\n\nUse \`${commandData.name} off\` to end early.`,
					}],
				});
			}

			// Parse duration
			let duration = 30 * 60 * 1000; // Default 30 minutes
			const durationArg = args.slice(1).join(" ");

			if (durationArg) {
				const parsed = DurationParser.parse(durationArg);
				if (parsed && parsed > 0) {
					// Cap at 24 hours
					duration = Math.min(parsed, 24 * 60 * 60 * 1000);
				}
			}

			// Create session
			const session = {
				startTime: Date.now(),
				endTime: Date.now() + duration,
				userId: msg.author.id,
				guildId: msg.guild.id,
				channelId: msg.channel.id,
				missedPings: [],
				timerId: null,
			};

			// Set timer to auto-end snooze
			session.timerId = setTimeout(() => {
				const s = snoozeSessions.get(key);
				if (s) {
					snoozeSessions.delete(key);

					// Notify user that snooze ended
					const channel = client.channels.cache.get(s.channelId);
					if (channel) {
						const pingCount = s.missedPings.length;
						let description = "Your snooze period has ended. You're no longer in DND mode.";

						if (pingCount > 0) {
							const uniqueChannels = [...new Set(s.missedPings.map(p => p.channelId))];
							description += `\n\n📬 **${pingCount} missed ping${pingCount === 1 ? "" : "s"}** in ${uniqueChannels.length} channel${uniqueChannels.length === 1 ? "" : "s"}`;
						}

						channel.send({
							content: `<@${s.userId}>`,
							embeds: [{
								color: Colors.INFO,
								title: "⏰ Snooze Ended",
								description,
							}],
						}).catch(() => { /* ignore */ });
					}
				}
			}, duration);

			snoozeSessions.set(key, session);

			const durationStr = moment.duration(duration).humanize();
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: `😴 Snooze Enabled`,
					description: `You're now in **Do Not Disturb** mode for ${durationStr}.\n\nI'll collect any pings you receive and show them when your snooze ends.`,
					fields: [
						{
							name: "What happens?",
							value: `• Your pings will be logged but you won't be notified\n• Use \`${commandData.name} off\` to end early\n• Use \`${commandData.name} status\` to check missed pings`,
						},
					],
					footer: { text: `Snooze ends ${moment(session.endTime).fromNow()}` },
				}],
			});
			break;
		}

		case "off":
		case "stop":
		case "disable":
		case "end": {
			if (!snoozeSessions.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `You're not currently snoozed.\n\nUse \`${commandData.name} on [duration]\` to start a snooze.`,
					}],
				});
			}

			const session = snoozeSessions.get(key);
			if (session.timerId) clearTimeout(session.timerId);
			snoozeSessions.delete(key);

			const duration = moment.duration(Date.now() - session.startTime).humanize();
			const pingCount = session.missedPings.length;

			let description = `Snooze ended after ${duration}.`;
			if (pingCount > 0) {
				const recentPings = session.missedPings.slice(-5).map(p => {
					const channel = client.channels.cache.get(p.channelId);
					return `• <#${p.channelId}> from <@${p.authorId}> (${moment(p.timestamp).fromNow()})`;
				}).join("\n");

				description += `\n\n📬 **${pingCount} missed ping${pingCount === 1 ? "" : "s"}:**\n${recentPings}`;
				if (pingCount > 5) {
					description += `\n*...and ${pingCount - 5} more*`;
				}
			} else {
				description += "\n\n✨ No missed pings!";
			}

			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "⏰ Snooze Ended",
					description,
				}],
			});
			break;
		}

		case "status":
		case "check": {
			if (!snoozeSessions.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.INFO,
						description: `You're not currently snoozed.\n\nUse \`${commandData.name} on [duration]\` to start a snooze.`,
					}],
				});
			}

			const session = snoozeSessions.get(key);
			const remaining = moment.duration(session.endTime - Date.now()).humanize();
			const elapsed = moment.duration(Date.now() - session.startTime).humanize();
			const pingCount = session.missedPings.length;

			const fields = [
				{ name: "⏱️ Time Remaining", value: remaining, inline: true },
				{ name: "⏳ Elapsed", value: elapsed, inline: true },
				{ name: "📬 Missed Pings", value: `${pingCount}`, inline: true },
			];

			if (pingCount > 0) {
				const recentPings = session.missedPings.slice(-3).map(p => `<#${p.channelId}> from <@${p.authorId}>`).join("\n");
				fields.push({ name: "Recent Pings", value: recentPings });
			}

			msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "😴 Snooze Status",
					fields,
					footer: { text: `Snooze ends ${moment(session.endTime).fromNow()}` },
				}],
			});
			break;
		}

		case "help":
		default: {
			if (action && action !== "help") {
				// Try to parse as duration for shorthand
				const parsed = DurationParser.parse(msg.suffix);
				if (parsed && parsed > 0) {
					// Redirect to "on" with duration
					msg.suffix = `on ${msg.suffix}`;
					return module.exports({ client, Constants: { Colors } }, { serverDocument, memberDocument }, msg, commandData);
				}
			}

			msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "😴 Snooze - Do Not Disturb",
					description: "Temporarily mute pings and collect them for later review.",
					fields: [
						{
							name: "Commands",
							value: [
								`\`${commandData.name} on [duration]\` - Start snooze (default: 30 min)`,
								`\`${commandData.name} off\` - End snooze early`,
								`\`${commandData.name} status\` - Check status and missed pings`,
								`\`${commandData.name} 1h\` - Quick snooze for 1 hour`,
							].join("\n"),
						},
						{
							name: "Duration Examples",
							value: "`30m`, `1h`, `2 hours`, `90 minutes`",
						},
					],
					footer: { text: "Maximum snooze duration: 24 hours" },
				}],
			});
		}
	}
};

// Export the sessions map for the message handler to check
module.exports.snoozeSessions = snoozeSessions;

// Helper function to log a ping for a snoozed user
module.exports.logPing = (guildId, userId, channelId, authorId) => {
	const key = `${guildId}:${userId}`;
	const session = snoozeSessions.get(key);
	if (session) {
		session.missedPings.push({
			channelId,
			authorId,
			timestamp: Date.now(),
		});
		// Cap at 100 missed pings
		if (session.missedPings.length > 100) {
			session.missedPings.shift();
		}
		return true;
	}
	return false;
};

// Helper to check if user is snoozed
module.exports.isSnoozed = (guildId, userId) => snoozeSessions.has(`${guildId}:${userId}`);
