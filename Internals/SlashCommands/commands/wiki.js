const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("wiki")
		.setDescription("Search Wikipedia")
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("What to search for")
				.setRequired(true),
		),

	async execute (interaction) {
		const query = interaction.options.getString("query");

		await interaction.deferReply();

		try {
			const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
			const response = await fetch(searchUrl);
			const data = await response.json();

			if (data.type === "disambiguation") {
				return interaction.editReply({
					embeds: [{
						color: 0x3669FA,
						title: `📚 ${query}`,
						description: "This search returned a disambiguation page. Please be more specific.",
						url: data.content_urls.desktop.page,
					}],
				});
			}

			if (!data.extract) {
				return interaction.editReply("No Wikipedia article found for that query!");
			}

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: `📚 ${data.title}`,
					url: data.content_urls.desktop.page,
					description: data.extract.substring(0, 2000),
					thumbnail: data.thumbnail ? { url: data.thumbnail.source } : null,
					footer: { text: "Source: Wikipedia" },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to search Wikipedia!");
		}
	},
};
