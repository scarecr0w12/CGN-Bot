module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	const voiceChannel = msg.member.voice.channel;
	if (!voiceChannel) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ You need to be in a voice channel!",
			}],
		});
	}

	if (!client.audioManager) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ Nothing is playing right now.",
			}],
		});
	}

	const guildPlayer = client.audioManager.getPlayer(msg.guild.id);
	if (!guildPlayer) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ Nothing is playing right now.",
			}],
		});
	}

	if (guildPlayer.connection?.joinConfig?.channelId !== voiceChannel.id) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ You need to be in the same voice channel as the bot!",
			}],
		});
	}

	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];
	const action = args[0];

	if (!action) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎛️ DJ Controls",
				description: [
					"`dj pause` - Pause playback",
					"`dj resume` - Resume playback",
					"`dj stop` - Stop and clear queue",
					"`dj volume <0-200>` - Set volume",
					"`dj loop <off/track/queue>` - Set loop mode",
					"`dj shuffle` - Shuffle the queue",
					"`dj remove <position>` - Remove track from queue",
					"`dj clear` - Clear the queue",
					"`dj disconnect` - Disconnect from voice",
				].join("\n"),
			}],
		});
	}

	switch (action) {
		case "pause": {
			if (guildPlayer.isPaused) {
				return msg.send({
					embeds: [{
						color: Colors.WARN,
						description: "⏸️ Already paused.",
					}],
				});
			}
			guildPlayer.pause();
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "⏸️ Paused playback.",
				}],
			});
		}

		case "resume":
		case "unpause": {
			if (!guildPlayer.isPaused) {
				return msg.send({
					embeds: [{
						color: Colors.WARN,
						description: "▶️ Already playing.",
					}],
				});
			}
			guildPlayer.resume();
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "▶️ Resumed playback.",
				}],
			});
		}

		case "stop": {
			guildPlayer.stop();
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "⏹️ Stopped playback and cleared the queue.",
				}],
			});
		}

		case "volume":
		case "vol": {
			const vol = parseInt(args[1]);
			if (isNaN(vol) || vol < 0 || vol > 200) {
				return msg.send({
					embeds: [{
						color: Colors.INFO,
						description: `🔊 Current volume: **${guildPlayer.queue.volume}%**\nUse \`dj volume <0-200>\` to change.`,
					}],
				});
			}
			guildPlayer.setVolume(vol);
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `🔊 Volume set to **${vol}%**`,
				}],
			});
		}

		case "loop": {
			const mode = args[1];
			if (!mode || !["off", "track", "queue"].includes(mode)) {
				const currentMode = guildPlayer.queue.loop ? "track" : guildPlayer.queue.loopQueue ? "queue" : "off";
				return msg.send({
					embeds: [{
						color: Colors.INFO,
						description: `🔁 Current loop mode: **${currentMode}**\nUse \`dj loop <off/track/queue>\` to change.`,
					}],
				});
			}
			guildPlayer.queue.setLoop(mode);
			const icons = { off: "➡️", track: "🔂", queue: "🔁" };
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `${icons[mode]} Loop mode set to **${mode}**`,
				}],
			});
		}

		case "shuffle": {
			if (guildPlayer.queue.isEmpty) {
				return msg.send({
					embeds: [{
						color: Colors.WARN,
						description: "📭 Queue is empty, nothing to shuffle.",
					}],
				});
			}
			guildPlayer.queue.shuffle();
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "🔀 Queue shuffled!",
				}],
			});
		}

		case "remove": {
			const pos = parseInt(args[1]);
			if (isNaN(pos) || pos < 1) {
				return msg.sendInvalidUsage(commandData, "Please provide a valid position number.");
			}
			const removed = guildPlayer.queue.remove(pos - 1);
			if (!removed) {
				return msg.send({
					embeds: [{
						color: Colors.ERROR,
						description: "❌ Invalid position.",
					}],
				});
			}
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `🗑️ Removed **${removed.title}** from the queue.`,
				}],
			});
		}

		case "clear": {
			guildPlayer.queue.clear();
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "🗑️ Queue cleared!",
				}],
			});
		}

		case "disconnect":
		case "dc":
		case "leave": {
			guildPlayer.destroy();
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "👋 Disconnected from voice channel.",
				}],
			});
		}

		default:
			return msg.send({
				embeds: [{
					color: Colors.ERROR,
					description: `❌ Unknown action: \`${action}\`\nUse \`dj\` to see available commands.`,
				}],
			});
	}
};
