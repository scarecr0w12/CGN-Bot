const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("botcustom")
		.setDescription("Customize bot appearance in your server (Tier 2+)")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false)
		.addSubcommand(subcommand =>
			subcommand
				.setName("nickname")
				.setDescription("Set custom bot nickname for this server")
				.addStringOption(option =>
					option
						.setName("name")
						.setDescription("Bot nickname (leave empty to reset)")
						.setRequired(false)
						.setMaxLength(32),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("status")
				.setDescription("Set custom bot status (global)")
				.addStringOption(option =>
					option
						.setName("text")
						.setDescription("Status text")
						.setRequired(true)
						.setMaxLength(128),
				)
				.addStringOption(option =>
					option
						.setName("type")
						.setDescription("Status type")
						.setRequired(false)
						.addChoices(
							{ name: "Playing", value: "PLAYING" },
							{ name: "Watching", value: "WATCHING" },
							{ name: "Listening to", value: "LISTENING" },
							{ name: "Competing in", value: "COMPETING" },
						),
				)
				.addStringOption(option =>
					option
						.setName("state")
						.setDescription("Status state")
						.setRequired(false)
						.addChoices(
							{ name: "Online", value: "online" },
							{ name: "Idle", value: "idle" },
							{ name: "Do Not Disturb", value: "dnd" },
						),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("enable")
				.setDescription("Enable bot customization for this server"),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("disable")
				.setDescription("Disable bot customization and reset to defaults"),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("view")
				.setDescription("View current bot customization settings"),
		),

	async execute (interaction, client) {
		const subcommand = interaction.options.getSubcommand();
		const BotCustomizationManager = client.botCustomization;

		if (!BotCustomizationManager) {
			return interaction.reply({
				content: "❌ Bot customization system is not available.",
				ephemeral: true,
			});
		}

		// Check tier permission
		const TierManager = require("../../../Modules/TierManager");
		const tier = await TierManager.getServerTier(interaction.guild.id);

		if (!tier || (tier.tier_id !== "premium" && tier.tier_id !== "enterprise")) {
			const upgradeMsg = "❌ **Premium Feature Required**\n\n" +
				"Bot customization requires **Tier 2 (Premium)** or higher.\n\n" +
				"[Upgrade Now](https://skynetbot.net/membership) | " +
				"[Vote for Free Premium](https://top.gg/bot/skynetbot/vote)";
			return interaction.reply({
				content: upgradeMsg,
				ephemeral: true,
			});
		}

		try {
			switch (subcommand) {
				case "nickname": {
					const nickname = interaction.options.getString("name");

					await BotCustomizationManager.updateCustomization(interaction.guild.id, {
						nickname: nickname || "",
						isEnabled: true,
					});

					return interaction.reply({
						content: nickname ?
							`✅ Bot nickname set to **${nickname}**` :
							"✅ Bot nickname reset to default",
						ephemeral: true,
					});
				}

				case "status": {
					const text = interaction.options.getString("text");
					const type = interaction.options.getString("type") || "PLAYING";
					const state = interaction.options.getString("state") || "online";

					await BotCustomizationManager.updateCustomization(interaction.guild.id, {
						status_text: text,
						status_type: type,
						status_state: state,
						isEnabled: true,
					});

					return interaction.reply({
						content: `✅ Bot status updated\n\n**${type}** ${text} (${state})\n\n⚠️ *Note: Status is global and affects all servers.*`,
						ephemeral: true,
					});
				}

				case "enable": {
					await BotCustomizationManager.updateCustomization(interaction.guild.id, {
						isEnabled: true,
					});

					return interaction.reply({
						content: "✅ Bot customization enabled!\n\nUse `/botcustom nickname` and `/botcustom status` to customize.",
						ephemeral: true,
					});
				}

				case "disable": {
					await BotCustomizationManager.resetCustomization(interaction.guild.id);

					return interaction.reply({
						content: "✅ Bot customization disabled and reset to defaults.",
						ephemeral: true,
					});
				}

				case "view": {
					const settings = await BotCustomizationManager.getCustomization(interaction.guild.id);

					const embed = {
						title: "🎨 Bot Customization Settings",
						color: 0x5865F2,
						fields: [
							{
								name: "Status",
								value: settings.isEnabled ? "✅ Enabled" : "❌ Disabled",
								inline: true,
							},
							{
								name: "Nickname",
								value: settings.nickname || "*Default (CGN-Bot)*",
								inline: true,
							},
							{
								name: "\u200b",
								value: "\u200b",
								inline: true,
							},
							{
								name: "Bot Status",
								value: settings.status_text || "*Default*",
								inline: false,
							},
							{
								name: "Status Type",
								value: settings.status_type || "PLAYING",
								inline: true,
							},
							{
								name: "Status State",
								value: settings.status_state || "online",
								inline: true,
							},
						],
						footer: {
							text: "Use /botcustom to modify these settings",
						},
					};

					return interaction.reply({
						embeds: [embed],
						ephemeral: true,
					});
				}

				default:
					return interaction.reply({
						content: "❌ Unknown subcommand.",
						ephemeral: true,
					});
			}
		} catch (error) {
			client.logger.error(`Error in /botcustom: ${error.message}`);
			return interaction.reply({
				content: `❌ Error: ${error.message}`,
				ephemeral: true,
			});
		}
	},
};
