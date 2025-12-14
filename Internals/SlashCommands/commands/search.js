const { SlashCommandBuilder } = require("discord.js");

const platforms = {
	google: {
		name: "Google",
		emoji: "🔍",
		color: 0x4285F4,
		url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
	},
	youtube: {
		name: "YouTube",
		emoji: "🎬",
		color: 0xFF0000,
		url: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
	},
	twitter: {
		name: "Twitter/X",
		emoji: "🐦",
		color: 0x1DA1F2,
		url: (q) => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
		isProfile: true,
		profileUrl: (u) => `https://twitter.com/${u.replace(/^@/, "")}`,
	},
	reddit: {
		name: "Reddit",
		emoji: "🤖",
		color: 0xFF4500,
		url: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
	},
	github: {
		name: "GitHub",
		emoji: "💻",
		color: 0x333333,
		url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
	},
	images: {
		name: "Google Images",
		emoji: "🖼️",
		color: 0x4285F4,
		url: (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
	},
	playstore: {
		name: "Google Play",
		emoji: "📱",
		color: 0x01875F,
		url: (q) => `https://play.google.com/store/search?q=${encodeURIComponent(q)}&c=apps`,
	},
	wiki: {
		name: "Wikipedia",
		emoji: "📚",
		color: 0x000000,
		url: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
	},
};

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("search")
		.setDescription("Generate search links for various platforms")
		.addStringOption(opt =>
			opt.setName("platform")
				.setDescription("Platform to search on")
				.setRequired(true)
				.addChoices(
					{ name: "Google", value: "google" },
					{ name: "YouTube", value: "youtube" },
					{ name: "Twitter/X", value: "twitter" },
					{ name: "Reddit", value: "reddit" },
					{ name: "GitHub", value: "github" },
					{ name: "Google Images", value: "images" },
					{ name: "Google Play", value: "playstore" },
					{ name: "Wikipedia", value: "wiki" },
				),
		)
		.addStringOption(opt =>
			opt.setName("query")
				.setDescription("Search query or username")
				.setRequired(true),
		),

	async execute (interaction) {
		const platform = interaction.options.getString("platform");
		const query = interaction.options.getString("query");
		const config = platforms[platform];

		if (!config) {
			return interaction.reply({ content: "Invalid platform!", ephemeral: true });
		}

		const isProfileSearch = config.isProfile && query.startsWith("@");
		const url = isProfileSearch ? config.profileUrl(query) : config.url(query);
		const title = isProfileSearch ?
			`${config.emoji} ${query}` :
			`${config.emoji} ${config.name}: ${query}`;
		const description = isProfileSearch ?
			`[View profile on ${config.name}](${url})` :
			`[Click here to search ${config.name}](${url})`;

		return interaction.reply({
			embeds: [{
				color: config.color,
				title,
				description,
				footer: { text: config.name },
			}],
		});
	},
};
