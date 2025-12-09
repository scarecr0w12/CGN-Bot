const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("rule34")
		.setDescription("Search Rule34 (NSFW)")
		.addStringOption(opt =>
			opt.setName("tags")
				.setDescription("Search tags")
				.setRequired(true),
		)
		.setNSFW(true),

	async execute (interaction) {
		if (!interaction.channel.nsfw) {
			return interaction.reply({
				content: "This command can only be used in NSFW channels!",
				ephemeral: true,
			});
		}

		const tags = interaction.options.getString("tags");

		await interaction.deferReply();

		try {
			const response = await fetch(
				`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=50&tags=${encodeURIComponent(tags)}`,
			);
			const data = await response.json();

			if (!data || data.length === 0) {
				return interaction.editReply("No results found!");
			}

			const post = data[Math.floor(Math.random() * data.length)];

			return interaction.editReply({
				embeds: [{
					color: 0xAAE5A3,
					title: "Rule34",
					url: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`,
					image: { url: post.file_url },
					footer: { text: `Score: ${post.score}` },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to search Rule34!");
		}
	},
};
