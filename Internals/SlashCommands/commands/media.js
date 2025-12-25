const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("media")
		.setDescription("Get media content from various sources")
		.addStringOption(opt =>
			opt.setName("type")
				.setDescription("Type of media to fetch")
				.setRequired(true)
				.addChoices(
					{ name: "GIF (Giphy)", value: "gif" },
					{ name: "Meme (Reddit)", value: "meme" },
					{ name: "Reddit Post", value: "reddit" },
					{ name: "Upload to Imgur", value: "imgur" },
				),
		)
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("Search query or subreddit name (for GIF/Reddit)")
				.setRequired(false),
		)
		.addAttachmentOption(opt =>
			opt.setName("image")
				.setDescription("Image to upload (for Imgur)")
				.setRequired(false),
		),

	async execute (interaction) {
		const type = interaction.options.getString("type");
		const query = interaction.options.getString("query");
		const attachment = interaction.options.getAttachment("image");

		await interaction.deferReply();

		try {
			switch (type) {
				case "gif":
					return await handleGif(interaction, query);
				case "meme":
					return await handleMeme(interaction);
				case "reddit":
					return await handleReddit(interaction, query);
				case "imgur":
					return await handleImgur(interaction, attachment);
				default:
					return interaction.editReply("Invalid media type!");
			}
		} catch (err) {
			return interaction.editReply(`Failed to fetch media: ${err.message}`);
		}
	},
};

async function handleGif (interaction, query) {
	if (!query) {
		return interaction.editReply("Please provide a search query for GIFs!");
	}

	const apiKey = process.env.GIPHY_API_KEY;
	if (!apiKey) {
		return interaction.editReply("GIF search is not configured!");
	}

	const response = await fetch(
		`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=1&rating=pg-13`,
	);
	const data = await response.json();

	if (!data.data || data.data.length === 0) {
		return interaction.editReply("No GIFs found!");
	}

	return interaction.editReply({
		embeds: [{
			color: 0x3669FA,
			title: `GIF: ${query}`,
			image: { url: data.data[0].images.original.url },
			footer: { text: "Powered by Giphy" },
		}],
	});
}

async function handleMeme (interaction) {
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
}

async function handleReddit (interaction, subreddit) {
	if (!subreddit) {
		return interaction.editReply("Please provide a subreddit name!");
	}

	const sub = subreddit.replace(/^r\//, "");
	const response = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=5`);
	const data = await response.json();

	if (!data.data || !data.data.children || data.data.children.length === 0) {
		return interaction.editReply("Couldn't find that subreddit or it has no posts!");
	}

	const posts = data.data.children
		.filter(p => !p.data.stickied && !p.data.over_18)
		.slice(0, 3);

	if (posts.length === 0) {
		return interaction.editReply("No posts found!");
	}

	const embeds = posts.map(p => {
		const post = p.data;
		return {
			color: 0xFF4500,
			title: post.title.substring(0, 256),
			url: `https://reddit.com${post.permalink}`,
			description: post.selftext ?
				post.selftext.substring(0, 300) + (post.selftext.length > 300 ? "..." : "") :
				"",
			footer: { text: `👍 ${post.ups} | 💬 ${post.num_comments} | r/${sub}` },
		};
	});

	return interaction.editReply({ embeds });
}

async function handleImgur (interaction, attachment) {
	if (!attachment) {
		return interaction.editReply("Please attach an image to upload!");
	}

	const clientId = process.env.IMGUR_CLIENT_ID;
	if (!clientId) {
		return interaction.editReply("Imgur upload is not configured!");
	}

	if (!attachment.contentType || !attachment.contentType.startsWith("image/")) {
		return interaction.editReply("Please provide an image file!");
	}

	const response = await fetch("https://api.imgur.com/3/image", {
		method: "POST",
		headers: {
			Authorization: `Client-ID ${clientId}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			image: attachment.url,
			type: "url",
		}),
	});

	const data = await response.json();

	if (!data.success) {
		return interaction.editReply("Failed to upload to Imgur!");
	}

	return interaction.editReply({
		embeds: [{
			color: 0x1BB76E,
			title: "📸 Uploaded to Imgur!",
			image: { url: data.data.link },
			fields: [
				{ name: "Link", value: data.data.link, inline: false },
				{ name: "Delete Hash", value: `||${data.data.deletehash}||`, inline: false },
			],
			footer: { text: "Keep the delete hash to remove the image later" },
		}],
	});
}
