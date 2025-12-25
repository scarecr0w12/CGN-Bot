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
		.addSubcommand(sub =>
			sub.setName("force")
				.setDescription("Force a message to the starboard")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Message ID to force star")
						.setRequired(true),
				)
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel the message is in (default: current)")
						.addChannelTypes(ChannelType.GuildText),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Remove a message from the starboard")
				.addStringOption(opt =>
					opt.setName("message_id")
						.setDescription("Original message ID to remove")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("top")
				.setDescription("View top starred messages"),
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
				const starredCount = (serverDocument.starred_messages || []).length;

				return interaction.reply({
					embeds: [{
						color: 0x3669FA,
						title: "⭐ Starboard Configuration",
						fields: [
							{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
							{ name: "Channel", value: channelMention, inline: true },
							{ name: "Threshold", value: `${threshold} reactions`, inline: true },
							{ name: "Emoji", value: emoji, inline: true },
							{ name: "Starred Messages", value: String(starredCount), inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			case "force": {
				const messageId = interaction.options.getString("message_id");
				const channel = interaction.options.getChannel("channel") || interaction.channel;

				const config = serverDocument.config.starboard;
				if (!config || !config.channel_id) {
					return interaction.reply({
						content: "❌ Starboard channel is not configured. Use `/starboard channel` first.",
						ephemeral: true,
					});
				}

				const starboardChannel = interaction.guild.channels.cache.get(config.channel_id);
				if (!starboardChannel) {
					return interaction.reply({
						content: "❌ Starboard channel no longer exists.",
						ephemeral: true,
					});
				}

				await interaction.deferReply({ ephemeral: true });

				let message;
				try {
					message = await channel.messages.fetch(messageId);
				} catch {
					return interaction.editReply({ content: "❌ Could not find that message." });
				}

				const starredMessages = serverDocument.starred_messages || [];
				if (starredMessages.find(s => s.original_id === message.id)) {
					return interaction.editReply({ content: "❌ This message is already on the starboard." });
				}

				const starEmoji = config.emoji || "⭐";
				const starEmbed = {
					color: 0xFFD700,
					author: {
						name: message.author.tag,
						icon_url: message.author.displayAvatarURL(),
					},
					description: message.content || null,
					fields: [
						{ name: "Source", value: `[Jump to message](${message.url})`, inline: true },
					],
					footer: { text: `${starEmoji} Forced | ${message.id}` },
					timestamp: message.createdAt.toISOString(),
				};

				if (message.attachments.size > 0) {
					const imageAttachment = message.attachments.find(a =>
						a.contentType && a.contentType.startsWith("image/"),
					);
					if (imageAttachment) {
						starEmbed.image = { url: imageAttachment.url };
					}
				}

				const starboardMsg = await starboardChannel.send({ embeds: [starEmbed] });

				serverQueryDocument.push("starred_messages", {
					original_id: message.id,
					starboard_id: starboardMsg.id,
					channel_id: message.channel.id,
					author_id: message.author.id,
					stars: 0,
					forced: true,
				});
				await serverDocument.save();

				return interaction.editReply({
					content: `⭐ Message has been force-added to the starboard!`,
				});
			}

			case "remove": {
				const messageId = interaction.options.getString("message_id");

				const config = serverDocument.config.starboard;
				if (!config || !config.channel_id) {
					return interaction.reply({
						content: "❌ Starboard is not configured.",
						ephemeral: true,
					});
				}

				await interaction.deferReply({ ephemeral: true });

				const starredMessages = serverDocument.starred_messages || [];
				const entry = starredMessages.find(s => s.original_id === messageId);

				if (!entry) {
					return interaction.editReply({ content: "❌ This message is not on the starboard." });
				}

				const starboardChannel = interaction.guild.channels.cache.get(config.channel_id);
				if (starboardChannel && entry.starboard_id) {
					try {
						const starboardMsg = await starboardChannel.messages.fetch(entry.starboard_id);
						await starboardMsg.delete();
					} catch {
						// Message may already be deleted
					}
				}

				serverQueryDocument.pull("starred_messages", messageId);
				await serverDocument.save();

				return interaction.editReply({
					content: `⭐ Message has been removed from the starboard.`,
				});
			}

			case "top": {
				await interaction.deferReply({ ephemeral: true });

				const starredMessages = serverDocument.starred_messages || [];

				if (starredMessages.length === 0) {
					return interaction.editReply({
						embeds: [{
							color: 0xFEE75C,
							title: "⭐ Top Starred Messages",
							description: "No starred messages yet!",
						}],
					});
				}

				const sorted = [...starredMessages]
					.sort((a, b) => (b.stars || 0) - (a.stars || 0))
					.slice(0, 10);

				const topList = await Promise.all(sorted.map(async (entry, index) => {
					const user = await client.users.fetch(entry.author_id).catch(() => null);
					const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
					const stars = entry.stars || (entry.forced ? "Forced" : 0);
					return `${medal} **${stars}** ⭐ - ${user?.tag || "Unknown"} in <#${entry.channel_id}>`;
				}));

				return interaction.editReply({
					embeds: [{
						color: 0xFFD700,
						title: "⭐ Top Starred Messages",
						description: topList.join("\n"),
						footer: { text: `${starredMessages.length} total starred messages` },
					}],
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
