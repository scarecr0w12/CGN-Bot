const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("dog")
		.setDescription("Get a random dog picture! 🐕"),

	async execute (interaction) {
		await interaction.deferReply();

		try {
			const response = await fetch("https://dog.ceo/api/breeds/image/random");
			const data = await response.json();

			if (!data || data.status !== "success") {
				return interaction.editReply("Couldn't find a dog! 🐕");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🐕 Random Dog",
					image: { url: data.message },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch a dog picture!");
		}
	},
};
