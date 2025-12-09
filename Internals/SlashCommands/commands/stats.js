const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("View server statistics"),

	async execute (interaction, client, serverDocument) {
		const members = serverDocument.members || [];

		// Calculate statistics
		const totalMessages = members.reduce((sum, m) => sum + (m.messages || 0), 0);
		const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);
		const activeMembers = members.filter(m => (m.messages || 0) > 0).length;

		// Top member by messages
		const topByMessages = members
			.filter(m => m.messages && m.messages > 0)
			.sort((a, b) => (b.messages || 0) - (a.messages || 0))[0];

		// Top member by points
		const topByPoints = members
			.filter(m => m.points && m.points > 0)
			.sort((a, b) => (b.points || 0) - (a.points || 0))[0];

		const fields = [
			{ name: "📊 Total Messages", value: `${totalMessages.toLocaleString()}`, inline: true },
			{ name: "⭐ Total Points", value: `${totalPoints.toLocaleString()}`, inline: true },
			{ name: "👥 Active Members", value: `${activeMembers}`, inline: true },
		];

		if (topByMessages) {
			fields.push({
				name: "💬 Most Messages",
				value: `<@${topByMessages._id}> (${topByMessages.messages})`,
				inline: true,
			});
		}

		if (topByPoints) {
			fields.push({
				name: "🏆 Most Points",
				value: `<@${topByPoints._id}> (${topByPoints.points})`,
				inline: true,
			});
		}

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `📈 ${interaction.guild.name} Statistics`,
				fields,
				footer: { text: "Server activity statistics" },
			}],
		});
	},
};
