const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const TierManager = require("../../../Modules/TierManager");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("automod")
		.setDescription("Configure auto-moderation settings")
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View current auto-moderation status"),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable auto-moderation system"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable auto-moderation system"),
		)
		.addSubcommandGroup(group =>
			group.setName("spam")
				.setDescription("Configure spam filter")
				.addSubcommand(sub =>
					sub.setName("enable")
						.setDescription("Enable spam filter"),
				)
				.addSubcommand(sub =>
					sub.setName("disable")
						.setDescription("Disable spam filter"),
				)
				.addSubcommand(sub =>
					sub.setName("sensitivity")
						.setDescription("Set spam sensitivity")
						.addIntegerOption(opt =>
							opt.setName("level")
								.setDescription("Message count before triggering (3=strict, 5=normal, 10=lenient)")
								.setRequired(true)
								.addChoices(
									{ name: "Strict (3 messages)", value: 3 },
									{ name: "Normal (5 messages)", value: 5 },
									{ name: "Lenient (10 messages)", value: 10 },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("action")
						.setDescription("Set action for spam violations")
						.addStringOption(opt =>
							opt.setName("action")
								.setDescription("Action to take")
								.setRequired(true)
								.addChoices(
									{ name: "None (warn only)", value: "none" },
									{ name: "Block from bot", value: "block" },
									{ name: "Mute in channel", value: "mute" },
									{ name: "Kick from server", value: "kick" },
									{ name: "Ban from server", value: "ban" },
								),
						),
				),
		)
		.addSubcommandGroup(group =>
			group.setName("mentions")
				.setDescription("Configure mention filter")
				.addSubcommand(sub =>
					sub.setName("enable")
						.setDescription("Enable mention filter"),
				)
				.addSubcommand(sub =>
					sub.setName("disable")
						.setDescription("Disable mention filter"),
				)
				.addSubcommand(sub =>
					sub.setName("limit")
						.setDescription("Set maximum mentions allowed")
						.addIntegerOption(opt =>
							opt.setName("count")
								.setDescription("Max mentions per message (1-25)")
								.setRequired(true)
								.setMinValue(1)
								.setMaxValue(25),
						),
				)
				.addSubcommand(sub =>
					sub.setName("action")
						.setDescription("Set action for mention spam")
						.addStringOption(opt =>
							opt.setName("action")
								.setDescription("Action to take")
								.setRequired(true)
								.addChoices(
									{ name: "None (warn only)", value: "none" },
									{ name: "Block from bot", value: "block" },
									{ name: "Mute in channel", value: "mute" },
									{ name: "Kick from server", value: "kick" },
									{ name: "Ban from server", value: "ban" },
								),
						),
				),
		)
		.addSubcommandGroup(group =>
			group.setName("sentiment")
				.setDescription("Configure AI sentiment analysis filter (Tier 1)")
				.addSubcommand(sub =>
					sub.setName("enable")
						.setDescription("Enable sentiment analysis filter"),
				)
				.addSubcommand(sub =>
					sub.setName("disable")
						.setDescription("Disable sentiment analysis filter"),
				)
				.addSubcommand(sub =>
					sub.setName("status")
						.setDescription("View sentiment filter configuration"),
				)
				.addSubcommand(sub =>
					sub.setName("provider")
						.setDescription("Set analysis provider")
						.addStringOption(opt =>
							opt.setName("provider")
								.setDescription("Analysis provider to use")
								.setRequired(true)
								.addChoices(
									{ name: "Google Cloud NL (recommended)", value: "google" },
									{ name: "AI Provider (fallback)", value: "ai" },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("apikey")
						.setDescription("Set Google Cloud API key")
						.addStringOption(opt =>
							opt.setName("key")
								.setDescription("Your Google Cloud API key (leave empty to clear)")
								.setRequired(false),
						),
				)
				.addSubcommand(sub =>
					sub.setName("sensitivity")
						.setDescription("Set detection sensitivity")
						.addStringOption(opt =>
							opt.setName("level")
								.setDescription("Sensitivity level")
								.setRequired(true)
								.addChoices(
									{ name: "Strict (flags more content)", value: "strict" },
									{ name: "Normal (balanced)", value: "normal" },
									{ name: "Lenient (only severe)", value: "lenient" },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("action")
						.setDescription("Set action for sentiment violations")
						.addStringOption(opt =>
							opt.setName("action")
								.setDescription("Action to take")
								.setRequired(true)
								.addChoices(
									{ name: "None (log only)", value: "none" },
									{ name: "Warn user", value: "warn" },
									{ name: "Block from bot", value: "block" },
									{ name: "Mute in channel", value: "mute" },
									{ name: "Kick from server", value: "kick" },
									{ name: "Ban from server", value: "ban" },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("logchannel")
						.setDescription("Set channel for sentiment violation logs")
						.addChannelOption(opt =>
							opt.setName("channel")
								.setDescription("Log channel (leave empty to disable)")
								.addChannelTypes(ChannelType.GuildText)
								.setRequired(false),
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, client, serverDocument) {
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;

		// Handle top-level subcommands
		if (!subcommandGroup) {
			switch (subcommand) {
				case "status": {
					const mod = serverDocument.config.moderation || {};
					const filters = mod.filters || {};

					const statusEmbed = {
						color: mod.isEnabled ? 0x00FF00 : 0xFF0000,
						title: "🛡️ Auto-Moderation Status",
						fields: [
							{
								name: "System",
								value: mod.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Spam Filter",
								value: filters.spam_filter?.isEnabled ? `✅ (${filters.spam_filter.message_sensitivity} msgs)` : "❌ Disabled",
								inline: true,
							},
							{
								name: "Mention Filter",
								value: filters.mention_filter?.isEnabled ? `✅ (${filters.mention_filter.mention_sensitivity} max)` : "❌ Disabled",
								inline: true,
							},
							{
								name: "Word Filter",
								value: filters.custom_filter?.isEnabled ? `✅ (${filters.custom_filter.keywords?.length || 0} words)` : "❌ Disabled",
								inline: true,
							},
							{
								name: "NSFW Filter",
								value: filters.nsfw_filter?.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Anti-Raid",
								value: filters.antiraid?.isEnabled ? `✅ (${filters.antiraid.join_threshold}/${filters.antiraid.time_window}s)` : "❌ Disabled",
								inline: true,
							},
							{
								name: "Alt Check",
								value: filters.altcheck?.isEnabled ? `✅ (${filters.altcheck.min_account_age_days}d min)` : "❌ Disabled",
								inline: true,
							},
							{
								name: "Sentiment (Tier 1)",
								value: filters.sentiment_filter?.isEnabled ? `✅ (${filters.sentiment_filter.sensitivity})` : "❌ Disabled",
								inline: true,
							},
						],
						footer: { text: "Use /automod <filter> to configure individual filters" },
					};

					return interaction.reply({ embeds: [statusEmbed], ephemeral: true });
				}

				case "enable": {
					serverQueryDocument.set("config.moderation.isEnabled", true);
					await serverDocument.save();
					return interaction.reply({
						content: "✅ Auto-moderation system has been **enabled**!",
						ephemeral: true,
					});
				}

				case "disable": {
					serverQueryDocument.set("config.moderation.isEnabled", false);
					await serverDocument.save();
					return interaction.reply({
						content: "❌ Auto-moderation system has been **disabled**!",
						ephemeral: true,
					});
				}
			}
		}

		// Handle spam subcommand group
		if (subcommandGroup === "spam") {
			switch (subcommand) {
				case "enable": {
					serverQueryDocument.set("config.moderation.filters.spam_filter.isEnabled", true);
					await serverDocument.save();
					return interaction.reply({
						content: "✅ Spam filter has been **enabled**!",
						ephemeral: true,
					});
				}

				case "disable": {
					serverQueryDocument.set("config.moderation.filters.spam_filter.isEnabled", false);
					await serverDocument.save();
					return interaction.reply({
						content: "❌ Spam filter has been **disabled**!",
						ephemeral: true,
					});
				}

				case "sensitivity": {
					const level = interaction.options.getInteger("level");
					serverQueryDocument.set("config.moderation.filters.spam_filter.message_sensitivity", level);
					await serverDocument.save();
					const levelName = level === 3 ? "Strict" : level === 5 ? "Normal" : "Lenient";
					return interaction.reply({
						content: `✅ Spam sensitivity set to **${levelName}** (${level} messages)!`,
						ephemeral: true,
					});
				}

				case "action": {
					const action = interaction.options.getString("action");
					serverQueryDocument.set("config.moderation.filters.spam_filter.action", action);
					await serverDocument.save();
					return interaction.reply({
						content: `✅ Spam violation action set to **${action}**!`,
						ephemeral: true,
					});
				}
			}
		}

		// Handle mentions subcommand group
		if (subcommandGroup === "mentions") {
			switch (subcommand) {
				case "enable": {
					serverQueryDocument.set("config.moderation.filters.mention_filter.isEnabled", true);
					await serverDocument.save();
					return interaction.reply({
						content: "✅ Mention filter has been **enabled**!",
						ephemeral: true,
					});
				}

				case "disable": {
					serverQueryDocument.set("config.moderation.filters.mention_filter.isEnabled", false);
					await serverDocument.save();
					return interaction.reply({
						content: "❌ Mention filter has been **disabled**!",
						ephemeral: true,
					});
				}

				case "limit": {
					const count = interaction.options.getInteger("count");
					serverQueryDocument.set("config.moderation.filters.mention_filter.mention_sensitivity", count);
					await serverDocument.save();
					return interaction.reply({
						content: `✅ Mention limit set to **${count}** mentions per message!`,
						ephemeral: true,
					});
				}

				case "action": {
					const action = interaction.options.getString("action");
					serverQueryDocument.set("config.moderation.filters.mention_filter.action", action);
					await serverDocument.save();
					return interaction.reply({
						content: `✅ Mention violation action set to **${action}**!`,
						ephemeral: true,
					});
				}
			}
		}

		// Handle sentiment subcommand group (Tier 1 feature)
		if (subcommandGroup === "sentiment") {
			// Check tier access first
			const hasAccess = await TierManager.canAccess(interaction.guild.id, "sentiment_analysis");

			switch (subcommand) {
				case "status": {
					const sentimentConfig = serverDocument.config.moderation?.filters?.sentiment_filter || {};
					const statusEmbed = {
						color: sentimentConfig.isEnabled ? 0x00FF00 : 0xFF0000,
						title: "🔍 Sentiment Analysis Configuration",
						description: hasAccess ? "" : "⚠️ **Tier 1 required** - Upgrade to access this feature",
						fields: [
							{
								name: "Status",
								value: sentimentConfig.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Provider",
								value: sentimentConfig.provider === "ai" ? "AI (Fallback)" : "Google Cloud NL",
								inline: true,
							},
							{
								name: "Sensitivity",
								value: (sentimentConfig.sensitivity || "normal").charAt(0).toUpperCase() + (sentimentConfig.sensitivity || "normal").slice(1),
								inline: true,
							},
							{
								name: "Action",
								value: sentimentConfig.action || "mute",
								inline: true,
							},
							{
								name: "Delete Messages",
								value: sentimentConfig.delete_message !== false ? "Yes" : "No",
								inline: true,
							},
							{
								name: "Log Channel",
								value: sentimentConfig.log_channel_id ? `<#${sentimentConfig.log_channel_id}>` : "None",
								inline: true,
							},
							{
								name: "Google API Key",
								value: sentimentConfig.google_api_key ? "✅ Configured" : "❌ Not set",
								inline: true,
							},
							{
								name: "Categories",
								value: Object.entries(sentimentConfig.categories || {})
									.filter(([, v]) => v)
									.map(([k]) => k.replace("_", " "))
									.join(", ") || "All enabled",
								inline: false,
							},
						],
						footer: { text: "Use /automod sentiment <option> to configure" },
					};
					return interaction.reply({ embeds: [statusEmbed], ephemeral: true });
				}

				case "enable": {
					if (!hasAccess) {
						return interaction.reply({
							content: "❌ **Tier 1 Required** - Sentiment analysis is a premium feature. Upgrade your server to Tier 1 to access it.",
							ephemeral: true,
						});
					}
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.isEnabled", true);
					serverQueryDocument.set("config.moderation.isEnabled", true);
					await serverDocument.save();
					return interaction.reply({
						content: "✅ Sentiment analysis filter has been **enabled**!",
						ephemeral: true,
					});
				}

				case "disable": {
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.isEnabled", false);
					await serverDocument.save();
					return interaction.reply({
						content: "❌ Sentiment analysis filter has been **disabled**!",
						ephemeral: true,
					});
				}

				case "provider": {
					if (!hasAccess) {
						return interaction.reply({
							content: "❌ **Tier 1 Required** - Upgrade to configure sentiment analysis.",
							ephemeral: true,
						});
					}
					const provider = interaction.options.getString("provider");
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.provider", provider);
					await serverDocument.save();
					return interaction.reply({
						content: `✅ Sentiment analysis provider set to **${provider === "google" ? "Google Cloud NL" : "AI (Fallback)"}**!`,
						ephemeral: true,
					});
				}

				case "apikey": {
					if (!hasAccess) {
						return interaction.reply({
							content: "❌ **Tier 1 Required** - Upgrade to configure sentiment analysis.",
							ephemeral: true,
						});
					}
					const key = interaction.options.getString("key") || "";
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.google_api_key", key);
					await serverDocument.save();
					return interaction.reply({
						content: key ? "✅ Google Cloud API key has been **configured**!" : "✅ Google Cloud API key has been **cleared**!",
						ephemeral: true,
					});
				}

				case "sensitivity": {
					if (!hasAccess) {
						return interaction.reply({
							content: "❌ **Tier 1 Required** - Upgrade to configure sentiment analysis.",
							ephemeral: true,
						});
					}
					const level = interaction.options.getString("level");
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.sensitivity", level);
					await serverDocument.save();
					return interaction.reply({
						content: `✅ Sentiment sensitivity set to **${level}**!`,
						ephemeral: true,
					});
				}

				case "action": {
					if (!hasAccess) {
						return interaction.reply({
							content: "❌ **Tier 1 Required** - Upgrade to configure sentiment analysis.",
							ephemeral: true,
						});
					}
					const action = interaction.options.getString("action");
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.action", action);
					await serverDocument.save();
					return interaction.reply({
						content: `✅ Sentiment violation action set to **${action}**!`,
						ephemeral: true,
					});
				}

				case "logchannel": {
					if (!hasAccess) {
						return interaction.reply({
							content: "❌ **Tier 1 Required** - Upgrade to configure sentiment analysis.",
							ephemeral: true,
						});
					}
					const channel = interaction.options.getChannel("channel");
					serverQueryDocument.set("config.moderation.filters.sentiment_filter.log_channel_id", channel?.id || "");
					await serverDocument.save();
					return interaction.reply({
						content: channel ? `✅ Sentiment log channel set to ${channel}!` : "✅ Sentiment log channel has been **disabled**!",
						ephemeral: true,
					});
				}
			}
		}

		return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
	},
};
