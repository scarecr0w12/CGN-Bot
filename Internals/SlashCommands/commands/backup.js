const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("backup")
		.setDescription("Server backup and restore system (Tier 2)")
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a server backup")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Name for this backup")
						.setMaxLength(50),
				),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all server backups"),
		)
		.addSubcommand(sub =>
			sub.setName("info")
				.setDescription("View backup details")
				.addStringOption(opt =>
					opt.setName("backup_id")
						.setDescription("Backup ID to view")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("restore")
				.setDescription("Restore from a backup")
				.addStringOption(opt =>
					opt.setName("backup_id")
						.setDescription("Backup ID to restore")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("components")
						.setDescription("What to restore")
						.addChoices(
							{ name: "All", value: "all" },
							{ name: "Roles Only", value: "roles" },
							{ name: "Channels Only", value: "channels" },
							{ name: "Settings Only", value: "settings" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete a backup")
				.addStringOption(opt =>
					opt.setName("backup_id")
						.setDescription("Backup ID to delete")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("schedule")
				.setDescription("Configure automatic backups")
				.addStringOption(opt =>
					opt.setName("frequency")
						.setDescription("Backup frequency")
						.setRequired(true)
						.addChoices(
							{ name: "Disabled", value: "disabled" },
							{ name: "Daily", value: "daily" },
							{ name: "Weekly", value: "weekly" },
							{ name: "Monthly", value: "monthly" },
						),
				)
				.addIntegerOption(opt =>
					opt.setName("keep")
						.setDescription("Number of backups to keep (1-10)")
						.setMinValue(1)
						.setMaxValue(10),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		const TierManager = require("../../../Modules/TierManager");
		const tierCheck = await TierManager.checkFeatureAccess(interaction.guild.id, "backup");

		if (!tierCheck.allowed) {
			return interaction.reply({
				embeds: [{
					color: 0xED4245,
					title: "⭐ Premium Feature",
					description: "Server backup is a **Tier 2 (Premium)** feature.\n\nUpgrade your server to access this functionality.",
				}],
				ephemeral: true,
			});
		}

		try {
			switch (subcommand) {
				case "create":
					await this.createBackup(interaction, serverDocument);
					break;
				case "list":
					await this.listBackups(interaction, serverDocument);
					break;
				case "info":
					await this.backupInfo(interaction, serverDocument);
					break;
				case "restore":
					await this.restoreBackup(interaction, serverDocument);
					break;
				case "delete":
					await this.deleteBackup(interaction, serverDocument);
					break;
				case "schedule":
					await this.configureSchedule(interaction, serverDocument);
					break;
			}
		} catch (error) {
			logger.error("Backup command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async createBackup (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString("name") || `Backup ${new Date().toLocaleDateString()}`;
		const guild = interaction.guild;

		const backup = {
			_id: `${guild.id}_${Date.now()}`,
			name: name,
			created_at: new Date(),
			created_by: interaction.user.id,
			guild_name: guild.name,
			guild_icon: guild.iconURL(),
			member_count: guild.memberCount,
			data: {
				roles: [],
				channels: [],
				settings: {},
			},
		};

		for (const [, role] of guild.roles.cache.sort((a, b) => b.position - a.position)) {
			if (role.managed || role.id === guild.id) continue;
			backup.data.roles.push({
				name: role.name,
				color: role.hexColor,
				hoist: role.hoist,
				position: role.position,
				permissions: role.permissions.bitfield.toString(),
				mentionable: role.mentionable,
			});
		}

		for (const [, channel] of guild.channels.cache.sort((a, b) => (a.position || 0) - (b.position || 0))) {
			const channelData = {
				name: channel.name,
				type: channel.type,
				position: channel.position,
				parent_name: channel.parent?.name || null,
			};

			if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
				channelData.topic = channel.topic;
				channelData.nsfw = channel.nsfw;
				channelData.slowmode = channel.rateLimitPerUser;
			}

			if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
				channelData.bitrate = channel.bitrate;
				channelData.user_limit = channel.userLimit;
			}

			const overwrites = [];
			for (const [id, overwrite] of channel.permissionOverwrites.cache) {
				const role = guild.roles.cache.get(id);
				if (role && !role.managed) {
					overwrites.push({
						role_name: role.name,
						allow: overwrite.allow.bitfield.toString(),
						deny: overwrite.deny.bitfield.toString(),
					});
				}
			}
			channelData.overwrites = overwrites;

			backup.data.channels.push(channelData);
		}

		backup.data.settings = {
			name: guild.name,
			icon: guild.iconURL(),
			verification_level: guild.verificationLevel,
			explicit_content_filter: guild.explicitContentFilter,
			default_message_notifications: guild.defaultMessageNotifications,
			afk_timeout: guild.afkTimeout,
			afk_channel_name: guild.afkChannel?.name || null,
			system_channel_name: guild.systemChannel?.name || null,
		};

		if (!serverDocument.backups) {
			serverDocument.query.set("backups", []);
		}

		serverDocument.query.push("backups", backup);
		await serverDocument.save();

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "💾 Backup Created",
				description: `Successfully created backup **${name}**`,
				fields: [
					{ name: "Backup ID", value: `\`${backup._id}\``, inline: true },
					{ name: "Roles", value: String(backup.data.roles.length), inline: true },
					{ name: "Channels", value: String(backup.data.channels.length), inline: true },
				],
				footer: { text: "Use /backup restore to restore this backup" },
			}],
		});
	},

	async listBackups (interaction, serverDocument) {
		const backups = serverDocument.backups || [];

		if (backups.length === 0) {
			return interaction.reply({
				embeds: [{
					color: 0xFEE75C,
					title: "💾 Server Backups",
					description: "No backups found.\n\nUse `/backup create` to create one.",
				}],
				ephemeral: true,
			});
		}

		const backupList = backups.slice(-10).reverse().map((b, i) => {
			const date = new Date(b.created_at);
			return `**${i + 1}.** ${b.name}\n` +
				`   ID: \`${b._id}\`\n` +
				`   Created: <t:${Math.floor(date.getTime() / 1000)}:R>`;
		})
			.join("\n\n");

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "💾 Server Backups",
				description: backupList,
				footer: { text: `${backups.length} backup(s) stored` },
			}],
			ephemeral: true,
		});
	},

	async backupInfo (interaction, serverDocument) {
		const backupId = interaction.options.getString("backup_id");
		const backups = serverDocument.backups || [];
		const backup = backups.find(b => b._id === backupId);

		if (!backup) {
			throw new Error("Backup not found.");
		}

		const creator = await interaction.client.users.fetch(backup.created_by).catch(() => null);

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: `💾 Backup: ${backup.name}`,
				thumbnail: backup.guild_icon ? { url: backup.guild_icon } : null,
				fields: [
					{ name: "Backup ID", value: `\`${backup._id}\``, inline: false },
					{ name: "Created", value: `<t:${Math.floor(new Date(backup.created_at).getTime() / 1000)}:F>`, inline: true },
					{ name: "Created By", value: creator?.tag || "Unknown", inline: true },
					{ name: "Original Server", value: backup.guild_name || "Unknown", inline: true },
					{ name: "Roles", value: String(backup.data?.roles?.length || 0), inline: true },
					{ name: "Channels", value: String(backup.data?.channels?.length || 0), inline: true },
					{ name: "Members (at backup)", value: String(backup.member_count || "Unknown"), inline: true },
				],
				footer: { text: "Use /backup restore to restore this backup" },
			}],
			ephemeral: true,
		});
	},

	async restoreBackup (interaction, serverDocument) {
		const backupId = interaction.options.getString("backup_id");
		const components = interaction.options.getString("components") || "all";
		const backups = serverDocument.backups || [];
		const backup = backups.find(b => b._id === backupId);

		if (!backup) {
			throw new Error("Backup not found.");
		}

		await interaction.deferReply({ ephemeral: true });

		const guild = interaction.guild;
		const results = { roles: 0, channels: 0, settings: false };

		if (components === "all" || components === "roles") {
			for (const roleData of backup.data.roles || []) {
				try {
					const existing = guild.roles.cache.find(r => r.name === roleData.name);
					if (!existing) {
						await guild.roles.create({
							name: roleData.name,
							color: roleData.color,
							hoist: roleData.hoist,
							mentionable: roleData.mentionable,
							permissions: roleData.permissions,
							reason: `Restored from backup ${backup.name}`,
						});
						results.roles++;
					}
				} catch {
					// Skip roles that can't be created
				}
			}
		}

		if (components === "all" || components === "channels") {
			const categories = (backup.data.channels || []).filter(c => c.type === ChannelType.GuildCategory);
			const otherChannels = (backup.data.channels || []).filter(c => c.type !== ChannelType.GuildCategory);

			for (const catData of categories) {
				try {
					const existing = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
					if (!existing) {
						await guild.channels.create({
							name: catData.name,
							type: ChannelType.GuildCategory,
							reason: `Restored from backup ${backup.name}`,
						});
						results.channels++;
					}
				} catch {
					// Skip
				}
			}

			for (const chanData of otherChannels) {
				try {
					const existing = guild.channels.cache.find(c => c.name === chanData.name && c.type === chanData.type);
					if (!existing) {
						const parent = chanData.parent_name ?
							guild.channels.cache.find(c => c.name === chanData.parent_name && c.type === ChannelType.GuildCategory) :
							null;

						const options = {
							name: chanData.name,
							type: chanData.type,
							parent: parent?.id,
							reason: `Restored from backup ${backup.name}`,
						};

						if (chanData.topic) options.topic = chanData.topic;
						if (chanData.nsfw) options.nsfw = chanData.nsfw;
						if (chanData.slowmode) options.rateLimitPerUser = chanData.slowmode;
						if (chanData.bitrate) options.bitrate = chanData.bitrate;
						if (chanData.user_limit) options.userLimit = chanData.user_limit;

						await guild.channels.create(options);
						results.channels++;
					}
				} catch {
					// Skip
				}
			}
		}

		if (components === "all" || components === "settings") {
			try {
				const settings = backup.data.settings || {};
				await guild.setVerificationLevel(settings.verification_level);
				await guild.setExplicitContentFilter(settings.explicit_content_filter);
				await guild.setDefaultMessageNotifications(settings.default_message_notifications);
				results.settings = true;
			} catch {
				// Skip settings that can't be applied
			}
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Backup Restored",
				description: `Restored from backup **${backup.name}**`,
				fields: [
					{ name: "Roles Created", value: String(results.roles), inline: true },
					{ name: "Channels Created", value: String(results.channels), inline: true },
					{ name: "Settings Applied", value: results.settings ? "Yes" : "No", inline: true },
				],
				footer: { text: "Existing items were not modified" },
			}],
		});
	},

	async deleteBackup (interaction, serverDocument) {
		const backupId = interaction.options.getString("backup_id");
		const backups = serverDocument.backups || [];
		const backupIndex = backups.findIndex(b => b._id === backupId);

		if (backupIndex === -1) {
			throw new Error("Backup not found.");
		}

		const backup = backups[backupIndex];
		serverDocument.query.pull("backups", backup);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "🗑️ Backup Deleted",
				description: `Deleted backup **${backup.name}**`,
			}],
			ephemeral: true,
		});
	},

	async configureSchedule (interaction, serverDocument) {
		const frequency = interaction.options.getString("frequency");
		const keep = interaction.options.getInteger("keep") || 5;

		serverDocument.query.set("config.backup_schedule", {
			enabled: frequency !== "disabled",
			frequency: frequency,
			keep: keep,
			last_backup: serverDocument.config.backup_schedule?.last_backup || null,
		});

		await serverDocument.save();

		if (frequency === "disabled") {
			await interaction.reply({
				embeds: [{
					color: 0xED4245,
					title: "📅 Auto-Backup Disabled",
					description: "Automatic backups have been disabled.",
				}],
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				embeds: [{
					color: 0x57F287,
					title: "📅 Auto-Backup Configured",
					description: `Automatic backups set to **${frequency}**.`,
					fields: [
						{ name: "Frequency", value: frequency.charAt(0).toUpperCase() + frequency.slice(1), inline: true },
						{ name: "Keep Last", value: `${keep} backups`, inline: true },
					],
				}],
				ephemeral: true,
			});
		}
	},
};
