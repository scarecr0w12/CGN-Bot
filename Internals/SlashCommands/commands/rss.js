const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("rss")
		.setDescription("Manage RSS feed subscriptions")
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List subscribed feeds"),
		)
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Subscribe to an RSS feed")
				.addStringOption(opt =>
					opt.setName("url")
						.setDescription("The RSS feed URL")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Unsubscribe from an RSS feed")
				.addStringOption(opt =>
					opt.setName("url")
						.setDescription("The RSS feed URL")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const rssFeeds = serverDocument.config.rss_feeds || [];

		switch (subcommand) {
			case "list": {
				if (rssFeeds.length === 0) {
					return interaction.reply({
						content: "No RSS feeds subscribed!",
						ephemeral: true,
					});
				}

				const list = rssFeeds.map((feed, i) => `**${i + 1}.** ${feed.url}`).join("\n");

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "📡 Subscribed RSS Feeds",
						description: list,
					}],
					ephemeral: true,
				});
			}

			case "add": {
				const url = interaction.options.getString("url");

				if (rssFeeds.some(f => f.url === url)) {
					return interaction.reply({
						content: "Already subscribed to that feed!",
						ephemeral: true,
					});
				}

				serverQueryDocument.push("config.rss_feeds", {
					url: url,
					channel_id: interaction.channel.id,
					last_checked: Date.now(),
				});
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Subscribed to: ${url}`,
					ephemeral: true,
				});
			}

			case "remove": {
				const url = interaction.options.getString("url");
				const feed = rssFeeds.find(f => f.url === url);

				if (!feed) {
					return interaction.reply({
						content: "Not subscribed to that feed!",
						ephemeral: true,
					});
				}

				serverQueryDocument.pull("config.rss_feeds", feed);
				await serverDocument.save();

				return interaction.reply({
					content: `🗑️ Unsubscribed from: ${url}`,
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
