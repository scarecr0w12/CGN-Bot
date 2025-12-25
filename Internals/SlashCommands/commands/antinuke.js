const {
	SlashCommandBuilder,
	PermissionFlagsBits,
} = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("antinuke")
		.setDescription("Server protection against nuking (Tier 2)")
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable anti-nuke protection"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable anti-nuke protection"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View anti-nuke configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("whitelist")
				.setDescription("Whitelist a user from anti-nuke")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to whitelist")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unwhitelist")
				.setDescription("Remove user from whitelist")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to remove from whitelist")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("thresholds")
				.setDescription("Configure action thresholds")
				.addIntegerOption(opt =>
					opt.setName("ban_limit")
						.setDescription("Max bans per minute before action (0 to disable)")
						.setMinValue(0)
						.setMaxValue(50),
				)
				.addIntegerOption(opt =>
					opt.setName("kick_limit")
						.setDescription("Max kicks per minute before action (0 to disable)")
						.setMinValue(0)
						.setMaxValue(50),
				)
				.addIntegerOption(opt =>
					opt.setName("channel_delete_limit")
						.setDescription("Max channel deletes per minute (0 to disable)")
						.setMinValue(0)
						.setMaxValue(20),
				)
				.addIntegerOption(opt =>
					opt.setName("role_delete_limit")
						.setDescription("Max role deletes per minute (0 to disable)")
						.setMinValue(0)
						.setMaxValue(20),
				),
		)
		.addSubcommand(sub =>
			sub.setName("action")
				.setDescription("Set action to take on violation")
				.addStringOption(opt =>
					opt.setName("type")
						.setDescription("Action type")
						.setRequired(true)
						.addChoices(
							{ name: "Remove Roles (Safe)", value: "remove_roles" },
							{ name: "Kick", value: "kick" },
							{ name: "Ban", value: "ban" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("logs")
				.setDescription("View recent anti-nuke incidents"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		const TierManager = require("../../../Modules/TierManager");
		const tierCheck = await TierManager.checkFeatureAccess(interaction.guild.id, "antinuke");

		if (!tierCheck.allowed) {
			return interaction.reply({
				embeds: [{
					color: 0xED4245,
					title: "⭐ Premium Feature",
					description: "Anti-nuke protection is a **Tier 2 (Premium)** feature.\n\nUpgrade your server to access this functionality.",
				}],
				ephemeral: true,
			});
		}

		try {
			switch (subcommand) {
				case "enable":
					await this.enable(interaction, serverDocument);
					break;
				case "disable":
					await this.disable(interaction, serverDocument);
					break;
				case "status":
					await this.showStatus(interaction, serverDocument);
					break;
				case "whitelist":
					await this.addWhitelist(interaction, serverDocument);
					break;
				case "unwhitelist":
					await this.removeWhitelist(interaction, serverDocument);
					break;
				case "thresholds":
					await this.setThresholds(interaction, serverDocument);
					break;
				case "action":
					await this.setAction(interaction, serverDocument);
					break;
				case "logs":
					await this.viewLogs(interaction, serverDocument);
					break;
			}
		} catch (error) {
			logger.error("Antinuke command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	getDefaultConfig () {
		return {
			enabled: false,
			whitelist: [],
			thresholds: {
				ban_limit: 5,
				kick_limit: 10,
				channel_delete_limit: 3,
				role_delete_limit: 3,
			},
			action: "remove_roles",
			incidents: [],
		};
	},

	async enable (interaction, serverDocument) {
		const config = serverDocument.config.antinuke || this.getDefaultConfig();
		config.enabled = true;

		serverDocument.query.set("config.antinuke", config);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "🛡️ Anti-Nuke Enabled",
				description: "Server protection is now active.\n\n" +
					"**Monitored Actions:**\n" +
					"• Mass bans/kicks\n" +
					"• Channel deletions\n" +
					"• Role deletions\n\n" +
					"Use `/antinuke whitelist` to exempt trusted admins.",
				footer: { text: "Use /antinuke status to view configuration" },
			}],
			ephemeral: true,
		});
	},

	async disable (interaction, serverDocument) {
		serverDocument.query.set("config.antinuke.enabled", false);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0xED4245,
				title: "🛡️ Anti-Nuke Disabled",
				description: "Server protection has been disabled.",
			}],
			ephemeral: true,
		});
	},

	async showStatus (interaction, serverDocument) {
		const config = serverDocument.config.antinuke || this.getDefaultConfig();

		const whitelistText = config.whitelist?.length > 0 ?
			config.whitelist.map(id => `<@${id}>`).join(", ") :
			"None";

		const actionText = {
			remove_roles: "Remove Roles (Safe)",
			kick: "Kick",
			ban: "Ban",
		}[config.action] || "Remove Roles";

		await interaction.reply({
			embeds: [{
				color: config.enabled ? 0x57F287 : 0xED4245,
				title: "🛡️ Anti-Nuke Status",
				fields: [
					{ name: "Status", value: config.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Action", value: actionText, inline: true },
					{ name: "Incidents", value: String(config.incidents?.length || 0), inline: true },
					{
						name: "Thresholds (per minute)",
						value: `Bans: ${config.thresholds?.ban_limit || 5}\n` +
							`Kicks: ${config.thresholds?.kick_limit || 10}\n` +
							`Channel Deletes: ${config.thresholds?.channel_delete_limit || 3}\n` +
							`Role Deletes: ${config.thresholds?.role_delete_limit || 3}`,
					},
					{ name: "Whitelisted Users", value: whitelistText.slice(0, 1024) },
				],
			}],
			ephemeral: true,
		});
	},

	async addWhitelist (interaction, serverDocument) {
		const user = interaction.options.getUser("user");

		if (!serverDocument.config.antinuke) {
			serverDocument.query.set("config.antinuke", this.getDefaultConfig());
		}

		const whitelist = serverDocument.config.antinuke?.whitelist || [];
		if (whitelist.includes(user.id)) {
			return interaction.reply({
				content: `${user} is already whitelisted.`,
				ephemeral: true,
			});
		}

		serverDocument.query.push("config.antinuke.whitelist", user.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ User Whitelisted",
				description: `${user} has been added to the anti-nuke whitelist.\n\nThey will not trigger anti-nuke actions.`,
			}],
			ephemeral: true,
		});
	},

	async removeWhitelist (interaction, serverDocument) {
		const user = interaction.options.getUser("user");
		const whitelist = serverDocument.config.antinuke?.whitelist || [];

		if (!whitelist.includes(user.id)) {
			return interaction.reply({
				content: `${user} is not whitelisted.`,
				ephemeral: true,
			});
		}

		serverDocument.query.pull("config.antinuke.whitelist", user.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ User Removed from Whitelist",
				description: `${user} has been removed from the anti-nuke whitelist.`,
			}],
			ephemeral: true,
		});
	},

	async setThresholds (interaction, serverDocument) {
		const banLimit = interaction.options.getInteger("ban_limit");
		const kickLimit = interaction.options.getInteger("kick_limit");
		const channelDeleteLimit = interaction.options.getInteger("channel_delete_limit");
		const roleDeleteLimit = interaction.options.getInteger("role_delete_limit");

		if (!serverDocument.config.antinuke) {
			serverDocument.query.set("config.antinuke", this.getDefaultConfig());
		}

		if (banLimit !== null) {
			serverDocument.query.set("config.antinuke.thresholds.ban_limit", banLimit);
		}
		if (kickLimit !== null) {
			serverDocument.query.set("config.antinuke.thresholds.kick_limit", kickLimit);
		}
		if (channelDeleteLimit !== null) {
			serverDocument.query.set("config.antinuke.thresholds.channel_delete_limit", channelDeleteLimit);
		}
		if (roleDeleteLimit !== null) {
			serverDocument.query.set("config.antinuke.thresholds.role_delete_limit", roleDeleteLimit);
		}

		await serverDocument.save();

		const config = serverDocument.config.antinuke;

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "⚙️ Thresholds Updated",
				description: "Anti-nuke thresholds have been updated.",
				fields: [
					{ name: "Ban Limit", value: `${config.thresholds.ban_limit}/min`, inline: true },
					{ name: "Kick Limit", value: `${config.thresholds.kick_limit}/min`, inline: true },
					{ name: "Channel Delete", value: `${config.thresholds.channel_delete_limit}/min`, inline: true },
					{ name: "Role Delete", value: `${config.thresholds.role_delete_limit}/min`, inline: true },
				],
				footer: { text: "Set to 0 to disable specific checks" },
			}],
			ephemeral: true,
		});
	},

	async setAction (interaction, serverDocument) {
		const action = interaction.options.getString("type");

		if (!serverDocument.config.antinuke) {
			serverDocument.query.set("config.antinuke", this.getDefaultConfig());
		}

		serverDocument.query.set("config.antinuke.action", action);
		await serverDocument.save();

		const actionText = {
			remove_roles: "Remove all dangerous roles from the offender",
			kick: "Kick the offender from the server",
			ban: "Ban the offender from the server",
		}[action];

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "⚙️ Action Updated",
				description: `When anti-nuke is triggered, I will:\n\n**${actionText}**`,
			}],
			ephemeral: true,
		});
	},

	async viewLogs (interaction, serverDocument) {
		const config = serverDocument.config.antinuke || this.getDefaultConfig();
		const incidents = config.incidents || [];

		if (incidents.length === 0) {
			return interaction.reply({
				embeds: [{
					color: 0xFEE75C,
					title: "🛡️ Anti-Nuke Logs",
					description: "No incidents recorded.",
				}],
				ephemeral: true,
			});
		}

		const logList = incidents.slice(-10).reverse().map(inc => {
			const time = `<t:${Math.floor(new Date(inc.timestamp).getTime() / 1000)}:R>`;
			return `**${inc.type}** by <@${inc.user_id}> ${time}\n` +
				`   Action: ${inc.action_taken} | Count: ${inc.count}`;
		})
			.join("\n\n");

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "🛡️ Anti-Nuke Logs",
				description: logList,
				footer: { text: `${incidents.length} incident(s) recorded` },
			}],
			ephemeral: true,
		});
	},
};
