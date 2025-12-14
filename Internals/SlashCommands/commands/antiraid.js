const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const TierManager = require("../../../Modules/TierManager");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("antiraid")
		.setDescription("Configure anti-raid protection (Premium)")
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View anti-raid configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable anti-raid protection"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable anti-raid protection"),
		)
		.addSubcommand(sub =>
			sub.setName("threshold")
				.setDescription("Set join threshold for raid detection")
				.addIntegerOption(opt =>
					opt.setName("joins")
						.setDescription("Number of joins to trigger raid mode (3-50)")
						.setRequired(true)
						.setMinValue(3)
						.setMaxValue(50),
				)
				.addIntegerOption(opt =>
					opt.setName("seconds")
						.setDescription("Time window in seconds (5-60)")
						.setRequired(true)
						.setMinValue(5)
						.setMaxValue(60),
				),
		)
		.addSubcommand(sub =>
			sub.setName("action")
				.setDescription("Set action when raid is detected")
				.addStringOption(opt =>
					opt.setName("action")
						.setDescription("Action to take")
						.setRequired(true)
						.addChoices(
							{ name: "Lockdown (prevent joins)", value: "lockdown" },
							{ name: "Kick new members", value: "kick" },
							{ name: "Ban new members", value: "ban" },
							{ name: "Notify only", value: "notify" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("lockdown")
				.setDescription("Set lockdown duration")
				.addIntegerOption(opt =>
					opt.setName("minutes")
						.setDescription("Lockdown duration in minutes (1-60)")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(60),
				),
		)
		.addSubcommand(sub =>
			sub.setName("minage")
				.setDescription("Set minimum account age for auto-kick during raid")
				.addIntegerOption(opt =>
					opt.setName("days")
						.setDescription("Minimum account age in days (0 to disable)")
						.setRequired(true)
						.setMinValue(0)
						.setMaxValue(365),
				),
		)
		.addSubcommand(sub =>
			sub.setName("log")
				.setDescription("Set log channel for raid alerts")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel for raid alerts (leave empty to use modlog)")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("whitelist")
				.setDescription("Whitelist a role from raid detection")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to whitelist")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unwhitelist")
				.setDescription("Remove a role from whitelist")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to remove from whitelist")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute (interaction, client, serverDocument) {
		// Check Tier 2 requirement
		const hasTier = await TierManager.hasMinimumTierLevel(interaction.guild.id, 2);
		if (!hasTier) {
			return interaction.reply({
				embeds: [{
					color: 0xFF6B6B,
					title: "⭐ Premium Feature",
					description: "Anti-raid protection requires **Tier 2 (Premium)** subscription.\n\nUpgrade your server to unlock advanced moderation features!",
					footer: { text: "Visit the dashboard to upgrade" },
				}],
				ephemeral: true,
			});
		}

		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const antiraid = serverDocument.config.moderation?.filters?.antiraid || {};

		switch (subcommand) {
			case "status": {
				const whitelistedRoles = antiraid.whitelist_role_ids || [];
				const roleList = whitelistedRoles.length > 0 ?
					whitelistedRoles.map(id => `<@&${id}>`).join(", ") :
					"None";

				return interaction.reply({
					embeds: [{
						color: antiraid.isEnabled ? 0x00FF00 : 0xFF0000,
						title: "🛡️ Anti-Raid Configuration",
						fields: [
							{
								name: "Status",
								value: antiraid.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Threshold",
								value: `${antiraid.join_threshold || 10} joins / ${antiraid.time_window || 10}s`,
								inline: true,
							},
							{
								name: "Action",
								value: antiraid.action || "lockdown",
								inline: true,
							},
							{
								name: "Lockdown Duration",
								value: `${Math.floor((antiraid.lockdown_duration || 300) / 60)} minutes`,
								inline: true,
							},
							{
								name: "Min Account Age",
								value: `${antiraid.min_account_age || 7} days`,
								inline: true,
							},
							{
								name: "Log Channel",
								value: antiraid.log_channel_id ? `<#${antiraid.log_channel_id}>` : "Modlog",
								inline: true,
							},
							{
								name: "Whitelisted Roles",
								value: roleList,
								inline: false,
							},
						],
						footer: { text: "Raid detection monitors join velocity" },
					}],
					ephemeral: true,
				});
			}

			case "enable": {
				serverQueryDocument.set("config.moderation.filters.antiraid.isEnabled", true);
				serverQueryDocument.set("config.moderation.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "✅ Anti-raid protection has been **enabled**!",
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("config.moderation.filters.antiraid.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "❌ Anti-raid protection has been **disabled**!",
					ephemeral: true,
				});
			}

			case "threshold": {
				const joins = interaction.options.getInteger("joins");
				const seconds = interaction.options.getInteger("seconds");

				serverQueryDocument.set("config.moderation.filters.antiraid.join_threshold", joins);
				serverQueryDocument.set("config.moderation.filters.antiraid.time_window", seconds);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Raid detection threshold set to **${joins} joins** within **${seconds} seconds**!`,
					ephemeral: true,
				});
			}

			case "action": {
				const action = interaction.options.getString("action");
				serverQueryDocument.set("config.moderation.filters.antiraid.action", action);
				await serverDocument.save();

				const actionDesc = {
					lockdown: "Lockdown (prevent new joins)",
					kick: "Kick new members",
					ban: "Ban new members",
					notify: "Notify only",
				};

				return interaction.reply({
					content: `✅ Raid action set to **${actionDesc[action]}**!`,
					ephemeral: true,
				});
			}

			case "lockdown": {
				const minutes = interaction.options.getInteger("minutes");
				serverQueryDocument.set("config.moderation.filters.antiraid.lockdown_duration", minutes * 60);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Lockdown duration set to **${minutes} minutes**!`,
					ephemeral: true,
				});
			}

			case "minage": {
				const days = interaction.options.getInteger("days");
				serverQueryDocument.set("config.moderation.filters.antiraid.min_account_age", days);
				await serverDocument.save();

				return interaction.reply({
					content: days > 0 ?
						`✅ Minimum account age set to **${days} days** during raids!` :
						"✅ Account age check during raids has been **disabled**!",
					ephemeral: true,
				});
			}

			case "log": {
				const channel = interaction.options.getChannel("channel");
				serverQueryDocument.set("config.moderation.filters.antiraid.log_channel_id", channel?.id || "");
				await serverDocument.save();

				return interaction.reply({
					content: channel ?
						`✅ Raid alerts will be sent to ${channel}!` :
						"✅ Raid alerts will use the modlog channel!",
					ephemeral: true,
				});
			}

			case "whitelist": {
				const role = interaction.options.getRole("role");
				const whitelistedRoles = antiraid.whitelist_role_ids || [];

				if (whitelistedRoles.includes(role.id)) {
					return interaction.reply({
						content: `⚠️ ${role} is already whitelisted!`,
						ephemeral: true,
					});
				}

				serverQueryDocument.push("config.moderation.filters.antiraid.whitelist_role_ids", role.id);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ ${role} has been **whitelisted** from raid detection!`,
					ephemeral: true,
				});
			}

			case "unwhitelist": {
				const role = interaction.options.getRole("role");
				const whitelistedRoles = antiraid.whitelist_role_ids || [];

				if (!whitelistedRoles.includes(role.id)) {
					return interaction.reply({
						content: `⚠️ ${role} is not in the whitelist!`,
						ephemeral: true,
					});
				}

				const updatedRoles = whitelistedRoles.filter(id => id !== role.id);
				serverQueryDocument.set("config.moderation.filters.antiraid.whitelist_role_ids", updatedRoles);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ ${role} has been **removed** from the whitelist!`,
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
