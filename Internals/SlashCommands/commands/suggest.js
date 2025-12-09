const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("suggest")
		.setDescription("Submit a suggestion or configure the suggestion system")
		.addSubcommand(sub =>
			sub.setName("submit")
				.setDescription("Submit a suggestion")
				.addStringOption(opt =>
					opt.setName("suggestion")
						.setDescription("Your suggestion")
						.setRequired(true)
						.setMinLength(10)
						.setMaxLength(2000),
				),
		)
		.addSubcommand(sub =>
			sub.setName("channel")
				.setDescription("Set the suggestion channel (Admin only)")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("The channel for suggestions")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable the suggestion system (Admin only)"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable the suggestion system (Admin only)"),
		),

	async execute (interaction, client, serverDocument) {
		const serverQueryDocument = serverDocument.query;
		const subcommand = interaction.options.getSubcommand();

		// Admin subcommands require admin level
		if (["channel", "enable", "disable"].includes(subcommand)) {
			const adminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, interaction.member);
			if (adminLevel < 1) {
				return interaction.reply({
					content: "You need to be an admin to use this subcommand!",
					ephemeral: true,
				});
			}
		}

		switch (subcommand) {
			case "submit": {
				const suggestConfig = serverDocument.config.suggestions || {};
				if (!suggestConfig.isEnabled || !suggestConfig.channel_id) {
					return interaction.reply({
						content: "The suggestion system is not configured on this server!",
						ephemeral: true,
					});
				}

				const suggestionChannel = interaction.guild.channels.cache.get(suggestConfig.channel_id);
				if (!suggestionChannel) {
					return interaction.reply({
						content: "The suggestion channel no longer exists!",
						ephemeral: true,
					});
				}

				const suggestion = interaction.options.getString("suggestion");

				// Get next suggestion ID
				const suggestionId = (serverDocument.suggestion_count || 0) + 1;
				serverQueryDocument.set("suggestion_count", suggestionId);
				await serverDocument.save();

				const suggestionMsg = await suggestionChannel.send({
					embeds: [{
						color: 0x3669FA,
						title: `💡 Suggestion #${suggestionId}`,
						description: suggestion,
						author: {
							name: interaction.user.tag,
							iconURL: interaction.user.displayAvatarURL(),
						},
						footer: { text: `User ID: ${interaction.user.id}` },
						timestamp: new Date().toISOString(),
					}],
				});

				await suggestionMsg.react("👍");
				await suggestionMsg.react("👎");

				return interaction.reply({
					content: `Your suggestion (#${suggestionId}) has been submitted! 💡`,
					ephemeral: true,
				});
			}

			case "channel": {
				const channel = interaction.options.getChannel("channel");
				if (!serverDocument.config.suggestions) {
					serverQueryDocument.set("config.suggestions", {});
				}
				serverQueryDocument.set("config.suggestions.channel_id", channel.id);
				serverQueryDocument.set("config.suggestions.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: `💡 Suggestion channel set to ${channel}!`,
					ephemeral: true,
				});
			}

			case "enable": {
				if (!serverDocument.config.suggestions || !serverDocument.config.suggestions.channel_id) {
					return interaction.reply({
						content: "Please set a suggestion channel first!",
						ephemeral: true,
					});
				}
				serverQueryDocument.set("config.suggestions.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "💡 Suggestion system has been **enabled**!",
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("config.suggestions.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "💡 Suggestion system has been **disabled**!",
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
