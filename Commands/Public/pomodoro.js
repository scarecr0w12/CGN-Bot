const moment = require("moment");

// In-memory storage for active pomodoro sessions
const activeSessions = new Map();

const getKey = (guildId, userId) => `${guildId}:${userId}`;

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const SESSIONS_BEFORE_LONG_BREAK = 4;

const formatTime = ms => {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const getProgressBar = (elapsed, total, length = 10) => {
	const progress = Math.min(elapsed / total, 1);
	const filled = Math.round(progress * length);
	const empty = length - filled;
	return "█".repeat(filled) + "░".repeat(empty);
};

module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	const key = getKey(msg.guild.id, msg.author.id);
	const args = msg.suffix?.toLowerCase().trim().split(/\s+/) || [];
	const action = args[0] || "";

	switch (action) {
		case "start": {
			if (activeSessions.has(key)) {
				const existing = activeSessions.get(key);
				if (existing.active) {
					return msg.send({
						embeds: [{
							color: Colors.SOFT_ERR,
							description: `🍅 You already have an active Pomodoro session! Use \`${commandData.name} stop\` to end it first.`,
						}],
					});
				}
			}

			let workMinutes = DEFAULT_WORK_MINUTES;
			let breakMinutes = DEFAULT_BREAK_MINUTES;

			if (args[1] && !isNaN(parseInt(args[1]))) {
				workMinutes = Math.max(1, Math.min(120, parseInt(args[1])));
			}
			if (args[2] && !isNaN(parseInt(args[2]))) {
				breakMinutes = Math.max(1, Math.min(60, parseInt(args[2])));
			}

			const session = {
				active: true,
				phase: "work",
				startTime: Date.now(),
				workDuration: workMinutes * 60 * 1000,
				breakDuration: breakMinutes * 60 * 1000,
				longBreakDuration: DEFAULT_LONG_BREAK_MINUTES * 60 * 1000,
				completedSessions: 0,
				totalWorkTime: 0,
				channelId: msg.channel.id,
				userId: msg.author.id,
				timerId: null,
			};

			// Set up timer for phase completion
			const checkPhase = () => {
				const s = activeSessions.get(key);
				if (!s || !s.active) return;

				const elapsed = Date.now() - s.startTime;
				const isLongBreakTime = s.completedSessions % SESSIONS_BEFORE_LONG_BREAK === 0 && s.completedSessions > 0;
				const duration = s.phase === "work" ? s.workDuration : isLongBreakTime ? s.longBreakDuration : s.breakDuration;

				if (elapsed >= duration) {
					if (s.phase === "work") {
						s.completedSessions++;
						s.totalWorkTime += s.workDuration;
						const isLongBreak = s.completedSessions % SESSIONS_BEFORE_LONG_BREAK === 0;
						s.phase = "break";
						s.startTime = Date.now();

						const channel = client.channels.cache.get(s.channelId);
						if (channel) {
							channel.send({
								content: `<@${s.userId}>`,
								embeds: [{
									color: Colors.SUCCESS,
									title: isLongBreak ? "🎉 Long Break Time!" : "☕ Break Time!",
									description: `Great work! You completed session #${s.completedSessions}.\n\n**${isLongBreak ? "Long break" : "Break"}:** ${formatTime(isLongBreak ? s.longBreakDuration : s.breakDuration)} remaining`,
									footer: { text: `Use "${commandData.name} skip" to skip break, or "stop" to end` },
								}],
							});
						}
					} else {
						s.phase = "work";
						s.startTime = Date.now();

						const channel = client.channels.cache.get(s.channelId);
						if (channel) {
							channel.send({
								content: `<@${s.userId}>`,
								embeds: [{
									color: Colors.INFO,
									title: "🍅 Back to Work!",
									description: `Break's over! Starting session #${s.completedSessions + 1}.\n\n**Work time:** ${formatTime(s.workDuration)} remaining`,
								}],
							});
						}
					}
				}

				if (s.active) {
					s.timerId = setTimeout(checkPhase, 30000);
				}
			};

			session.timerId = setTimeout(checkPhase, 30000);
			activeSessions.set(key, session);

			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "🍅 Pomodoro Started!",
					description: `**Work Session #1** has begun!\n\n⏱️ **Duration:** ${workMinutes} minutes work / ${breakMinutes} minutes break`,
					fields: [
						{ name: "📋 How it works", value: `• Focus for ${workMinutes} minutes\n• Take a ${breakMinutes} minute break\n• Every ${SESSIONS_BEFORE_LONG_BREAK} sessions, take a longer break`, inline: false },
					],
					footer: { text: `Use "${commandData.name} status" to check progress` },
				}],
			});
			break;
		}

		case "stop": {
			if (!activeSessions.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `🍅 You don't have an active Pomodoro session! Use \`${commandData.name} start\` to begin.`,
					}],
				});
			}

			const session = activeSessions.get(key);
			if (session.timerId) clearTimeout(session.timerId);

			const totalTime = session.totalWorkTime + (session.phase === "work" ? Date.now() - session.startTime : 0);

			activeSessions.delete(key);

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "🍅 Pomodoro Session Ended",
					fields: [
						{ name: "✅ Completed Sessions", value: `${session.completedSessions}`, inline: true },
						{ name: "⏱️ Total Work Time", value: moment.duration(totalTime).humanize(), inline: true },
					],
					footer: { text: "Great job! Take a well-deserved rest." },
				}],
			});
			break;
		}

		case "skip": {
			if (!activeSessions.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `🍅 You don't have an active Pomodoro session!`,
					}],
				});
			}

			const session = activeSessions.get(key);

			if (session.phase === "work") {
				session.completedSessions++;
				session.totalWorkTime += Date.now() - session.startTime;
				session.phase = "break";
				session.startTime = Date.now();

				msg.send({
					embeds: [{
						color: Colors.INFO,
						title: "⏭️ Work Session Skipped",
						description: `Skipped to break time. Session #${session.completedSessions} marked as complete.\n\n**Break:** ${formatTime(session.breakDuration)} remaining`,
					}],
				});
			} else {
				session.phase = "work";
				session.startTime = Date.now();

				msg.send({
					embeds: [{
						color: Colors.INFO,
						title: "⏭️ Break Skipped",
						description: `Back to work! Starting session #${session.completedSessions + 1}.\n\n**Work time:** ${formatTime(session.workDuration)} remaining`,
					}],
				});
			}
			break;
		}

		case "status":
		case "check":
		case "": {
			if (!activeSessions.has(key)) {
				return msg.send({
					embeds: [{
						color: Colors.INFO,
						title: "🍅 Pomodoro Timer",
						description: "The Pomodoro Technique helps you stay focused by breaking work into intervals.",
						fields: [
							{
								name: "How to Use",
								value: [
									`\`${commandData.name} start [work] [break]\` - Start a session (default: 25/5 min)`,
									`\`${commandData.name} status\` - Check current progress`,
									`\`${commandData.name} skip\` - Skip current phase`,
									`\`${commandData.name} stop\` - End the session`,
								].join("\n"),
							},
							{
								name: "Example",
								value: `\`${commandData.name} start 30 10\` - 30 min work, 10 min break`,
							},
						],
					}],
				});
			}

			const session = activeSessions.get(key);
			const elapsed = Date.now() - session.startTime;
			const isLongBreakTime = session.completedSessions % SESSIONS_BEFORE_LONG_BREAK === 0 && session.completedSessions > 0;
			const duration = session.phase === "work" ? session.workDuration : isLongBreakTime ? session.longBreakDuration : session.breakDuration;
			const remaining = Math.max(0, duration - elapsed);
			const progressBar = getProgressBar(elapsed, duration, 15);

			const phaseEmoji = session.phase === "work" ? "🍅" : "☕";
			const phaseTitle = session.phase === "work" ? `Work Session #${session.completedSessions + 1}` : "Break Time";

			msg.send({
				embeds: [{
					color: session.phase === "work" ? Colors.INFO : Colors.SUCCESS,
					title: `${phaseEmoji} ${phaseTitle}`,
					description: `\`${progressBar}\` **${formatTime(remaining)}** remaining`,
					fields: [
						{ name: "✅ Completed", value: `${session.completedSessions} sessions`, inline: true },
						{ name: "⏱️ Total Work", value: moment.duration(session.totalWorkTime).humanize(), inline: true },
						{ name: "🔄 Next", value: session.phase === "work" ? "Break" : "Work", inline: true },
					],
				}],
			});
			break;
		}

		default: {
			msg.sendInvalidUsage(commandData, "Unknown action!", `Valid actions: start, stop, skip, status`);
		}
	}
};
