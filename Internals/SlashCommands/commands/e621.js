const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("e621")
		.setDescription("Search e621 (NSFW)")
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
				`https://e621.net/posts.json?tags=${encodeURIComponent(tags)}&limit=1`,
				{
					headers: {
						"User-Agent": "SkynetBot/1.0",
					},
				},
			);
			const data = await response.json();

			if (!data.posts || data.posts.length === 0) {
				return interaction.editReply("No results found!");
			}

			const post = data.posts[0];

			return interaction.editReply({
				embeds: [{
					color: 0x012E57,
					title: "e621",
					url: `https://e621.net/posts/${post.id}`,
					image: { url: post.file.url },
					footer: { text: `Score: ${post.score.total}` },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to search e621!");
		}
	},
};
