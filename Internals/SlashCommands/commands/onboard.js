const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("onboard")
		.setDescription("Member onboarding and welcome configuration")
		.addSubcommand(sub =>
			sub.setName("welcome")
				.setDescription("Configure welcome messages")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Welcome message channel")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("message")
						.setDescription("Welcome message ({user} = mention, {server} = server name)")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("roles")
				.setDescription("Configure onboarding role selection")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel for role selection message")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("title")
						.setDescription("Title for role selection")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("description")
						.setDescription("Description for role selection"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("rules")
				.setDescription("Configure rules acceptance")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Rules channel")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				)
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to give on acceptance")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("rules")
						.setDescription("Server rules text")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("dm")
				.setDescription("Configure DM welcome message")
				.addStringOption(opt =>
					opt.setName("message")
						.setDescription("DM message ({user} = username, {server} = server name)")
						.setRequired(true),
				)
				.addBooleanOption(opt =>
					opt.setName("enabled")
						.setDescription("Enable/disable DM welcomes"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("preview")
				.setDescription("Preview the welcome message"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View onboarding configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable onboarding features")
				.addStringOption(opt =>
					opt.setName("feature")
						.setDescription("Feature to disable")
						.setRequired(true)
						.addChoices(
							{ name: "Welcome Messages", value: "welcome" },
							{ name: "DM Messages", value: "dm" },
							{ name: "Rules Acceptance", value: "rules" },
						),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "welcome":
					await this.configureWelcome(interaction, serverDocument);
					break;
				case "roles":
					await this.configureRoles(interaction, serverDocument);
					break;
				case "rules":
					await this.configureRules(interaction, serverDocument);
					break;
				case "dm":
					await this.configureDM(interaction, serverDocument);
					break;
				case "preview":
					await this.previewWelcome(interaction, serverDocument);
					break;
				case "status":
					await this.showStatus(interaction, serverDocument);
					break;
				case "disable":
					await this.disableFeature(interaction, serverDocument);
					break;
			}
		} catch (error) {
			logger.error("Onboard command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async configureWelcome (interaction, serverDocument) {
		const channel = interaction.options.getChannel("channel");
		const message = interaction.options.getString("message");

		if (!serverDocument.config.moderation) {
			serverDocument.query.set("config.moderation", {});
		}

		serverDocument.query.set("config.moderation.welcome_channel_id", channel.id);
		serverDocument.query.set("config.moderation.welcome_message", message);
		serverDocument.query.set("config.moderation.welcome_enabled", true);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Welcome Message Configured",
				fields: [
					{ name: "Channel", value: `${channel}`, inline: true },
					{ name: "Message Preview", value: this.formatWelcome(message, interaction.user, interaction.guild) },
				],
			}],
			ephemeral: true,
		});
	},

	async configureRoles (interaction, serverDocument) {
		const channel = interaction.options.getChannel("channel");
		const title = interaction.options.getString("title");
		const description = interaction.options.getString("description") || "Select roles below to customize your experience!";

		// Get joinable roles from server config
		const joinableRoles = serverDocument.config.custom_roles || [];
		if (joinableRoles.length === 0) {
			return interaction.reply({
				content: "❌ No joinable roles configured. Use `/roles` to add some first.",
				ephemeral: true,
			});
		}

		const roleOptions = [];
		for (const roleId of joinableRoles.slice(0, 25)) {
			const role = interaction.guild.roles.cache.get(roleId);
			if (role) {
				roleOptions.push({
					label: role.name,
					value: role.id,
					emoji: "🏷️",
				});
			}
		}

		if (roleOptions.length === 0) {
			return interaction.reply({
				content: "❌ No valid joinable roles found.",
				ephemeral: true,
			});
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("onboard_roles")
			.setPlaceholder("Select your roles...")
			.setMinValues(0)
			.setMaxValues(roleOptions.length)
			.addOptions(roleOptions);

		const row = new ActionRowBuilder().addComponents(selectMenu);

		const msg = await channel.send({
			embeds: [{
				color: 0x5865F2,
				title: `🎭 ${title}`,
				description,
				footer: { text: "Select roles from the dropdown below" },
			}],
			components: [row],
		});

		serverDocument.query.set("config.onboard_roles_message", msg.id);
		serverDocument.query.set("config.onboard_roles_channel", channel.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Role Selection Configured",
				description: `Role selection message sent to ${channel}`,
			}],
			ephemeral: true,
		});
	},

	async configureRules (interaction, serverDocument) {
		const channel = interaction.options.getChannel("channel");
		const role = interaction.options.getRole("role");
		const rules = interaction.options.getString("rules");

		const acceptButton = new ButtonBuilder()
			.setCustomId(`rules_accept_${role.id}`)
			.setLabel("I Accept the Rules")
			.setStyle(ButtonStyle.Success)
			.setEmoji("✅");

		const row = new ActionRowBuilder().addComponents(acceptButton);

		const msg = await channel.send({
			embeds: [{
				color: 0x5865F2,
				title: "📜 Server Rules",
				description: rules,
				footer: { text: "Click the button below to accept and gain access" },
			}],
			components: [row],
		});

		if (!serverDocument.config.moderation) {
			serverDocument.query.set("config.moderation", {});
		}

		serverDocument.query.set("config.rules_message_id", msg.id);
		serverDocument.query.set("config.rules_channel_id", channel.id);
		serverDocument.query.set("config.rules_role_id", role.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Rules Acceptance Configured",
				fields: [
					{ name: "Channel", value: `${channel}`, inline: true },
					{ name: "Role", value: `${role}`, inline: true },
				],
			}],
			ephemeral: true,
		});
	},

	async configureDM (interaction, serverDocument) {
		const message = interaction.options.getString("message");
		const enabled = interaction.options.getBoolean("enabled") ?? true;

		if (!serverDocument.config.moderation) {
			serverDocument.query.set("config.moderation", {});
		}

		serverDocument.query.set("config.moderation.dm_welcome_message", message);
		serverDocument.query.set("config.moderation.dm_welcome_enabled", enabled);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ DM Welcome Configured",
				fields: [
					{ name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Preview", value: this.formatWelcome(message, interaction.user, interaction.guild) },
				],
			}],
			ephemeral: true,
		});
	},

	async previewWelcome (interaction, serverDocument) {
		const modConfig = serverDocument.config.moderation || {};
		const message = modConfig.welcome_message || "Welcome to {server}, {user}!";

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "👋 Welcome Message Preview",
				description: this.formatWelcome(message, interaction.user, interaction.guild),
				footer: { text: "This is how the welcome message will appear" },
			}],
			ephemeral: true,
		});
	},

	async showStatus (interaction, serverDocument) {
		const modConfig = serverDocument.config.moderation || {};
		const config = serverDocument.config || {};

		const welcomeEnabled = modConfig.welcome_enabled ? "✅" : "❌";
		const welcomeChannel = modConfig.welcome_channel_id ?
			`<#${modConfig.welcome_channel_id}>` : "Not set";

		const dmEnabled = modConfig.dm_welcome_enabled ? "✅" : "❌";

		const rulesChannel = config.rules_channel_id ?
			`<#${config.rules_channel_id}>` : "Not set";
		const rulesRole = config.rules_role_id ?
			`<@&${config.rules_role_id}>` : "Not set";

		const rolesChannel = config.onboard_roles_channel ?
			`<#${config.onboard_roles_channel}>` : "Not set";

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "🚀 Onboarding Configuration",
				fields: [
					{
						name: "Welcome Messages",
						value: `${welcomeEnabled} Channel: ${welcomeChannel}`,
						inline: false,
					},
					{
						name: "DM Welcomes",
						value: `${dmEnabled} Enabled`,
						inline: true,
					},
					{
						name: "Rules Acceptance",
						value: `Channel: ${rulesChannel}\nRole: ${rulesRole}`,
						inline: false,
					},
					{
						name: "Role Selection",
						value: `Channel: ${rolesChannel}`,
						inline: true,
					},
				],
			}],
			ephemeral: true,
		});
	},

	async disableFeature (interaction, serverDocument) {
		const feature = interaction.options.getString("feature");

		switch (feature) {
			case "welcome":
				serverDocument.query.set("config.moderation.welcome_enabled", false);
				break;
			case "dm":
				serverDocument.query.set("config.moderation.dm_welcome_enabled", false);
				break;
			case "rules":
				serverDocument.query.set("config.rules_message_id", null);
				serverDocument.query.set("config.rules_role_id", null);
				break;
		}

		await serverDocument.save();

		const featureNames = {
			welcome: "Welcome Messages",
			dm: "DM Messages",
			rules: "Rules Acceptance",
		};

		await interaction.reply({
			embeds: [{
				color: 0xED4245,
				description: `❌ **${featureNames[feature]}** has been disabled.`,
			}],
			ephemeral: true,
		});
	},

	formatWelcome (message, user, guild) {
		return message
			.replace(/{user}/g, `<@${user.id}>`)
			.replace(/{username}/g, user.username)
			.replace(/{server}/g, guild.name)
			.replace(/{membercount}/g, guild.memberCount);
	},
};
