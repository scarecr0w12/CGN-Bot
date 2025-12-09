const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("games")
		.setDescription("Show the most played games on the server"),

	async execute (interaction) {
		const members = interaction.guild.members.cache;
		const games = {};

		members.forEach(member => {
			if (member.presence && member.presence.activities) {
				member.presence.activities.forEach(activity => {
					// Activity type 0 = Playing
					if (activity.type === 0) {
						games[activity.name] = (games[activity.name] || 0) + 1;
					}
				});
			}
		});

		const sorted = Object.entries(games)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10);

		if (sorted.length === 0) {
			return interaction.reply({
				content: "No one is playing any games right now!",
				ephemeral: true,
			});
		}

		const leaderboard = sorted.map(([game, count], i) => {
			const medals = ["🥇", "🥈", "🥉"];
			const prefix = medals[i] || `**${i + 1}.**`;
			return `${prefix} ${game} - ${count} player${count !== 1 ? "s" : ""}`;
		}).join("\n");

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "🎮 Most Played Games",
				description: leaderboard,
				footer: { text: `Top ${sorted.length} games being played right now` },
			}],
		});
	},
};
