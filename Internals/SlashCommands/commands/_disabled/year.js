const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("year")
		.setDescription("See how much time is left until New Year!"),

	async execute (interaction) {
		const now = new Date();
		const nextYear = new Date(now.getFullYear() + 1, 0, 1);
		const diff = nextYear - now;

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		const yearProgress = ((now - new Date(now.getFullYear(), 0, 1)) / (nextYear - new Date(now.getFullYear(), 0, 1))) * 100;

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: `🎉 Time until ${now.getFullYear() + 1}`,
				description: `**${days}** days, **${hours}** hours, **${minutes}** minutes, **${seconds}** seconds`,
				fields: [
					{ name: "Year Progress", value: `${yearProgress.toFixed(2)}%`, inline: true },
				],
				footer: { text: "Happy New Year! 🎆" },
			}],
		});
	},
};
