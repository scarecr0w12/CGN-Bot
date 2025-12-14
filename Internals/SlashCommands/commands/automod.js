const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

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

		return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
	},
};
