const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	name: "socialalerts",
	description: "Configure social media alert notifications",
	permissions: PermissionFlagsBits.ManageGuild,
	command: new SlashCommandBuilder()
		.setName("socialalerts")
		.setDescription("Configure social media alert notifications")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName("add")
				.setDescription("Add a social media alert")
				.addStringOption(option =>
					option
						.setName("platform")
						.setDescription("Social media platform")
						.setRequired(true)
						.addChoices(
							{ name: "Twitch", value: "twitch" },
							{ name: "YouTube", value: "youtube" },
						))
				.addStringOption(option =>
					option
						.setName("account")
						.setDescription("Account username or channel ID")
						.setRequired(true))
				.addChannelOption(option =>
					option
						.setName("channel")
						.setDescription("Discord channel for notifications")
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName("remove")
				.setDescription("Remove a social media alert")
				.addStringOption(option =>
					option
						.setName("id")
						.setDescription("Alert ID (use /socialalerts list to see IDs)")
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName("list")
				.setDescription("List all configured alerts"))
		.addSubcommand(subcommand =>
			subcommand
				.setName("toggle")
				.setDescription("Enable or disable an alert")
				.addStringOption(option =>
					option
						.setName("id")
						.setDescription("Alert ID")
						.setRequired(true))
				.addBooleanOption(option =>
					option
						.setName("enabled")
						.setDescription("Enable or disable")
						.setRequired(true))),

	async execute (interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "add":
				await this.handleAdd(interaction);
				break;
			case "remove":
				await this.handleRemove(interaction);
				break;
			case "list":
				await this.handleList(interaction);
				break;
			case "toggle":
				await this.handleToggle(interaction);
				break;
		}
	},

	async handleAdd (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const platform = interaction.options.getString("platform");
		const account = interaction.options.getString("account");
		const channel = interaction.options.getChannel("channel");

		try {
			const manager = interaction.client.socialAlerts;
			if (!manager) {
				return interaction.editReply("❌ Social alerts system is not initialized.");
			}

			// Resolve account ID based on platform
			let accountId, accountName;

			if (platform === "twitch") {
				const monitor = manager.monitors.get("twitch");
				const user = await monitor.getUserByLogin(account);
				if (!user) {
					return interaction.editReply("❌ Twitch user not found. Please check the username.");
				}
				accountId = user.id;
				accountName = user.display_name;
			} else if (platform === "youtube") {
				const monitor = manager.monitors.get("youtube");
				let channelData = await monitor.getChannelByUsername(account);
				if (!channelData) {
					channelData = await monitor.getChannelById(account);
				}
				if (!channelData) {
					return interaction.editReply("❌ YouTube channel not found. Please provide a valid username or channel ID.");
				}
				accountId = channelData.id;
				accountName = channelData.snippet.title;
			}

			// Add alert
			await manager.addAlert({
				server_id: interaction.guild.id,
				channel_id: channel.id,
				platform,
				account_id: accountId,
				account_name: accountName,
			});

			const message = [
				"✅ Social alert added!",
				"",
				`**Platform:** ${platform}`,
				`**Account:** ${accountName}`,
				`**Channel:** ${channel}`,
				"",
				"Notifications will be sent when this account goes live or posts new content.",
			].join("\n");

			await interaction.editReply({ content: message });
		} catch (error) {
			console.error("Error adding social alert:", error);
			await interaction.editReply(`❌ Error: ${error.message}`);
		}
	},

	async handleRemove (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const alertId = interaction.options.getString("id");

		try {
			const manager = interaction.client.socialAlerts;
			await manager.removeAlert(alertId);

			await interaction.editReply("✅ Social alert removed successfully.");
		} catch (error) {
			console.error("Error removing social alert:", error);
			await interaction.editReply(`❌ Error: ${error.message}`);
		}
	},

	async handleList (interaction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			const manager = interaction.client.socialAlerts;
			const alerts = await manager.getServerAlerts(interaction.guild.id);

			if (alerts.length === 0) {
				return interaction.editReply("📭 No social alerts configured for this server.\n\nUse `/socialalerts add` to add one.");
			}

			const tierLimits = await manager.checkTierLimits(interaction.guild.id);

			const { EmbedBuilder } = require("discord.js");
			const embed = new EmbedBuilder()
				.setTitle("🔔 Social Media Alerts")
				.setDescription(`Configured alerts for this server (${alerts.length}/${tierLimits.max})`)
				.setColor("#5865F2");

			for (const alert of alerts) {
				const status = alert.enabled ? "✅ Enabled" : "❌ Disabled";
				const channel = interaction.guild.channels.cache.get(alert.channel_id);
				const platformEmoji = alert.platform === "twitch" ? "🎮" : "🎥";

				embed.addFields({
					name: `${platformEmoji} ${alert.account_name}`,
					value: `**ID:** \`${alert._id}\`\n**Platform:** ${alert.platform}\n**Channel:** ${channel || "Unknown"}\n**Status:** ${status}`,
					inline: false,
				});
			}

			embed.setFooter({ text: `Upgrade to increase your alert limit • Current tier allows ${tierLimits.max} alerts` });

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error("Error listing social alerts:", error);
			await interaction.editReply(`❌ Error: ${error.message}`);
		}
	},

	async handleToggle (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const alertId = interaction.options.getString("id");
		const enabled = interaction.options.getBoolean("enabled");

		try {
			const SocialAlerts = interaction.client.database.models.socialAlerts;
			await SocialAlerts.update({ _id: alertId }, { enabled });

			await interaction.editReply(`✅ Alert ${enabled ? "enabled" : "disabled"} successfully.`);
		} catch (error) {
			console.error("Error toggling social alert:", error);
			await interaction.editReply(`❌ Error: ${error.message}`);
		}
	},
};
