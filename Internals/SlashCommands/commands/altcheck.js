const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const TierManager = require("../../../Modules/TierManager");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("altcheck")
		.setDescription("Configure alt account detection (Premium)")
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View alt detection configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable alt account detection"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable alt account detection"),
		)
		.addSubcommand(sub =>
			sub.setName("minage")
				.setDescription("Set minimum account age to flag as potential alt")
				.addIntegerOption(opt =>
					opt.setName("days")
						.setDescription("Minimum account age in days (1-365)")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(365),
				),
		)
		.addSubcommand(sub =>
			sub.setName("action")
				.setDescription("Set action for detected alt accounts")
				.addStringOption(opt =>
					opt.setName("action")
						.setDescription("Action to take")
						.setRequired(true)
						.addChoices(
							{ name: "Flag only (log)", value: "flag" },
							{ name: "Quarantine (assign role)", value: "quarantine" },
							{ name: "Kick", value: "kick" },
							{ name: "Ban", value: "ban" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("quarantine")
				.setDescription("Set quarantine role for suspected alts")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to assign (leave empty to clear)")
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("log")
				.setDescription("Set log channel for alt detection alerts")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel for alerts (leave empty to use modlog)")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("whitelist")
				.setDescription("Whitelist a user from alt detection")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to whitelist")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unwhitelist")
				.setDescription("Remove a user from whitelist")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to remove from whitelist")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("check")
				.setDescription("Manually check a user's account age")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to check")
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
					description: "Alt account detection requires **Tier 2 (Premium)** subscription.\n\nUpgrade your server to unlock advanced moderation features!",
					footer: { text: "Visit the dashboard to upgrade" },
				}],
				ephemeral: true,
			});
		}

		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;
		const altcheck = serverDocument.config.moderation?.filters?.altcheck || {};

		switch (subcommand) {
			case "status": {
				const whitelistedUsers = altcheck.whitelist_user_ids || [];
				const userList = whitelistedUsers.length > 0 ?
					whitelistedUsers.slice(0, 10).map(id => `<@${id}>`).join(", ") +
					(whitelistedUsers.length > 10 ? ` (+${whitelistedUsers.length - 10} more)` : "") :
					"None";

				return interaction.reply({
					embeds: [{
						color: altcheck.isEnabled ? 0x00FF00 : 0xFF0000,
						title: "🔍 Alt Detection Configuration",
						fields: [
							{
								name: "Status",
								value: altcheck.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Min Account Age",
								value: `${altcheck.min_account_age_days || 7} days`,
								inline: true,
							},
							{
								name: "Action",
								value: altcheck.action || "flag",
								inline: true,
							},
							{
								name: "Quarantine Role",
								value: altcheck.quarantine_role_id ? `<@&${altcheck.quarantine_role_id}>` : "Not set",
								inline: true,
							},
							{
								name: "Log Channel",
								value: altcheck.log_channel_id ? `<#${altcheck.log_channel_id}>` : "Modlog",
								inline: true,
							},
							{
								name: "Verification Required",
								value: altcheck.require_verification ? "Yes" : "No",
								inline: true,
							},
							{
								name: "Whitelisted Users",
								value: userList,
								inline: false,
							},
						],
						footer: { text: "Alt detection checks account creation date on join" },
					}],
					ephemeral: true,
				});
			}

			case "enable": {
				serverQueryDocument.set("config.moderation.filters.altcheck.isEnabled", true);
				serverQueryDocument.set("config.moderation.isEnabled", true);
				await serverDocument.save();

				return interaction.reply({
					content: "✅ Alt account detection has been **enabled**!",
					ephemeral: true,
				});
			}

			case "disable": {
				serverQueryDocument.set("config.moderation.filters.altcheck.isEnabled", false);
				await serverDocument.save();

				return interaction.reply({
					content: "❌ Alt account detection has been **disabled**!",
					ephemeral: true,
				});
			}

			case "minage": {
				const days = interaction.options.getInteger("days");
				serverQueryDocument.set("config.moderation.filters.altcheck.min_account_age_days", days);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ Accounts younger than **${days} days** will be flagged as potential alts!`,
					ephemeral: true,
				});
			}

			case "action": {
				const action = interaction.options.getString("action");
				serverQueryDocument.set("config.moderation.filters.altcheck.action", action);
				await serverDocument.save();

				const actionDesc = {
					flag: "Flag only (log to channel)",
					quarantine: "Quarantine (assign restricted role)",
					kick: "Kick from server",
					ban: "Ban from server",
				};

				return interaction.reply({
					content: `✅ Alt detection action set to **${actionDesc[action]}**!`,
					ephemeral: true,
				});
			}

			case "quarantine": {
				const role = interaction.options.getRole("role");
				serverQueryDocument.set("config.moderation.filters.altcheck.quarantine_role_id", role?.id || "");
				await serverDocument.save();

				return interaction.reply({
					content: role ?
						`✅ Quarantine role set to ${role}!` :
						"✅ Quarantine role has been cleared!",
					ephemeral: true,
				});
			}

			case "log": {
				const channel = interaction.options.getChannel("channel");
				serverQueryDocument.set("config.moderation.filters.altcheck.log_channel_id", channel?.id || "");
				await serverDocument.save();

				return interaction.reply({
					content: channel ?
						`✅ Alt detection alerts will be sent to ${channel}!` :
						"✅ Alt detection alerts will use the modlog channel!",
					ephemeral: true,
				});
			}

			case "whitelist": {
				const user = interaction.options.getUser("user");
				const whitelistedUsers = altcheck.whitelist_user_ids || [];

				if (whitelistedUsers.includes(user.id)) {
					return interaction.reply({
						content: `⚠️ ${user} is already whitelisted!`,
						ephemeral: true,
					});
				}

				serverQueryDocument.push("config.moderation.filters.altcheck.whitelist_user_ids", user.id);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ ${user} has been **whitelisted** from alt detection!`,
					ephemeral: true,
				});
			}

			case "unwhitelist": {
				const user = interaction.options.getUser("user");
				const whitelistedUsers = altcheck.whitelist_user_ids || [];

				if (!whitelistedUsers.includes(user.id)) {
					return interaction.reply({
						content: `⚠️ ${user} is not in the whitelist!`,
						ephemeral: true,
					});
				}

				const updatedUsers = whitelistedUsers.filter(id => id !== user.id);
				serverQueryDocument.set("config.moderation.filters.altcheck.whitelist_user_ids", updatedUsers);
				await serverDocument.save();

				return interaction.reply({
					content: `✅ ${user} has been **removed** from the whitelist!`,
					ephemeral: true,
				});
			}

			case "check": {
				const user = interaction.options.getUser("user");
				const createdAt = user.createdAt;
				const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
				const minAge = altcheck.min_account_age_days || 7;
				const isSuspicious = accountAge < minAge;

				return interaction.reply({
					embeds: [{
						color: isSuspicious ? 0xFF6B6B : 0x00FF00,
						title: `🔍 Account Check: ${user.tag}`,
						thumbnail: { url: user.displayAvatarURL() },
						fields: [
							{
								name: "Account Created",
								value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`,
								inline: true,
							},
							{
								name: "Account Age",
								value: `${accountAge} days`,
								inline: true,
							},
							{
								name: "Status",
								value: isSuspicious ?
									`⚠️ **Suspicious** (under ${minAge} days)` :
									"✅ Normal",
								inline: true,
							},
							{
								name: "User ID",
								value: user.id,
								inline: false,
							},
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
