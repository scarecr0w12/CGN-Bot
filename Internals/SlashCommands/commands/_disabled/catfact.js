const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("catfact")
		.setDescription("Get random cat facts! 🐱"),

	async execute (interaction) {
		await interaction.deferReply();

		try {
			const response = await fetch("https://catfact.ninja/fact");
			const data = await response.json();

			if (!data || !data.fact) {
				return interaction.editReply("Couldn't find a cat fact!");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🐱 Cat Fact",
					description: data.fact,
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch a cat fact!");
		}
	},
};
