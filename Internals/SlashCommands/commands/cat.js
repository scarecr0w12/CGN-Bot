const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("cat")
		.setDescription("Get a random cat picture! 🐱"),

	async execute (interaction) {
		await interaction.deferReply();

		try {
			const response = await fetch("https://api.thecatapi.com/v1/images/search");
			const data = await response.json();

			if (!data || !data[0]) {
				return interaction.editReply("Couldn't find a cat! 😿");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🐱 Random Cat",
					image: { url: data[0].url },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch a cat picture!");
		}
	},
};
