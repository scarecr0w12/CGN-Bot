const TierManager = require("../../Modules/TierManager");

module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	const hasTier2 = await TierManager.hasMinimumTierLevel(msg.guild.id, 2);
	if (!hasTier2) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				title: "🔒 Premium Feature",
				description: "Music commands require **Tier 2 (Premium)** subscription.",
			}],
		});
	}

	if (!client.audioManager) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "📭 The queue is empty.",
			}],
		});
	}

	const guildPlayer = client.audioManager.getPlayer(msg.guild.id);
	if (!guildPlayer) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "📭 The queue is empty.",
			}],
		});
	}

	const currentTrack = guildPlayer.queue.currentTrack;
	const page = parseInt(msg.suffix) || 1;
	const { tracks, totalPages, total } = guildPlayer.queue.getPage(page, 10);

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
		const loopIcon = guildPlayer.queue.loop ? "🔂" : guildPlayer.queue.loopQueue ? "🔁" : "";
		const pauseIcon = guildPlayer.isPaused ? "⏸️" : "▶️";
		description += `**${pauseIcon} Now Playing ${loopIcon}**\n`;
		description += `[${currentTrack.title}](${currentTrack.url}) - \`${currentTrack.durationFormatted}\`\n\n`;
	}

	if (tracks.length > 0) {
		description += "**📋 Up Next:**\n";
		const startIndex = (page - 1) * 10;
		tracks.forEach((track, index) => {
			description += `\`${startIndex + index + 1}.\` [${track.title}](${track.url}) - \`${track.durationFormatted}\`\n`;
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
				text: `Page ${page}/${totalPages} • ${total} tracks • Total: ${formatDuration(guildPlayer.queue.totalDuration)} • Volume: ${guildPlayer.queue.volume}%`,
			},
		}],
	});
};
