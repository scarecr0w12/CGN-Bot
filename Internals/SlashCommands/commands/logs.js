const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("logs")
		.setDescription("Server logging and audit management")
		.addSubcommand(sub =>
			sub.setName("channel")
				.setDescription("Set the logging channel")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel for logs")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("enable")
				.setDescription("Enable logging"),
		)
		.addSubcommand(sub =>
			sub.setName("disable")
				.setDescription("Disable logging"),
		)
		.addSubcommand(sub =>
			sub.setName("status")
				.setDescription("View logging configuration"),
		)
		.addSubcommand(sub =>
			sub.setName("events")
				.setDescription("Configure which events to log")
				.addStringOption(opt =>
					opt.setName("event")
						.setDescription("Event type to toggle")
						.setRequired(true)
						.addChoices(
							{ name: "Message Deletes", value: "message_deleted" },
							{ name: "Message Edits", value: "message_edited" },
							{ name: "Member Joins", value: "member_joined" },
							{ name: "Member Leaves", value: "member_left" },
							{ name: "Member Bans", value: "member_banned" },
							{ name: "Member Unbans", value: "member_unbanned" },
							{ name: "Role Changes", value: "role_changes" },
							{ name: "Channel Changes", value: "channel_changes" },
							{ name: "Voice Activity", value: "voice_activity" },
							{ name: "Nickname Changes", value: "nickname_changes" },
						),
				)
				.addBooleanOption(opt =>
					opt.setName("enabled")
						.setDescription("Enable or disable this event")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("view")
				.setDescription("View recent mod actions")
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("Number of entries to show")
						.setMinValue(1)
						.setMaxValue(25),
				),
		)
		.addSubcommand(sub =>
			sub.setName("user")
				.setDescription("View action history for a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to check")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("ignore")
				.setDescription("Ignore a channel from logging")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to ignore")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unignore")
				.setDescription("Stop ignoring a channel")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to unignore")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "channel":
					await this.setChannel(interaction, serverDocument);
					break;
				case "enable":
					await this.enableLogs(interaction, serverDocument);
					break;
				case "disable":
					await this.disableLogs(interaction, serverDocument);
					break;
				case "status":
					await this.showStatus(interaction, serverDocument);
					break;
				case "events":
					await this.toggleEvent(interaction, serverDocument);
					break;
				case "view":
					await this.viewLogs(interaction, serverDocument);
					break;
				case "user":
					await this.userHistory(interaction, serverDocument);
					break;
				case "ignore":
					await this.ignoreChannel(interaction, serverDocument);
					break;
				case "unignore":
					await this.unignoreChannel(interaction, serverDocument);
					break;
			}
		} catch (error) {
			logger.error("Logs command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async setChannel (interaction, serverDocument) {
		const channel = interaction.options.getChannel("channel");

		if (!serverDocument.config.moderation) {
			serverDocument.query.set("config.moderation", {});
		}

		serverDocument.query.set("config.moderation.mod_log_channel_id", channel.id);
		serverDocument.query.set("config.moderation.isEnabled", true);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "📋 Log Channel Set",
				description: `Logs will now be sent to ${channel}`,
			}],
			ephemeral: true,
		});
	},

	async enableLogs (interaction, serverDocument) {
		if (!serverDocument.config.moderation?.mod_log_channel_id) {
			return interaction.reply({
				content: "❌ Please set a log channel first with `/logs channel`",
				ephemeral: true,
			});
		}

		serverDocument.query.set("config.moderation.isEnabled", true);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Logging Enabled",
				description: "Server logging is now active.",
			}],
			ephemeral: true,
		});
	},

	async disableLogs (interaction, serverDocument) {
		serverDocument.query.set("config.moderation.isEnabled", false);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0xED4245,
				title: "❌ Logging Disabled",
				description: "Server logging has been disabled.",
			}],
			ephemeral: true,
		});
	},

	async showStatus (interaction, serverDocument) {
		const modConfig = serverDocument.config.moderation || {};
		const logChannel = modConfig.mod_log_channel_id ? `<#${modConfig.mod_log_channel_id}>` : "Not set";
		const isEnabled = modConfig.isEnabled !== false;
		const events = modConfig.log_events || {};
		const ignoredChannels = modConfig.ignored_channels || [];

		const eventList = [
			`Message Deletes: ${events.message_deleted !== false ? "✅" : "❌"}`,
			`Message Edits: ${events.message_edited !== false ? "✅" : "❌"}`,
			`Member Joins: ${events.member_joined !== false ? "✅" : "❌"}`,
			`Member Leaves: ${events.member_left !== false ? "✅" : "❌"}`,
			`Member Bans: ${events.member_banned !== false ? "✅" : "❌"}`,
			`Role Changes: ${events.role_changes !== false ? "✅" : "❌"}`,
			`Voice Activity: ${events.voice_activity === true ? "✅" : "❌"}`,
			`Nickname Changes: ${events.nickname_changes === true ? "✅" : "❌"}`,
		].join("\n");

		const ignoredList = ignoredChannels.length > 0 ?
			ignoredChannels.map(id => `<#${id}>`).join(", ") :
			"None";

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "📋 Logging Configuration",
				fields: [
					{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Channel", value: logChannel, inline: true },
					{ name: "Events", value: eventList },
					{ name: "Ignored Channels", value: ignoredList },
				],
			}],
			ephemeral: true,
		});
	},

	async toggleEvent (interaction, serverDocument) {
		const event = interaction.options.getString("event");
		const enabled = interaction.options.getBoolean("enabled");

		if (!serverDocument.config.moderation) {
			serverDocument.query.set("config.moderation", {});
		}
		if (!serverDocument.config.moderation.log_events) {
			serverDocument.query.set("config.moderation.log_events", {});
		}

		serverDocument.query.set(`config.moderation.log_events.${event}`, enabled);
		await serverDocument.save();

		const eventNames = {
			message_deleted: "Message Deletes",
			message_edited: "Message Edits",
			member_joined: "Member Joins",
			member_left: "Member Leaves",
			member_banned: "Member Bans",
			member_unbanned: "Member Unbans",
			role_changes: "Role Changes",
			channel_changes: "Channel Changes",
			voice_activity: "Voice Activity",
			nickname_changes: "Nickname Changes",
		};

		await interaction.reply({
			embeds: [{
				color: enabled ? 0x57F287 : 0xED4245,
				description: `${enabled ? "✅" : "❌"} **${eventNames[event]}** logging ${enabled ? "enabled" : "disabled"}`,
			}],
			ephemeral: true,
		});
	},

	async viewLogs (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const limit = interaction.options.getInteger("limit") || 10;
		const modLog = serverDocument.mod_log || [];

		if (modLog.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "📋 Mod Log",
					description: "No moderation actions recorded yet.",
				}],
			});
		}

		const recentLogs = modLog.slice(-limit).reverse();

		const logEntries = await Promise.all(recentLogs.map(async entry => {
			const moderator = await interaction.client.users.fetch(entry.mod_id).catch(() => null);
			const target = entry.user_id ?
				await interaction.client.users.fetch(entry.user_id).catch(() => null) :
				null;
			const time = entry.timestamp ?
				`<t:${Math.floor(new Date(entry.timestamp).getTime() / 1000)}:R>` :
				"Unknown";

			return `**${entry.action || "Action"}** ${time}\n` +
				`Mod: ${moderator?.tag || "Unknown"}\n` +
				`${target ? `Target: ${target.tag}\n` : ""}` +
				`${entry.reason ? `Reason: ${entry.reason}` : ""}`;
		}));

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "📋 Recent Mod Actions",
				description: logEntries.join("\n\n") || "No entries",
				footer: { text: `Showing ${recentLogs.length} of ${modLog.length} entries` },
			}],
		});
	},

	async userHistory (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser("user");
		const modLog = serverDocument.mod_log || [];

		const userActions = modLog.filter(entry =>
			entry.user_id === user.id || entry.mod_id === user.id,
		);

		if (userActions.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: `📋 History for ${user.tag}`,
					description: "No moderation actions found for this user.",
					thumbnail: { url: user.displayAvatarURL() },
				}],
			});
		}

		const asTarget = userActions.filter(e => e.user_id === user.id);
		const asMod = userActions.filter(e => e.mod_id === user.id);

		const targetList = asTarget.slice(-5).map(e => {
			const time = e.timestamp ?
				`<t:${Math.floor(new Date(e.timestamp).getTime() / 1000)}:R>` :
				"";
			return `• ${e.action || "Action"} ${time}`;
		}).join("\n") || "None";

		const modList = asMod.slice(-5).map(e => {
			const time = e.timestamp ?
				`<t:${Math.floor(new Date(e.timestamp).getTime() / 1000)}:R>` :
				"";
			return `• ${e.action || "Action"} ${time}`;
		}).join("\n") || "None";

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: `📋 History for ${user.tag}`,
				thumbnail: { url: user.displayAvatarURL() },
				fields: [
					{ name: `Actions Received (${asTarget.length})`, value: targetList },
					{ name: `Actions Performed (${asMod.length})`, value: modList },
				],
			}],
		});
	},

	async ignoreChannel (interaction, serverDocument) {
		const channel = interaction.options.getChannel("channel");

		if (!serverDocument.config.moderation) {
			serverDocument.query.set("config.moderation", {});
		}

		const ignored = serverDocument.config.moderation.ignored_channels || [];
		if (ignored.includes(channel.id)) {
			return interaction.reply({
				content: `${channel} is already being ignored.`,
				ephemeral: true,
			});
		}

		serverDocument.query.push("config.moderation.ignored_channels", channel.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				description: `✅ ${channel} will now be ignored from logging.`,
			}],
			ephemeral: true,
		});
	},

	async unignoreChannel (interaction, serverDocument) {
		const channel = interaction.options.getChannel("channel");

		const ignored = serverDocument.config.moderation?.ignored_channels || [];
		if (!ignored.includes(channel.id)) {
			return interaction.reply({
				content: `${channel} is not being ignored.`,
				ephemeral: true,
			});
		}

		serverDocument.query.pull("config.moderation.ignored_channels", channel.id);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				description: `✅ ${channel} will now be included in logging.`,
			}],
			ephemeral: true,
		});
	},
};
