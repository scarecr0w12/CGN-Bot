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
	if (!guildPlayer || !guildPlayer.isPlaying) {
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

	const currentTrack = guildPlayer.queue.currentTrack;
	guildPlayer.skip();

	return msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			description: `⏭️ Skipped **${currentTrack?.title || "current track"}**`,
		}],
	});
};
