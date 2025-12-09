const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Check bot latency"),

	async execute (interaction, client) {
		const sent = await interaction.reply({
			content: "Pinging...",
			fetchReply: true,
		});

		const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
		const wsLatency = Math.round(client.ws.ping);

		await interaction.editReply({
			content: null,
			embeds: [{
				color: 0x3669FA,
				title: "🏓 Pong!",
				fields: [
					{ name: "Roundtrip", value: `${roundtrip}ms`, inline: true },
					{ name: "WebSocket", value: `${wsLatency}ms`, inline: true },
				],
			}],
		});
	},
};
