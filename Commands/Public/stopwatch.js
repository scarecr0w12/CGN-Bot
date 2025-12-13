const moment = require("moment");

// In-memory storage for active stopwatches (per user per guild)
const activeStopwatches = new Map();

const getKey = (guildId, userId) => `${guildId}:${userId}`;

const formatDuration = ms => {
	const duration = moment.duration(ms);
	const hours = Math.floor(duration.asHours());
	const minutes = duration.minutes();
	const seconds = duration.seconds();
	const milliseconds = Math.floor(duration.milliseconds() / 10);

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}`;
	} else if (minutes > 0) {
		return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}`;
	}
	return `${seconds}.${String(milliseconds).padStart(2, "0")}s`;
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	const key = getKey(msg.guild.id, msg.author.id);
	const action = msg.suffix?.toLowerCase().trim().split(/\s+/)[0] || "";

	switch (action) {
		case "start": {
			if (activeStopwatches.has(key)) {
				const existing = activeStopwatches.get(key);
				if (!existing.paused) {
					return msg.send({
						embeds: [{
							color: Colors.SOFT_ERR,
							description: `⏱️ You already have a stopwatch running! Use \`${commandData.name} stop\` to stop it first.`,
						}],
					});
				}
			}
			activeStopwatches.set(key, {
				startTime: Date.now(),
				elapsed: 0,
				paused: false,
				laps: [],
			});
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "⏱️ Stopwatch Started!",
					description: "Your stopwatch is now running.",
					footer: { text: `Use "${commandData.name} stop" to stop, "lap" to record a lap, or "pause" to pause` },
				}],
			});
			break;
		}

		case "stop": {
			if (!activeStopwatches.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ You don't have a stopwatch running! Use \`${commandData.name} start\` to start one.`,
					}],
				});
			}
			const sw = activeStopwatches.get(key);
			const totalElapsed = sw.paused ? sw.elapsed : sw.elapsed + (Date.now() - sw.startTime);
			const fields = [];

			if (sw.laps.length > 0) {
				const lapText = sw.laps.map((lap, i) => `**Lap ${i + 1}:** ${formatDuration(lap)}`).join("\n");
				fields.push({ name: "🏁 Laps", value: lapText.slice(0, 1024) });
			}

			activeStopwatches.delete(key);
			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "⏱️ Stopwatch Stopped!",
					description: `**Final Time:** \`${formatDuration(totalElapsed)}\``,
					fields,
				}],
			});
			break;
		}

		case "lap": {
			if (!activeStopwatches.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ You don't have a stopwatch running! Use \`${commandData.name} start\` to start one.`,
					}],
				});
			}
			const sw = activeStopwatches.get(key);
			if (sw.paused) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ Your stopwatch is paused! Resume it first with \`${commandData.name} resume\`.`,
					}],
				});
			}
			const currentElapsed = sw.elapsed + (Date.now() - sw.startTime);
			sw.laps.push(currentElapsed);

			if (sw.laps.length > 50) sw.laps.shift();

			msg.send({
				embeds: [{
					color: Colors.INFO,
					description: `🏁 **Lap ${sw.laps.length}:** \`${formatDuration(currentElapsed)}\``,
				}],
			});
			break;
		}

		case "pause": {
			if (!activeStopwatches.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ You don't have a stopwatch running! Use \`${commandData.name} start\` to start one.`,
					}],
				});
			}
			const sw = activeStopwatches.get(key);
			if (sw.paused) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ Your stopwatch is already paused! Use \`${commandData.name} resume\` to continue.`,
					}],
				});
			}
			sw.elapsed += Date.now() - sw.startTime;
			sw.paused = true;
			msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "⏸️ Stopwatch Paused",
					description: `**Current Time:** \`${formatDuration(sw.elapsed)}\``,
					footer: { text: `Use "${commandData.name} resume" to continue` },
				}],
			});
			break;
		}

		case "resume": {
			if (!activeStopwatches.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ You don't have a stopwatch running! Use \`${commandData.name} start\` to start one.`,
					}],
				});
			}
			const sw = activeStopwatches.get(key);
			if (!sw.paused) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `⏱️ Your stopwatch is already running!`,
					}],
				});
			}
			sw.startTime = Date.now();
			sw.paused = false;
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "▶️ Stopwatch Resumed",
					description: `Continuing from \`${formatDuration(sw.elapsed)}\``,
				}],
			});
			break;
		}

		case "reset": {
			if (activeStopwatches.has(key)) {
				activeStopwatches.delete(key);
			}
			activeStopwatches.set(key, {
				startTime: Date.now(),
				elapsed: 0,
				paused: false,
				laps: [],
			});
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "🔄 Stopwatch Reset!",
					description: "Your stopwatch has been reset and started fresh.",
				}],
			});
			break;
		}

		case "status":
		case "check":
		case "": {
			if (!activeStopwatches.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.INFO,
						title: "⏱️ Stopwatch",
						description: `You don't have an active stopwatch.\n\nUse \`${commandData.name} start\` to begin timing!`,
						fields: [
							{
								name: "Available Commands",
								value: [
									`\`${commandData.name} start\` - Start a new stopwatch`,
									`\`${commandData.name} stop\` - Stop and show final time`,
									`\`${commandData.name} lap\` - Record a lap time`,
									`\`${commandData.name} pause\` - Pause the stopwatch`,
									`\`${commandData.name} resume\` - Resume a paused stopwatch`,
									`\`${commandData.name} reset\` - Reset and start fresh`,
								].join("\n"),
							},
						],
					}],
				});
			}
			const sw = activeStopwatches.get(key);
			const currentElapsed = sw.paused ? sw.elapsed : sw.elapsed + (Date.now() - sw.startTime);
			const fields = [];

			if (sw.laps.length > 0) {
				const recentLaps = sw.laps.slice(-5).map((lap, i) => `**Lap ${sw.laps.length - 4 + i}:** ${formatDuration(lap)}`).join("\n");
				fields.push({ name: `🏁 Recent Laps (${sw.laps.length} total)`, value: recentLaps });
			}

			msg.send({
				embeds: [{
					color: sw.paused ? Colors.SOFT_ERR : Colors.SUCCESS,
					title: `⏱️ Stopwatch ${sw.paused ? "(Paused)" : "(Running)"}`,
					description: `**Current Time:** \`${formatDuration(currentElapsed)}\``,
					fields,
				}],
			});
			break;
		}

		default: {
			msg.sendInvalidUsage(commandData, "Unknown action!", `Valid actions: start, stop, lap, pause, resume, reset, status`);
		}
	}
};
