const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("meme")
		.setDescription("Get a random meme from Reddit"),

	async execute (interaction) {
		await interaction.deferReply();

		try {
			const subreddits = ["memes", "dankmemes", "me_irl", "wholesomememes"];
			const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];

			const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=50`);
			const data = await response.json();

			if (!data.data || !data.data.children) {
				return interaction.editReply("Couldn't fetch memes!");
			}

			const posts = data.data.children.filter(p =>
				!p.data.over_18 &&
				!p.data.stickied &&
				(p.data.url.endsWith(".jpg") || p.data.url.endsWith(".png") || p.data.url.endsWith(".gif")),
			);

			if (posts.length === 0) {
				return interaction.editReply("No memes found!");
			}

			const post = posts[Math.floor(Math.random() * posts.length)].data;

			return interaction.editReply({
				embeds: [{
					color: 0xFF4500,
					title: post.title.substring(0, 256),
					url: `https://reddit.com${post.permalink}`,
					image: { url: post.url },
					footer: { text: `👍 ${post.ups} | r/${subreddit}` },
				}],
			});
		} catch (err) {
			return interaction.editReply("Failed to fetch memes!");
		}
	},
};
