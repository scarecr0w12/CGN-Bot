const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("safebooru")
		.setDescription("Search Safebooru for anime images")
		.addStringOption(opt =>
			opt.setName("tags")
				.setDescription("Search tags")
				.setRequired(true),
		),

	async execute (interaction) {
		const tags = interaction.options.getString("tags");

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=50&tags=${encodeURIComponent(tags)}`,
			);
			const data = await response.json();

			if (!data || data.length === 0) {
				return interaction.editReply("No results found!");
			}

			const post = data[Math.floor(Math.random() * data.length)];
			const imageUrl = `https://safebooru.org/images/${post.directory}/${post.image}`;

			return interaction.editReply({
				embeds: [{
					color: 0x3669FA,
					title: "Safebooru",
					url: `https://safebooru.org/index.php?page=post&s=view&id=${post.id}`,
					image: { url: imageUrl },
					footer: { text: `Score: ${post.score}` },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to search Safebooru!");
		}
	},
};
