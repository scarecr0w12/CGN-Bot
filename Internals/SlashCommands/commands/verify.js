const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("verify")
		.setDescription("Member verification system")
		.addSubcommand(sub =>
			sub.setName("setup")
				.setDescription("Set up verification system")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to give verified members")
						.setRequired(true),
				)
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel for verification message")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("type")
						.setDescription("Verification type")
						.setRequired(true)
						.addChoices(
							{ name: "Button Click", value: "button" },
							{ name: "Reaction", value: "reaction" },
							{ name: "Command", value: "command" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("message")
				.setDescription("Customize the verification message")
				.addStringOption(opt =>
					opt.setName("title")
						.setDescription("Title for the verification embed")
						.setMaxLength(100),
				)
				.addStringOption(opt =>
					opt.setName("description")
						.setDescription("Description for the verification embed")
						.setMaxLength(2000),
				),
		)
		.addSubcommand(sub =>
			sub.setName("post")
				.setDescription("Post the verification message"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable verification system"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View verification system status"),
		)
		.addSubcommand(sub =>
			sub.setName("manual")
				.setDescription("Manually verify a member")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to verify")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unverify")
				.setDescription("Remove verification from a member")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to unverify")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "setup":
					await this.setup(interaction, serverDocument);
					break;
				case "message":
					await this.customizeMessage(interaction, serverDocument);
					break;
				case "post":
					await this.postMessage(interaction, serverDocument);
					break;
				case "disable":
					await this.disable(interaction, serverDocument);
					break;
				case "status":
					await this.showStatus(interaction, serverDocument);
					break;
				case "manual":
					await this.manualVerify(interaction, serverDocument);
					break;
				case "unverify":
					await this.unverify(interaction, serverDocument);
					break;
			}
		} catch (error) {
			logger.error("Verify command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async setup (interaction, serverDocument) {
		const role = interaction.options.getRole("role");
		const channel = interaction.options.getChannel("channel");
		const type = interaction.options.getString("type");

		if (role.managed || role.id === interaction.guild.id) {
			throw new Error("Cannot use managed roles or @everyone as verification role.");
		}

		const botMember = interaction.guild.members.me;
		if (botMember.roles.highest.position <= role.position) {
			throw new Error("I cannot assign this role. Please move my role higher in the role hierarchy.");
		}

		serverDocument.query.set("config.verification", {
			enabled: true,
			role_id: role.id,
			channel_id: channel.id,
			type: type,
			message_id: null,
			title: "✅ Server Verification",
			description: "Please verify yourself to gain access to the server.\n\nBy verifying, you agree to follow the server rules.",
		});

		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Verification Setup",
				description: "Verification system has been configured.",
				fields: [
					{ name: "Role", value: `${role}`, inline: true },
					{ name: "Channel", value: `${channel}`, inline: true },
					{ name: "Type", value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
				],
				footer: { text: "Use /verify post to post the verification message" },
			}],
			ephemeral: true,
		});
	},

	async customizeMessage (interaction, serverDocument) {
		const config = serverDocument.config.verification;

		if (!config?.enabled) {
			throw new Error("Verification system is not set up. Use `/verify setup` first.");
		}

		const title = interaction.options.getString("title");
		const description = interaction.options.getString("description");

		if (title) {
			serverDocument.query.set("config.verification.title", title);
		}
		if (description) {
			serverDocument.query.set("config.verification.description", description);
		}

		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Message Updated",
				description: "Verification message has been customized.",
				fields: [
					{ name: "Title", value: title || config.title || "Not set" },
					{ name: "Description", value: (description || config.description || "Not set").slice(0, 200) },
				],
				footer: { text: "Use /verify post to update the posted message" },
			}],
			ephemeral: true,
		});
	},

	async postMessage (interaction, serverDocument) {
		const config = serverDocument.config.verification;

		if (!config?.enabled) {
			throw new Error("Verification system is not set up. Use `/verify setup` first.");
		}

		const channel = interaction.guild.channels.cache.get(config.channel_id);
		if (!channel) {
			throw new Error("Verification channel not found. Please run setup again.");
		}

		const embed = {
			color: 0x5865F2,
			title: config.title || "✅ Server Verification",
			description: config.description || "Please verify yourself to gain access to the server.",
			footer: { text: `Verification Type: ${config.type}` },
		};

		let components = [];
		let content = null;

		if (config.type === "button") {
			const button = new ButtonBuilder()
				.setCustomId("verify_button")
				.setLabel("Verify")
				.setStyle(ButtonStyle.Success)
				.setEmoji("✅");

			const row = new ActionRowBuilder().addComponents(button);
			components = [row];
		} else if (config.type === "reaction") {
			embed.footer.text = "React with ✅ to verify";
		} else if (config.type === "command") {
			embed.footer.text = "Use /verify to get verified";
			content = "Type `/verify` in any channel to verify yourself.";
		}

		if (config.message_id) {
			try {
				const oldMessage = await channel.messages.fetch(config.message_id);
				await oldMessage.delete();
			} catch {
				// Message already deleted
			}
		}

		const message = await channel.send({
			content,
			embeds: [embed],
			components,
		});

		if (config.type === "reaction") {
			await message.react("✅");
		}

		serverDocument.query.set("config.verification.message_id", message.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Verification Message Posted",
				description: `Verification message has been posted in ${channel}.`,
			}],
			ephemeral: true,
		});
	},

	async disable (interaction, serverDocument) {
		const config = serverDocument.config.verification;

		if (config?.message_id && config?.channel_id) {
			try {
				const channel = interaction.guild.channels.cache.get(config.channel_id);
				if (channel) {
					const message = await channel.messages.fetch(config.message_id);
					await message.delete();
				}
			} catch {
				// Message already deleted
			}
		}

		serverDocument.query.set("config.verification.enabled", false);
		serverDocument.query.set("config.verification.message_id", null);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0xED4245,
				title: "❌ Verification Disabled",
				description: "Verification system has been disabled.\nExisting verified members will keep their role.",
			}],
			ephemeral: true,
		});
	},

	async showStatus (interaction, serverDocument) {
		const config = serverDocument.config.verification;

		if (!config?.enabled) {
			return interaction.reply({
				embeds: [{
					color: 0xFEE75C,
					title: "📋 Verification Status",
					description: "Verification system is **not configured**.\n\nUse `/verify setup` to set it up.",
				}],
				ephemeral: true,
			});
		}

		const role = interaction.guild.roles.cache.get(config.role_id);
		const channel = interaction.guild.channels.cache.get(config.channel_id);
		const verifiedCount = role ? role.members.size : 0;

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "📋 Verification Status",
				fields: [
					{ name: "Status", value: config.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Type", value: config.type?.charAt(0).toUpperCase() + config.type?.slice(1) || "Unknown", inline: true },
					{ name: "Role", value: role ? `${role}` : "Not found", inline: true },
					{ name: "Channel", value: channel ? `${channel}` : "Not found", inline: true },
					{ name: "Message Posted", value: config.message_id ? "Yes" : "No", inline: true },
					{ name: "Verified Members", value: String(verifiedCount), inline: true },
				],
			}],
			ephemeral: true,
		});
	},

	async manualVerify (interaction, serverDocument) {
		const config = serverDocument.config.verification;

		if (!config?.enabled || !config?.role_id) {
			throw new Error("Verification system is not set up.");
		}

		// Check bot permissions
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			throw new Error("I need the **Manage Roles** permission to verify members.");
		}

		const user = interaction.options.getUser("user");
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			throw new Error("User is not in this server.");
		}

		const role = interaction.guild.roles.cache.get(config.role_id);
		if (!role) {
			throw new Error("Verification role not found.");
		}

		// Check role hierarchy
		if (interaction.guild.members.me.roles.highest.position <= role.position) {
			throw new Error("I cannot assign the verification role. It's higher than or equal to my highest role.");
		}

		if (member.roles.cache.has(role.id)) {
			throw new Error("User is already verified.");
		}

		await member.roles.add(role, `Manually verified by ${interaction.user.tag}`);

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Member Verified",
				description: `${user} has been manually verified and given the ${role} role.`,
			}],
			ephemeral: true,
		});
	},

	async unverify (interaction, serverDocument) {
		const config = serverDocument.config.verification;

		if (!config?.enabled || !config?.role_id) {
			throw new Error("Verification system is not set up.");
		}

		// Check bot permissions
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			throw new Error("I need the **Manage Roles** permission to unverify members.");
		}

		const user = interaction.options.getUser("user");
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			throw new Error("User is not in this server.");
		}

		const role = interaction.guild.roles.cache.get(config.role_id);
		if (!role) {
			throw new Error("Verification role not found.");
		}

		// Check role hierarchy
		if (interaction.guild.members.me.roles.highest.position <= role.position) {
			throw new Error("I cannot remove the verification role. It's higher than or equal to my highest role.");
		}

		if (!member.roles.cache.has(role.id)) {
			throw new Error("User is not verified.");
		}

		await member.roles.remove(role, `Unverified by ${interaction.user.tag}`);

		await interaction.reply({
			embeds: [{
				color: 0xED4245,
				title: "❌ Member Unverified",
				description: `${user} has been unverified and the ${role} role has been removed.`,
			}],
			ephemeral: true,
		});
	},
};
