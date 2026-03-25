const { ChannelType } = require("discord.js");

module.exports = async ({ client, Constants: { Colors, Text } }, documents, msg, commandData) => {
	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Please provide a song name or URL to play.");
	}

	const voiceChannel = msg.member.voice.channel;
	if (!voiceChannel) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ You need to be in a voice channel to use this command!",
			}],
		});
	}

	if (voiceChannel.type !== ChannelType.GuildVoice && voiceChannel.type !== ChannelType.GuildStageVoice) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ Please join a valid voice channel!",
			}],
		});
	}

	const permissions = voiceChannel.permissionsFor(client.user);
	if (!permissions.has("Connect") || !permissions.has("Speak")) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ I need permissions to connect and speak in your voice channel!",
			}],
		});
	}

	if (!client.lavalink || !client.lavalink.hasAvailableNodes || !client.lavalink.hasAvailableNodes()) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ Audio system is reconnecting. Please try again in a few seconds.",
			}],
		});
	}

	const loadingMsg = await msg.send({
		embeds: [{
			color: Colors.INFO,
			description: "🔍 Searching for your song...",
		}],
	});

	try {
		if (!client.lavalink.hasAvailableNodes || !client.lavalink.hasAvailableNodes()) {
			return loadingMsg.edit({
				embeds: [{
					color: Colors.ERROR,
					description: "❌ Audio system is reconnecting. Please try again in a few seconds.",
				}],
			});
		}

		const tracks = await client.lavalink.search(msg.suffix, msg.author.id);

		if (!tracks || tracks.length === 0) {
			return loadingMsg.edit({
				embeds: [{
					color: Colors.ERROR,
					description: "❌ No results found for your query.",
				}],
			});
		}

		const player = client.lavalink.createPlayer(msg.guild.id, voiceChannel, msg.channel);

		// Connect to voice channel if not connected
		if (player.state !== "CONNECTED") {
			player.connect();
		}

		const wasEmpty = player.queue.size === 0 && !player.playing;

		// Add tracks to queue
		if (tracks.length === 1) {
			player.queue.add(tracks[0]);
		} else {
			player.queue.add(tracks);
		}

		// Start playing if queue was empty
		if (!player.playing && !player.paused && wasEmpty) {
			player.play();
		}

		// Handle response
		if (tracks.length > 1) {
			return loadingMsg.edit({
				embeds: [{
					color: Colors.SUCCESS,
					title: "📋 Playlist Added",
					description: `Added **${tracks.length}** tracks to the queue!`,
					footer: { text: `Requested by ${msg.author.tag}` },
				}],
			});
		}

		const track = tracks[0];
		const position = player.queue.size;

		return loadingMsg.edit({
			embeds: [{
				color: Colors.SUCCESS,
				title: wasEmpty ? "🎵 Now Playing" : "🎵 Added to Queue",
				description: `[${track.title}](${track.uri})`,
				thumbnail: track.thumbnail ? { url: track.thumbnail } : undefined,
				fields: [
					{ name: "Duration", value: client.lavalink.formatDuration(track.duration), inline: true },
					{ name: "Position", value: wasEmpty ? "Now" : `#${position}`, inline: true },
				],
				footer: { text: `Requested by ${msg.author.tag}` },
			}],
		});
	} catch (error) {
		logger.error("Play command error", { guildId: msg.guild.id }, error);

		if (error && typeof error.message === "string" && error.message.toLowerCase().includes("no available nodes")) {
			return loadingMsg.edit({
				embeds: [{
					color: Colors.ERROR,
					description: "❌ Audio system is offline (no Lavalink nodes available). Please try again shortly.",
				}],
			});
		}

		return loadingMsg.edit({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ An error occurred while searching for your song.",
			}],
		});
	}
};
