const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Server management and configuration")
		.addSubcommandGroup(group =>
			group.setName("lockdown")
				.setDescription("Server lockdown controls")
				.addSubcommand(sub =>
					sub.setName("start")
						.setDescription("Lock all channels")
						.addStringOption(opt =>
							opt.setName("reason")
								.setDescription("Reason for lockdown"),
						),
				)
				.addSubcommand(sub =>
					sub.setName("end")
						.setDescription("Unlock all channels"),
				)
				.addSubcommand(sub =>
					sub.setName("channel")
						.setDescription("Lock/unlock a specific channel")
						.addChannelOption(opt =>
							opt.setName("channel")
								.setDescription("Channel to lock/unlock")
								.addChannelTypes(ChannelType.GuildText)
								.setRequired(true),
						)
						.addBooleanOption(opt =>
							opt.setName("lock")
								.setDescription("Lock (true) or unlock (false)")
								.setRequired(true),
						),
				),
		)
		.addSubcommandGroup(group =>
			group.setName("slowmode")
				.setDescription("Slowmode controls")
				.addSubcommand(sub =>
					sub.setName("set")
						.setDescription("Set slowmode for a channel")
						.addIntegerOption(opt =>
							opt.setName("seconds")
								.setDescription("Slowmode duration in seconds (0 to disable)")
								.setRequired(true)
								.setMinValue(0)
								.setMaxValue(21600),
						)
						.addChannelOption(opt =>
							opt.setName("channel")
								.setDescription("Channel (default: current)")
								.addChannelTypes(ChannelType.GuildText),
						),
				)
				.addSubcommand(sub =>
					sub.setName("all")
						.setDescription("Set slowmode for all channels")
						.addIntegerOption(opt =>
							opt.setName("seconds")
								.setDescription("Slowmode duration in seconds (0 to disable)")
								.setRequired(true)
								.setMinValue(0)
								.setMaxValue(21600),
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("info")
				.setDescription("View server information and stats"),
		)
		.addSubcommand(sub =>
			sub.setName("settings")
				.setDescription("View current server settings"),
		)
		.addSubcommand(sub =>
			sub.setName("prefix")
				.setDescription("Set the command prefix")
				.addStringOption(opt =>
					opt.setName("prefix")
						.setDescription("New prefix (max 5 characters)")
						.setRequired(true)
						.setMaxLength(5),
				),
		)
		.addSubcommand(sub =>
			sub.setName("cleanup")
				.setDescription("Clean up messages in a channel")
				.addIntegerOption(opt =>
					opt.setName("amount")
						.setDescription("Number of messages to delete")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100),
				)
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("Only delete messages from this user"),
				)
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to clean (default: current)")
						.addChannelTypes(ChannelType.GuildText),
				),
		)
		.addSubcommand(sub =>
			sub.setName("nuke")
				.setDescription("Delete and recreate a channel")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to nuke (default: current)")
						.addChannelTypes(ChannelType.GuildText),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute (interaction, _client, serverDocument) {
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand();

		try {
			if (subcommandGroup === "lockdown") {
				await this.handleLockdown(interaction, subcommand, serverDocument);
			} else if (subcommandGroup === "slowmode") {
				await this.handleSlowmode(interaction, subcommand);
			} else {
				switch (subcommand) {
					case "info":
						await this.showInfo(interaction);
						break;
					case "settings":
						await this.showSettings(interaction, serverDocument);
						break;
					case "prefix":
						await this.setPrefix(interaction, serverDocument);
						break;
					case "cleanup":
						await this.cleanup(interaction);
						break;
					case "nuke":
						await this.nukeChannel(interaction);
						break;
				}
			}
		} catch (error) {
			logger.error("Server command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async handleLockdown (interaction, subcommand, serverDocument) {
		const guild = interaction.guild;
		const everyoneRole = guild.roles.everyone;

		// Check bot permissions - ManageRoles is required to edit permission overwrites
		if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({
				content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
				ephemeral: true,
			});
		}

		if (subcommand === "start") {
			const reason = interaction.options.getString("reason") || "Server lockdown";
			await interaction.deferReply();

			let locked = 0;
			const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

			for (const [, channel] of channels) {
				try {
					await channel.permissionOverwrites.edit(everyoneRole, {
						SendMessages: false,
					}, { reason });
					locked++;
				} catch {
					// Skip channels we can't edit
				}
			}

			serverDocument.query.set("lockdown_active", true);
			await serverDocument.save();

			await interaction.editReply({
				embeds: [{
					color: 0xED4245,
					title: "🔒 Server Lockdown Active",
					description: `Locked ${locked} channels.`,
					fields: [{ name: "Reason", value: reason }],
					footer: { text: `Use /server lockdown end to unlock` },
				}],
			});
		} else if (subcommand === "end") {
			await interaction.deferReply();

			let unlocked = 0;
			const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

			for (const [, channel] of channels) {
				try {
					await channel.permissionOverwrites.edit(everyoneRole, {
						SendMessages: null,
					}, { reason: "Lockdown ended" });
					unlocked++;
				} catch {
					// Skip channels we can't edit
				}
			}

			serverDocument.query.set("lockdown_active", false);
			await serverDocument.save();

			await interaction.editReply({
				embeds: [{
					color: 0x57F287,
					title: "🔓 Server Lockdown Ended",
					description: `Unlocked ${unlocked} channels.`,
				}],
			});
		} else if (subcommand === "channel") {
			const channel = interaction.options.getChannel("channel");
			const lock = interaction.options.getBoolean("lock");

			await channel.permissionOverwrites.edit(everyoneRole, {
				SendMessages: lock ? false : null,
			}, { reason: `${lock ? "Locked" : "Unlocked"} by ${interaction.user.tag}` });

			await interaction.reply({
				embeds: [{
					color: lock ? 0xED4245 : 0x57F287,
					description: `${lock ? "🔒" : "🔓"} ${channel} has been ${lock ? "locked" : "unlocked"}.`,
				}],
			});
		}
	},

	async handleSlowmode (interaction, subcommand) {
		const seconds = interaction.options.getInteger("seconds");

		if (subcommand === "set") {
			const channel = interaction.options.getChannel("channel") || interaction.channel;

			await channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);

			await interaction.reply({
				embeds: [{
					color: 0x5865F2,
					description: seconds > 0 ?
						`⏱️ Slowmode set to **${seconds}s** in ${channel}` :
						`⏱️ Slowmode disabled in ${channel}`,
				}],
				ephemeral: true,
			});
		} else if (subcommand === "all") {
			await interaction.deferReply({ ephemeral: true });

			let updated = 0;
			const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

			for (const [, channel] of channels) {
				try {
					await channel.setRateLimitPerUser(seconds);
					updated++;
				} catch {
					// Skip channels we can't edit
				}
			}

			await interaction.editReply({
				embeds: [{
					color: 0x5865F2,
					description: seconds > 0 ?
						`⏱️ Slowmode set to **${seconds}s** in ${updated} channels` :
						`⏱️ Slowmode disabled in ${updated} channels`,
				}],
			});
		}
	},

	async showInfo (interaction) {
		const guild = interaction.guild;

		const memberCount = guild.memberCount;
		const botCount = guild.members.cache.filter(m => m.user.bot).size;
		const channelCount = guild.channels.cache.size;
		const roleCount = guild.roles.cache.size;
		const emojiCount = guild.emojis.cache.size;
		const boostLevel = guild.premiumTier;
		const boostCount = guild.premiumSubscriptionCount || 0;

		const created = Math.floor(guild.createdTimestamp / 1000);

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: guild.name,
				thumbnail: { url: guild.iconURL({ size: 256 }) },
				fields: [
					{ name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
					{ name: "Created", value: `<t:${created}:R>`, inline: true },
					{ name: "Server ID", value: guild.id, inline: true },
					{ name: "Members", value: `${memberCount} (${botCount} bots)`, inline: true },
					{ name: "Channels", value: `${channelCount}`, inline: true },
					{ name: "Roles", value: `${roleCount}`, inline: true },
					{ name: "Emojis", value: `${emojiCount}`, inline: true },
					{ name: "Boost Level", value: `Tier ${boostLevel}`, inline: true },
					{ name: "Boosts", value: `${boostCount}`, inline: true },
				],
			}],
		});
	},

	async showSettings (interaction, serverDocument) {
		const config = serverDocument.config || {};

		const prefix = config.command_prefix || "?";
		const modEnabled = config.moderation?.isEnabled !== false;
		const logChannel = config.moderation?.mod_log_channel_id ?
			`<#${config.moderation.mod_log_channel_id}>` : "Not set";

		await interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "⚙️ Server Settings",
				fields: [
					{ name: "Prefix", value: `\`${prefix}\``, inline: true },
					{ name: "Moderation", value: modEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Log Channel", value: logChannel, inline: true },
				],
			}],
			ephemeral: true,
		});
	},

	async setPrefix (interaction, serverDocument) {
		const prefix = interaction.options.getString("prefix");

		serverDocument.query.set("config.command_prefix", prefix);
		await serverDocument.save();

		await interaction.reply({
			embeds: [{
				color: 0x57F287,
				description: `✅ Command prefix set to \`${prefix}\``,
			}],
			ephemeral: true,
		});
	},

	async cleanup (interaction) {
		if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
			return interaction.reply({
				content: "❌ You need `Manage Messages` permission.",
				ephemeral: true,
			});
		}

		const amount = interaction.options.getInteger("amount");
		const user = interaction.options.getUser("user");
		const channel = interaction.options.getChannel("channel") || interaction.channel;

		await interaction.deferReply({ ephemeral: true });

		let messages = await channel.messages.fetch({ limit: 100 });

		if (user) {
			messages = messages.filter(m => m.author.id === user.id);
		}

		messages = [...messages.values()].slice(0, amount);

		// Filter messages older than 14 days (Discord limitation)
		const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
		const deletable = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

		if (deletable.length === 0) {
			return interaction.editReply({ content: "❌ No deletable messages found." });
		}

		await channel.bulkDelete(deletable, true);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				description: `🧹 Deleted ${deletable.length} messages in ${channel}`,
			}],
		});
	},

	async nukeChannel (interaction) {
		if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
			return interaction.reply({
				content: "❌ You need `Manage Channels` permission.",
				ephemeral: true,
			});
		}

		const channel = interaction.options.getChannel("channel") || interaction.channel;

		await interaction.reply({
			embeds: [{
				color: 0xFEE75C,
				title: "⚠️ Nuke Channel",
				description: `Are you sure you want to nuke ${channel}?\n\nThis will delete and recreate the channel, removing all messages.\n\n**Type "confirm" to proceed.**`,
			}],
			ephemeral: true,
		});

		const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === "confirm";

		try {
			const collected = await interaction.channel.awaitMessages({
				filter,
				max: 1,
				time: 30000,
				errors: ["time"],
			});

			await collected.first().delete().catch(() => null);

			const position = channel.position;
			const parent = channel.parent;
			const name = channel.name;
			const topic = channel.topic;
			const nsfw = channel.nsfw;
			const rateLimitPerUser = channel.rateLimitPerUser;
			const permissionOverwrites = channel.permissionOverwrites.cache.map(o => ({
				id: o.id,
				allow: o.allow.bitfield,
				deny: o.deny.bitfield,
				type: o.type,
			}));

			await channel.delete("Channel nuked");

			const newChannel = await interaction.guild.channels.create({
				name,
				type: ChannelType.GuildText,
				parent,
				position,
				topic,
				nsfw,
				rateLimitPerUser,
				permissionOverwrites,
				reason: `Channel nuked by ${interaction.user.tag}`,
			});

			await newChannel.send({
				embeds: [{
					color: 0x57F287,
					title: "💥 Channel Nuked",
					description: "This channel has been nuked and recreated.",
					footer: { text: `By ${interaction.user.tag}` },
				}],
			});
		} catch {
			await interaction.followUp({
				content: "❌ Nuke cancelled or timed out.",
				ephemeral: true,
			});
		}
	},
};
