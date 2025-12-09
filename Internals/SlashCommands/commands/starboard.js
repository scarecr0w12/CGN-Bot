const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("starboard")
		.setDescription("Configure the starboard to highlight popular messages")
		.addSubcommand(sub =>
			sub.setName("channel")
				.setDescription("Set the starboard channel")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("The channel for starboard messages")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("threshold")
				.setDescription("Set the reaction threshold")
				.addIntegerOption(opt =>
					opt.setName("count")
						.setDescription("Number of reactions needed (1-100)")
						.setMinValue(1)
						.setMaxValue(100)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("emoji")
				.setDescription("Set the starboard emoji")
				.addStringOption(opt =>
					opt.setName("emoji")
						.setDescription("The emoji to use (default: ⭐)")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable the starboard"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable the starboard"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View current starboard configuration"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction, client, serverDocument) {
		const serverQueryDocument = serverDocument.query;
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "channel": {
				const channel = interaction.options.getChannel("channel");
				if (!serverDocument.config.starboard) {
					serverQueryDocument.set("config.starboard", {});
				}
				serverQueryDocument.set("config.starboard.channel_id", channel.id);
				serverQueryDocument.set("config.starboard.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: `⭐ Starboard channel set to ${channel}!`,
					ephemeral: true,
				});
			}

			case "threshold": {
				const count = interaction.options.getInteger("count");
				if (!serverDocument.config.starboard) {
					serverQueryDocument.set("config.starboard", {});
				}
				serverQueryDocument.set("config.starboard.threshold", count);
				await serverDocument.save();

				return interaction.reply({
					content: `⭐ Starboard threshold set to **${count}** reactions!`,
					ephemeral: true,
				});
			}

			case "emoji": {
				const emoji = interaction.options.getString("emoji");
				if (!serverDocument.config.starboard) {
					serverQueryDocument.set("config.starboard", {});
				}
				serverQueryDocument.set("config.starboard.emoji", emoji);
				await serverDocument.save();

				return interaction.reply({
					content: `Starboard emoji set to ${emoji}!`,
					ephemeral: true,
				});
			}

			case "enable": {
				if (!serverDocument.config.starboard || !serverDocument.config.starboard.channel_id) {
					return interaction.reply({
						content: "Please set a starboard channel first!",
						ephemeral: true,
					});
				}
				serverQueryDocument.set("config.starboard.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "⭐ Starboard has been **enabled**!",
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("config.starboard.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "⭐ Starboard has been **disabled**!",
					ephemeral: true,
				});
			}

			case "status": {
				const config = serverDocument.config.starboard || {};
				const channelMention = config.channel_id ? `<#${config.channel_id}>` : "Not set";
				const threshold = config.threshold || 3;
				const emoji = config.emoji || "⭐";
				const isEnabled = config.isEnabled !== false;

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "⭐ Starboard Configuration",
						fields: [
							{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
							{ name: "Channel", value: channelMention, inline: true },
							{ name: "Threshold", value: `${threshold} reactions`, inline: true },
							{ name: "Emoji", value: emoji, inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
