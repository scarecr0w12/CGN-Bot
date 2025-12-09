const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("streamers")
		.setDescription("Manage streamer notifications")
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List tracked streamers"),
		)
		.addSubcommand(sub =>
			sub.setName("add")
				.setDescription("Add a streamer to track")
				.addStringOption(opt =>
					opt.setName("username")
						.setDescription("Twitch username")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Remove a streamer")
				.addStringOption(opt =>
					opt.setName("username")
						.setDescription("Twitch username")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const streamers = serverDocument.config.streamers || [];

		switch (subcommand) {
			case "list": {
				if (streamers.length === 0) {
					return interaction.reply({
						content: "No streamers being tracked!",
						ephemeral: true,
					});
				}

				const list = streamers.map((s, i) => `**${i + 1}.** ${s.username}`).join("\n");

				return interaction.reply({
					embeds: [{
						color: 0x9146FF,
						title: "📺 Tracked Streamers",
						description: list,
					}],
					ephemeral: true,
				});
			}

			case "add": {
				const username = interaction.options.getString("username").toLowerCase();

				if (streamers.some(s => s.username === username)) {
					return interaction.reply({
						content: "Already tracking that streamer!",
						ephemeral: true,
					});
				}

				serverQueryDocument.push("config.streamers", {
					username: username,
					channel_id: interaction.channel.id,
				});
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Now tracking: **${username}**`,
					ephemeral: true,
				});
			}

			case "remove": {
				const username = interaction.options.getString("username").toLowerCase();
				const streamer = streamers.find(s => s.username === username);

				if (!streamer) {
					return interaction.reply({
						content: "Not tracking that streamer!",
						ephemeral: true,
					});
				}

				serverQueryDocument.pull("config.streamers", streamer);
				await serverDocument.save();

				return interaction.reply({
					content: `🗑️ Stopped tracking: **${username}**`,
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
