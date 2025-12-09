const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("messages")
		.setDescription("View message leaderboard"),

	async execute (interaction, client, serverDocument) {
		const sortedMembers = serverDocument.members
			.filter(m => m.messages && m.messages > 0)
			.sort((a, b) => (b.messages || 0) - (a.messages || 0))
			.slice(0, 10);

		if (sortedMembers.length === 0) {
			return interaction.reply({
				content: "No message data yet!",
				ephemeral: true,
			});
		}

		const leaderboard = sortedMembers.map((m, i) => {
			const medals = ["🥇", "🥈", "🥉"];
			const prefix = medals[i] || `**${i + 1}.**`;
			return `${prefix} <@${m._id}> - ${m.messages.toLocaleString()} messages`;
		}).join("\n");

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "💬 Message Leaderboard",
				description: leaderboard,
				footer: { text: `Top ${sortedMembers.length} members` },
			}],
		});
	},
};
