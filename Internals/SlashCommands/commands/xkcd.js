const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("xkcd")
		.setDescription("Get an XKCD comic")
		.addIntegerOption(opt =>
			opt.setName("id")
				.setDescription("Comic ID (leave empty for latest)")
				.setMinValue(1)
				.setRequired(false),
		),

	async execute (interaction) {
		const comicId = interaction.options.getInteger("id");

		await interaction.deferReply();

		try {
			let url = "https://xkcd.com/info.0.json";
			if (comicId) {
				url = `https://xkcd.com/${comicId}/info.0.json`;
			}

			const response = await fetch(url);
			if (!response.ok) {
				return interaction.editReply("Couldn't find that XKCD comic!");
			}

			const data = await response.json();

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: `#${data.num}: ${data.title}`,
					url: `https://xkcd.com/${data.num}`,
					image: { url: data.img },
					footer: { text: data.alt.substring(0, 2000) },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch XKCD comic!");
		}
	},
};
