const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("joke")
		.setDescription("Get a random joke! 😂"),

	async execute (interaction) {
		await interaction.deferReply();

		try {
			const response = await fetch("https://official-joke-api.appspot.com/random_joke");
			const data = await response.json();

			if (!data || !data.setup) {
				return interaction.editReply("Couldn't find a joke!");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "😂 Random Joke",
					description: `**${data.setup}**\n\n||${data.punchline}||`,
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch a joke!");
		}
	},
};
