const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("reddit")
		.setDescription("Get posts from a subreddit")
		.addStringOption(opt =>
			opt.setName("subreddit")
				.setDescription("The subreddit name")
				.setRequired(true),
		)
		.addIntegerOption(opt =>
			opt.setName("limit")
				.setDescription("Number of posts (1-5)")
				.setMinValue(1)
				.setMaxValue(5)
				.setRequired(false),
		),

	async execute (interaction) {
		const subreddit = interaction.options.getString("subreddit").replace(/^r\//, "");
		const limit = interaction.options.getInteger("limit") || 3;

		await interaction.deferReply();

		try {
			const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit + 5}`);
			const data = await response.json();

			if (!data.data || !data.data.children || data.data.children.length === 0) {
				return interaction.editReply("Couldn't find that subreddit or it has no posts!");
			}

			const posts = data.data.children
				.filter(p => !p.data.stickied && !p.data.over_18)
				.slice(0, limit);

			if (posts.length === 0) {
				return interaction.editReply("No posts found!");
			}

			const embeds = posts.map(p => {
				const post = p.data;
				return {
					color: 0xFF4500,
					title: post.title.substring(0, 256),
					url: `https://reddit.com${post.permalink}`,
					description: post.selftext ? post.selftext.substring(0, 300) + (post.selftext.length > 300 ? "..." : "") : "",
					footer: { text: `👍 ${post.ups} | 💬 ${post.num_comments} | r/${subreddit}` },
				};
			});

			return interaction.editReply({ embeds });
		} catch (err) {
			return interaction.editReply("Failed to fetch from Reddit!");
		}
	},
};
