const TierManager = require("../../Modules/TierManager");
const { ChannelType } = require("discord.js");

module.exports = async ({ client, Constants: { Colors, Text } }, documents, msg, commandData) => {
	const hasTier2 = await TierManager.hasMinimumTierLevel(msg.guild.id, 2);
	if (!hasTier2) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				title: "🔒 Premium Feature",
				description: "Music commands require **Tier 2 (Premium)** subscription.\nUpgrade your server to unlock music playback!",
			}],
		});
	}

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

	if (!client.audioManager) {
		const AudioManager = require("../../Internals/Audio/AudioManager");
		client.audioManager = new AudioManager(client);
	}

	const loadingMsg = await msg.send({
		embeds: [{
			color: Colors.INFO,
			description: "🔍 Searching for your song...",
		}],
	});

	try {
		const tracks = await client.audioManager.search(msg.suffix, msg.author.id);

		if (!tracks || tracks.length === 0) {
			return loadingMsg.edit({
				embeds: [{
					color: Colors.ERROR,
					description: "❌ No results found for your query.",
				}],
			});
		}

		const guildPlayer = client.audioManager.createPlayer(msg.guild.id);

		try {
			await guildPlayer.connect(voiceChannel, msg.channel);
		} catch (err) {
			return loadingMsg.edit({
				embeds: [{
					color: Colors.ERROR,
					description: "❌ Failed to connect to the voice channel.",
				}],
			});
		}

		const isPlaylist = tracks.length > 1;
		const wasEmpty = guildPlayer.queue.isEmpty && !guildPlayer.isPlaying;

		for (const track of tracks) {
			guildPlayer.queue.add(track);
		}

		if (wasEmpty) {
			guildPlayer.play();
		}

		if (isPlaylist) {
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
		const position = guildPlayer.queue.size;

		return loadingMsg.edit({
			embeds: [{
				color: Colors.SUCCESS,
				title: wasEmpty ? "🎵 Now Playing" : "🎵 Added to Queue",
				description: `[${track.title}](${track.url})`,
				thumbnail: track.thumbnail ? { url: track.thumbnail } : undefined,
				fields: [
					{ name: "Duration", value: track.durationFormatted, inline: true },
					{ name: "Position", value: wasEmpty ? "Now" : `#${position}`, inline: true },
				],
				footer: { text: `Requested by ${msg.author.tag}` },
			}],
		});
	} catch (error) {
		logger.error("Play command error", { guildId: msg.guild.id }, error);
		return loadingMsg.edit({
			embeds: [{
				color: Colors.ERROR,
				description: "❌ An error occurred while searching for your song.",
			}],
		});
	}
};
