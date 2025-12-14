const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("numfact")
		.setDescription("Get a random fact about a number")
		.addIntegerOption(opt =>
			opt.setName("number")
				.setDescription("The number to get a fact about (random if empty)")
				.setRequired(false),
		),

	async execute (interaction) {
		const number = interaction.options.getInteger("number");

		await interaction.deferReply();

		try {
			const url = number !== null ?
				`http://numbersapi.com/${number}` :
				"http://numbersapi.com/random";

			const response = await fetch(url);
			const fact = await response.text();

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "🔢 Number Fact",
					description: fact,
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch a number fact!");
		}
	},
};
