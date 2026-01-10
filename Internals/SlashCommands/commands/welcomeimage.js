const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const Logger = require("../../Logger");
const logger = new Logger("WelcomeImageCommand");

module.exports = {
	name: "welcomeimage",
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("welcomeimage")
		.setDescription("Manage welcome image settings")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable welcome images")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to send welcome images")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable welcome images"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View welcome image configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("test")
				.setDescription("Generate a test welcome image for yourself"),
		)
		.addSubcommand(sub =>
			sub.setName("template")
				.setDescription("Select a built-in template")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Template name")
						.setRequired(true)
						.addChoices(
							{ name: "Default - Discord Blue Gradient", value: "default" },
							{ name: "Dark - Midnight Black", value: "dark" },
							{ name: "Modern - Purple Wave", value: "modern" },
						),
				),
		),

	async execute (interaction) {
		const subcommand = interaction.options.getSubcommand();
		const serverDocument = await interaction.client.getServerDocument(interaction.guild.id);

		switch (subcommand) {
			case "enable":
				return this.enableWelcome(interaction, serverDocument);
			case "disable":
				return this.disableWelcome(interaction, serverDocument);
			case "status":
				return this.showStatus(interaction, serverDocument);
			case "test":
				return this.testImage(interaction, serverDocument);
			case "template":
				return this.setTemplate(interaction, serverDocument);
			default:
				return interaction.reply({
					content: "❌ Unknown subcommand.",
					ephemeral: true,
				});
		}
	},

	async enableWelcome (interaction, serverDocument) {
		try {
			const channel = interaction.options.getChannel("channel");

			if (!channel.isTextBased()) {
				return interaction.reply({
					content: "❌ Please select a text channel.",
					ephemeral: true,
				});
			}

			const WelcomeImages = interaction.client.database.models.welcomeImages;
			let config = await WelcomeImages.findOne({ server_id: serverDocument._id }).exec();

			if (!config) {
				// Create default config
				config = await WelcomeImages.create({
					server_id: serverDocument._id,
					enabled: true,
					channel_id: channel.id,
					template_id: "default",
					background: {
						type: "builtin",
						value: "default",
					},
				});
			} else {
				// Update existing
				await WelcomeImages.update(
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
					title: "✅ Welcome Images Enabled",
					description: `Welcome images will be sent to ${channel}`,
					fields: [
						{
							name: "📝 Next Steps",
							value: [
								"• Use `/welcomeimage template` to select a design",
								"• Visit the [dashboard](https://skynetbot.net/dashboard) to customize fully",
								"• Test with `/welcomeimage test`",
							].join("\n"),
						},
					],
				}],
			});
		} catch (err) {
			logger.error("Error enabling welcome images:", err);
			return interaction.reply({
				content: "❌ Failed to enable welcome images.",
				ephemeral: true,
			});
		}
	},

	async disableWelcome (interaction, serverDocument) {
		try {
			const WelcomeImages = interaction.client.database.models.welcomeImages;
			const config = await WelcomeImages.findOne({ server_id: serverDocument._id }).exec();

			if (!config || !config.enabled) {
				return interaction.reply({
					content: "❌ Welcome images are already disabled.",
					ephemeral: true,
				});
			}

			await WelcomeImages.update(
				{ server_id: serverDocument._id },
				{ enabled: false, updated_at: new Date() },
			);

			return interaction.reply({
				embeds: [{
					color: 0x95a5a6,
					description: "❌ Welcome images have been disabled.",
				}],
			});
		} catch (err) {
			logger.error("Error disabling welcome images:", err);
			return interaction.reply({
				content: "❌ Failed to disable welcome images.",
				ephemeral: true,
			});
		}
	},

	async showStatus (interaction, serverDocument) {
		try {
			const WelcomeImages = interaction.client.database.models.welcomeImages;
			const config = await WelcomeImages.findOne({ server_id: serverDocument._id }).exec();

			if (!config) {
				return interaction.reply({
					embeds: [{
						color: 0x3498db,
						title: "🖼️ Welcome Images",
						description: "Welcome images are not configured. Use `/welcomeimage enable` to get started!",
					}],
					ephemeral: true,
				});
			}

			const limits = await interaction.client.welcomeImageGenerator.checkTierLimits(serverDocument._id);

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
					name: "🎨 Template",
					value: config.template_id || "default",
					inline: true,
				},
				{
					name: "📐 Size",
					value: `${config.width}x${config.height}px`,
					inline: true,
				},
				{
					name: "🖼️ Format",
					value: config.format.toUpperCase(),
					inline: true,
				},
				{
					name: "💎 Tier Limits",
					value: [
						`Templates: ${limits.templates === -1 ? "Unlimited" : limits.templates}`,
						`Custom Uploads: ${limits.customUploads === -1 ? "Unlimited" : limits.customUploads}`,
					].join("\n"),
					inline: true,
				},
			];

			return interaction.reply({
				embeds: [{
					color: 0x3498db,
					title: "🖼️ Welcome Image Configuration",
					fields,
					footer: {
						text: "Visit the dashboard for advanced customization",
					},
				}],
				ephemeral: true,
			});
		} catch (err) {
			logger.error("Error showing welcome image status:", err);
			return interaction.reply({
				content: "❌ Failed to retrieve configuration.",
				ephemeral: true,
			});
		}
	},

	async testImage (interaction, serverDocument) {
		try {
			await interaction.deferReply({ ephemeral: true });

			const welcomeGenerator = interaction.client.welcomeImageGenerator;
			if (!welcomeGenerator) {
				return interaction.editReply({
					content: "❌ Welcome image system is not available.",
				});
			}

			const config = await welcomeGenerator.getServerConfig(serverDocument._id);
			if (!config) {
				return interaction.editReply({
					content: "❌ Welcome images not configured. Use `/welcomeimage enable` first.",
				});
			}

			// Generate test image
			const imageBuffer = await welcomeGenerator.generateWelcomeImage(interaction.member, config);

			const attachment = new AttachmentBuilder(imageBuffer, {
				name: `welcome-test.${config.format || "png"}`,
			});

			return interaction.editReply({
				content: "🖼️ Here's your welcome image preview!",
				files: [attachment],
			});
		} catch (err) {
			logger.error("Error generating test image:", err);
			return interaction.editReply({
				content: "❌ Failed to generate test image. Check the logs for details.",
			});
		}
	},

	async setTemplate (interaction, serverDocument) {
		try {
			const templateName = interaction.options.getString("name");

			const WelcomeImages = interaction.client.database.models.welcomeImages;
			const config = await WelcomeImages.findOne({ server_id: serverDocument._id }).exec();

			if (!config) {
				return interaction.reply({
					content: "❌ Welcome images not configured. Use `/welcomeimage enable` first.",
					ephemeral: true,
				});
			}

			await WelcomeImages.update(
				{ server_id: serverDocument._id },
				{
					template_id: templateName,
					background: {
						type: "builtin",
						value: templateName,
					},
					updated_at: new Date(),
				},
			);

			return interaction.reply({
				embeds: [{
					color: 0x2ecc71,
					title: "✅ Template Updated",
					description: `Welcome image template changed to **${templateName}**`,
					footer: {
						text: "Use /welcomeimage test to preview the new template",
					},
				}],
			});
		} catch (err) {
			logger.error("Error setting template:", err);
			return interaction.reply({
				content: "❌ Failed to update template.",
				ephemeral: true,
			});
		}
	},
};
