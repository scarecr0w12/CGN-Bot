const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("roll")
		.setDescription("Roll a die or generate a random number")
		.addIntegerOption(opt =>
			opt.setName("max")
				.setDescription("Maximum number (default: 6)")
				.setMinValue(1)
				.setRequired(false),
		)
		.addIntegerOption(opt =>
			opt.setName("min")
				.setDescription("Minimum number (default: 1)")
				.setMinValue(0)
				.setRequired(false),
		),

	async execute (interaction) {
		const max = interaction.options.getInteger("max") || 6;
		const min = interaction.options.getInteger("min") || 1;

		if (min >= max) {
			return interaction.reply({
				content: "Minimum must be less than maximum!",
				ephemeral: true,
			});
		}

		const result = Math.floor(Math.random() * (max - min + 1)) + min;

		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "🎲 Dice Roll",
				description: `**${result}**`,
				footer: { text: `Range: ${min} - ${max}` },
			}],
		});
	},
};
