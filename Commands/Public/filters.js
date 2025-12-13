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

	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];
	const filter = args[0];

	const availableFilters = {
		bassboost: { name: "Bass Boost", emoji: "🔊" },
		nightcore: { name: "Nightcore", emoji: "🌙" },
		vaporwave: { name: "Vaporwave", emoji: "🌊" },
		"8d": { name: "8D Audio", emoji: "🎧" },
	};

	if (!filter) {
		const currentFilters = Object.entries(guildPlayer.queue.filters)
			.filter(([_, enabled]) => enabled)
			.map(([name]) => availableFilters[name]?.name || name);

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎚️ Audio Filters",
				description: [
					"**Available Filters:**",
					...Object.entries(availableFilters).map(([key, { name, emoji }]) => {
						const status = guildPlayer.queue.filters[key] ? "✅" : "❌";
						return `${emoji} ${name} - ${status} (\`filters ${key}\`)`;
					}),
					"",
					`**Active:** ${currentFilters.length ? currentFilters.join(", ") : "None"}`,
					"",
					"*Note: Filter changes apply to the next track.*",
				].join("\n"),
			}],
		});
	}

	if (!availableFilters[filter]) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: `❌ Unknown filter: \`${filter}\`\nAvailable: ${Object.keys(availableFilters).join(", ")}`,
			}],
		});
	}

	const currentState = guildPlayer.queue.filters[filter];
	guildPlayer.queue.setFilter(filter, !currentState);

	const { name, emoji } = availableFilters[filter];
	return msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			description: `${emoji} **${name}** ${!currentState ? "enabled" : "disabled"}!\n*Changes will apply to the next track.*`,
		}],
	});
};
