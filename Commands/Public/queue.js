module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	if (!client.lavalink) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "📭 The queue is empty.",
			}],
		});
	}

	const guildPlayer = client.lavalink.getPlayer(msg.guild.id);
	if (!guildPlayer) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "📭 The queue is empty.",
			}],
		});
	}

	const currentTrack = guildPlayer.queue.current;
	const page = parseInt(msg.suffix) || 1;
	const perPage = 10;
	const start = (page - 1) * perPage;
	const tracks = guildPlayer.queue.slice(start, start + perPage);
	const totalPages = Math.ceil(guildPlayer.queue.size / perPage) || 1;
	const total = guildPlayer.queue.size;

	if (!currentTrack && tracks.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "📭 The queue is empty.",
			}],
		});
	}

	let description = "";

	if (currentTrack) {
		const loopIcon = guildPlayer.trackRepeat ? "🔂" : guildPlayer.queueRepeat ? "🔁" : "";
		const pauseIcon = guildPlayer.paused ? "⏸️" : "▶️";
		description += `**${pauseIcon} Now Playing ${loopIcon}**\n`;
		description += `[${currentTrack.title}](${currentTrack.uri}) - \`${client.lavalink.formatDuration(currentTrack.duration)}\`\n\n`;
	}

	if (tracks.length > 0) {
		description += "**📋 Up Next:**\n";
		const startIndex = (page - 1) * 10;
		tracks.forEach((track, index) => {
			description += `\`${startIndex + index + 1}.\` [${track.title}](${track.uri}) - \`${client.lavalink.formatDuration(track.duration)}\`\n`;
		});
	}

	const formatDuration = seconds => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	return msg.send({
		embeds: [{
			color: Colors.INFO,
			title: `🎵 Music Queue - ${msg.guild.name}`,
			description: description,
			footer: {
				text: `Page ${page}/${totalPages} • ${total} tracks • Volume: ${guildPlayer.volume}%`,
			},
		}],
	});
};
