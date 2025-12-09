const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("ranks")
		.setDescription("View server ranks and leaderboard"),

	async execute (interaction, client, serverDocument) {
		const sortedMembers = serverDocument.members
			.filter(m => m.points && m.points > 0)
			.sort((a, b) => (b.points || 0) - (a.points || 0))
			.slice(0, 10);

		if (sortedMembers.length === 0) {
			return interaction.reply({
				content: "No members with points yet!",
				ephemeral: true,
			});
		}

		const leaderboard = sortedMembers.map((m, i) => {
			const medals = ["🥇", "🥈", "🥉"];
			const prefix = medals[i] || `**${i + 1}.**`;
			return `${prefix} <@${m._id}> - ${m.points} points`;
		}).join("\n");

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "🏆 Server Leaderboard",
				description: leaderboard,
				footer: { text: `Top ${sortedMembers.length} members` },
			}],
		});
	},
};
