const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Logger = require("../../Logger");
const logger = new Logger("GamingAlertsCommand");

module.exports = {
	name: "gamingalerts",
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("gamingalerts")
		.setDescription("Manage gaming alerts for free games and sales")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable gaming alerts")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to send alerts")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable gaming alerts"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View gaming alerts configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("test")
				.setDescription("Send a test gaming alert"),
		)
		.addSubcommand(sub =>
			sub.setName("configure")
				.setDescription("Configure alert settings")
				.addBooleanOption(opt =>
					opt.setName("epic_free")
						.setDescription("Alert for Epic Games free games"),
				)
				.addBooleanOption(opt =>
					opt.setName("steam_sales")
						.setDescription("Alert for Steam sales"),
				)
				.addBooleanOption(opt =>
					opt.setName("steam_free")
						.setDescription("Alert for Steam free games"),
				)
				.addIntegerOption(opt =>
					opt.setName("min_discount")
						.setDescription("Minimum discount percentage (default: 50)")
						.setMinValue(0)
						.setMaxValue(100),
				),
		),

	async execute (interaction) {
		const subcommand = interaction.options.getSubcommand();
		const serverDocument = await interaction.client.getServerDocument(interaction.guild.id);

		switch (subcommand) {
			case "enable":
				return this.enableAlerts(interaction, serverDocument);
			case "disable":
				return this.disableAlerts(interaction, serverDocument);
			case "status":
				return this.showStatus(interaction, serverDocument);
			case "test":
				return this.testAlerts(interaction, serverDocument);
			case "configure":
				return this.configureAlerts(interaction, serverDocument);
			default:
				return interaction.reply({
					content: "❌ Unknown subcommand.",
					ephemeral: true,
				});
		}
	},

	async enableAlerts (interaction, serverDocument) {
		try {
			const channel = interaction.options.getChannel("channel");

			if (!channel.isTextBased()) {
				return interaction.reply({
					content: "❌ Please select a text channel.",
					ephemeral: true,
				});
			}

			const GamingAlerts = interaction.client.database.models.gamingAlerts;
			let config = await GamingAlerts.findOne({ server_id: serverDocument._id }).exec();

			if (!config) {
				config = await GamingAlerts.create({
					server_id: serverDocument._id,
					enabled: true,
					channel_id: channel.id,
					epic_free_games: true,
					steam_sales: true,
					steam_free_games: true,
					min_discount: 50,
				});
			} else {
				await GamingAlerts.update(
					{ server_id: serverDocument._id },
					{
						enabled: true,
						channel_id: channel.id,
						updated_at: new Date(),
					},
				);
			}

			return interaction.reply({
				embeds: [{
					color: 0x2ecc71,
					title: "✅ Gaming Alerts Enabled",
					description: `Gaming alerts will be sent to ${channel}`,
					fields: [
						{
							name: "📝 Enabled Alerts",
							value: [
								"✅ Epic Games free games",
								"✅ Steam sales (50%+ discount)",
								"✅ Steam free games",
							].join("\n"),
						},
						{
							name: "🔧 Next Steps",
							value: [
								"• Use `/gamingalerts configure` to customize settings",
								"• Visit the [dashboard](https://skynetbot.net/dashboard) for advanced filters",
								"• Test with `/gamingalerts test`",
							].join("\n"),
						},
					],
				}],
			});
		} catch (err) {
			logger.error("Error enabling gaming alerts:", err);
			return interaction.reply({
				content: "❌ Failed to enable gaming alerts.",
				ephemeral: true,
			});
		}
	},

	async disableAlerts (interaction, serverDocument) {
		try {
			const GamingAlerts = interaction.client.database.models.gamingAlerts;
			const config = await GamingAlerts.findOne({ server_id: serverDocument._id }).exec();

			if (!config || !config.enabled) {
				return interaction.reply({
					content: "❌ Gaming alerts are already disabled.",
					ephemeral: true,
				});
			}

			await GamingAlerts.update(
				{ server_id: serverDocument._id },
				{ enabled: false, updated_at: new Date() },
			);

			return interaction.reply({
				embeds: [{
					color: 0x95a5a6,
					description: "❌ Gaming alerts have been disabled.",
				}],
			});
		} catch (err) {
			logger.error("Error disabling gaming alerts:", err);
			return interaction.reply({
				content: "❌ Failed to disable gaming alerts.",
				ephemeral: true,
			});
		}
	},

	async showStatus (interaction, serverDocument) {
		try {
			const GamingAlerts = interaction.client.database.models.gamingAlerts;
			const config = await GamingAlerts.findOne({ server_id: serverDocument._id }).exec();

			if (!config) {
				return interaction.reply({
					embeds: [{
						color: 0x3498db,
						title: "🎮 Gaming Alerts",
						description: "Gaming alerts are not configured. Use `/gamingalerts enable` to get started!",
					}],
					ephemeral: true,
				});
			}

			const fields = [
				{
					name: "📊 Status",
					value: config.enabled ? "✅ Enabled" : "❌ Disabled",
					inline: true,
				},
				{
					name: "📺 Channel",
					value: config.channel_id ? `<#${config.channel_id}>` : "*Not set*",
					inline: true,
				},
				{
					name: "🔔 Alert Types",
					value: [
						`${config.epic_free_games ? "✅" : "❌"} Epic Games free`,
						`${config.steam_sales ? "✅" : "❌"} Steam sales`,
						`${config.steam_free_games ? "✅" : "❌"} Steam free`,
					].join("\n"),
					inline: true,
				},
				{
					name: "⚙️ Filters",
					value: [
						`Min Discount: ${config.min_discount}%`,
						config.price_filters?.max_price ? `Max Price: $${config.price_filters.max_price}` : "Max Price: No limit",
						config.price_filters?.free_only ? "Mode: Free games only" : "",
					].filter(Boolean).join("\n"),
					inline: true,
				},
			];

			if (config.role_mention) {
				fields.push({
					name: "👥 Mentions",
					value: `<@&${config.role_mention}>`,
					inline: true,
				});
			}

			return interaction.reply({
				embeds: [{
					color: 0x3498db,
					title: "🎮 Gaming Alerts Configuration",
					fields,
					footer: {
						text: "Visit the dashboard for advanced customization",
					},
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error showing gaming alerts status:", err);
			return interaction.reply({
				content: "❌ Failed to retrieve configuration.",
				ephemeral: true,
			});
		}
	},

	async testAlerts (interaction, serverDocument) {
		try {
			await interaction.deferReply({ ephemeral: true });

			const gamingAlerts = interaction.client.gamingAlerts;
			if (!gamingAlerts) {
				return interaction.editReply({
					content: "❌ Gaming alerts system is not available.",
				});
			}

			const result = await gamingAlerts.testAlert(serverDocument._id);

			return interaction.editReply({
				content: `✅ Test alert sent! Type: ${result.type.toUpperCase()}, Game: ${result.game}`,
			});
		} catch (err) {
			logger.error("Error testing gaming alerts:", err);
			return interaction.editReply({
				content: `❌ Failed to send test alert: ${err.message}`,
			});
		}
	},

	async configureAlerts (interaction, serverDocument) {
		try {
			const epicFree = interaction.options.getBoolean("epic_free");
			const steamSales = interaction.options.getBoolean("steam_sales");
			const steamFree = interaction.options.getBoolean("steam_free");
			const minDiscount = interaction.options.getInteger("min_discount");

			const GamingAlerts = interaction.client.database.models.gamingAlerts;
			const config = await GamingAlerts.findOne({ server_id: serverDocument._id }).exec();

			if (!config) {
				return interaction.reply({
					content: "❌ Gaming alerts not configured. Use `/gamingalerts enable` first.",
					ephemeral: true,
				});
			}

			const updateData = {
				updated_at: new Date(),
			};

			if (epicFree !== null) updateData.epic_free_games = epicFree;
			if (steamSales !== null) updateData.steam_sales = steamSales;
			if (steamFree !== null) updateData.steam_free_games = steamFree;
			if (minDiscount !== null) updateData.min_discount = minDiscount;

			await GamingAlerts.update(
				{ server_id: serverDocument._id },
				updateData,
			);

			const changes = [];
			if (epicFree !== null) changes.push(`Epic Free Games: ${epicFree ? "✅" : "❌"}`);
			if (steamSales !== null) changes.push(`Steam Sales: ${steamSales ? "✅" : "❌"}`);
			if (steamFree !== null) changes.push(`Steam Free Games: ${steamFree ? "✅" : "❌"}`);
			if (minDiscount !== null) changes.push(`Min Discount: ${minDiscount}%`);

			return interaction.reply({
				embeds: [{
					color: 0x2ecc71,
					title: "✅ Configuration Updated",
					description: changes.join("\n"),
					footer: {
						text: "Use /gamingalerts status to view full configuration",
					},
				}],
			});
		} catch (err) {
			logger.error("Error configuring gaming alerts:", err);
			return interaction.reply({
				content: "❌ Failed to update configuration.",
				ephemeral: true,
			});
		}
	},
};
