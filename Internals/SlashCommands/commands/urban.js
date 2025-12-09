const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("urban")
		.setDescription("Look up a word on Urban Dictionary")
		.addStringOption(opt =>
			opt.setName("word")
				.setDescription("The word to look up")
				.setRequired(true),
		),

	async execute (interaction) {
		const word = interaction.options.getString("word");

		await interaction.deferReply();

		try {
			const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`);
			const data = await response.json();

			if (!data.list || data.list.length === 0) {
				return interaction.editReply("No definitions found for that word!");
			}

			const definition = data.list[0];
			const cleanDef = definition.definition.replace(/\[|\]/g, "").substring(0, 1024);
			const cleanEx = definition.example ? definition.example.replace(/\[|\]/g, "").substring(0, 1024) : "No example";

			return interaction.editReply({
				embeds: [{
					color: 0x1D2439,
					title: `📖 ${definition.word}`,
					url: definition.permalink,
					fields: [
						{ name: "Definition", value: cleanDef, inline: false },
						{ name: "Example", value: cleanEx, inline: false },
						{ name: "Rating", value: `👍 ${definition.thumbs_up} | 👎 ${definition.thumbs_down}`, inline: true },
					],
					footer: { text: `By ${definition.author}` },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to look up that word!");
		}
	},
};
