const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("dogfact")
		.setDescription("Get a random dog fact! 🐕"),

	async execute (interaction) {
		await interaction.deferReply();

		try {
			const response = await fetch("https://dogapi.dog/api/v2/facts?limit=1");
			const data = await response.json();

			if (!data || !data.data || !data.data[0]) {
				return interaction.editReply("Couldn't find a dog fact!");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🐕 Dog Fact",
					description: data.data[0].attributes.body,
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch a dog fact!");
		}
	},
};
