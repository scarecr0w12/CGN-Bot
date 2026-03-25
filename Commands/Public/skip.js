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

	if (!client.lavalink) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ Nothing is playing right now.",
			}],
		});
	}

	const guildPlayer = client.lavalink.getPlayer(msg.guild.id);
	if (!guildPlayer || !guildPlayer.playing) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ Nothing is playing right now.",
			}],
		});
	}

	if (guildPlayer.voiceChannel !== voiceChannel.id) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ You need to be in the same voice channel as the bot!",
			}],
		});
	}

	const currentTrack = guildPlayer.queue.current;
	guildPlayer.stop();

	return msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			description: `⏭️ Skipped **${currentTrack?.title || "current track"}**`,
		}],
	});
};
