const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("wolfram")
		.setDescription("Query Wolfram Alpha")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("Your question")
				.setRequired(true),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");
		const appId = process.env.WOLFRAM_APP_ID;

		if (!appId) {
			return interaction.reply({
				content: "Wolfram Alpha is not configured!",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`,
			);

			if (!response.ok) {
				return interaction.editReply("Couldn't find an answer to that question!");
			}

			const answer = await response.text();

			return interaction.editReply({
				embeds: [{
					color: 0xF96932,
					title: "🔬 Wolfram Alpha",
					fields: [
						{ name: "Question", value: query, inline: false },
						{ name: "Answer", value: answer.substring(0, 1024), inline: false },
					],
					footer: { text: "Powered by Wolfram Alpha" },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to query Wolfram Alpha!");
		}
	},
};
