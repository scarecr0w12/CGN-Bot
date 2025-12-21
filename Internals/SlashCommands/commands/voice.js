const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");
const TierManager = require("../../../Modules/TierManager");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("voice")
		.setDescription("Voice channel management commands")
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a temporary voice channel")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Channel name")
						.setRequired(true)
						.setMaxLength(100),
				)
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("User limit (0 for unlimited)")
						.setMinValue(0)
						.setMaxValue(99),
				),
		)
		.addSubcommand(sub =>
			sub.setName("lock")
				.setDescription("Lock your temporary voice channel"),
		)
		.addSubcommand(sub =>
			sub.setName("unlock")
				.setDescription("Unlock your temporary voice channel"),
		)
		.addSubcommand(sub =>
			sub.setName("invite")
				.setDescription("Invite a user to your locked voice channel")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to invite")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("kick")
				.setDescription("Kick a user from your voice channel")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to kick")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("transfer")
				.setDescription("Transfer ownership of your voice channel")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("New owner")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("rename")
				.setDescription("Rename your voice channel")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("New channel name")
						.setRequired(true)
						.setMaxLength(100),
				),
		)
		.addSubcommand(sub =>
			sub.setName("limit")
				.setDescription("Set user limit for your voice channel")
				.addIntegerOption(opt =>
					opt.setName("count")
						.setDescription("User limit (0 for unlimited)")
						.setRequired(true)
						.setMinValue(0)
						.setMaxValue(99),
				),
		)
		.addSubcommand(sub =>
			sub.setName("claim")
				.setDescription("Claim an abandoned voice channel"),
		)
		.addSubcommand(sub =>
			sub.setName("stats")
				.setDescription("View your voice activity stats"),
		)
		.addSubcommand(sub =>
			sub.setName("leaderboard")
				.setDescription("View voice activity leaderboard"),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete your temporary voice channel"),
		),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "create":
					await this.createChannel(interaction, client, serverDocument);
					break;
				case "lock":
					await this.lockChannel(interaction, serverDocument, true);
					break;
				case "unlock":
					await this.lockChannel(interaction, serverDocument, false);
					break;
				case "invite":
					await this.inviteUser(interaction, serverDocument);
					break;
				case "kick":
					await this.kickUser(interaction, serverDocument);
					break;
				case "transfer":
					await this.transferOwnership(interaction, serverDocument);
					break;
				case "rename":
					await this.renameChannel(interaction, serverDocument);
					break;
				case "limit":
					await this.setLimit(interaction, serverDocument);
					break;
				case "claim":
					await this.claimChannel(interaction, serverDocument);
					break;
				case "stats":
					await this.showStats(interaction, serverDocument);
					break;
				case "leaderboard":
					await this.showLeaderboard(interaction, serverDocument);
					break;
				case "delete":
					await this.deleteChannel(interaction, serverDocument);
					break;
			}
		} catch (error) {
			logger.error("Voice command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async createChannel (interaction, client, serverDocument) {
		const hasVoiceFeatures = await TierManager.canAccess(interaction.guild.id, "voice_features");
		if (!hasVoiceFeatures) {
			return interaction.reply({
				embeds: [{
					color: 0xFEE75C,
					title: "Premium Feature",
					description: "Voice channel creation requires a premium subscription.",
				}],
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString("name");
		const limit = interaction.options.getInteger("limit") || 0;

		let categoryId = serverDocument.config.room_category;
		if (!categoryId || !interaction.guild.channels.cache.has(categoryId)) {
			const category = await interaction.guild.channels.create({
				name: "Voice Rooms",
				type: ChannelType.GuildCategory,
				reason: "Voice Management | Auto-created category",
			});
			categoryId = category.id;
			serverDocument.query.set("config.room_category", categoryId);
		}

		const channel = await interaction.guild.channels.create({
			name,
			type: ChannelType.GuildVoice,
			parent: categoryId,
			userLimit: limit,
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
				},
				{
					id: interaction.user.id,
					allow: [
						PermissionFlagsBits.ViewChannel,
						PermissionFlagsBits.Connect,
						PermissionFlagsBits.ManageChannels,
						PermissionFlagsBits.MuteMembers,
						PermissionFlagsBits.DeafenMembers,
						PermissionFlagsBits.MoveMembers,
					],
				},
			],
			reason: `Voice Management | Created by ${interaction.user.tag}`,
		});

		serverDocument.query.push("config.room_data", {
			_id: channel.id,
			owner_id: interaction.user.id,
			created_timestamp: new Date(),
		});
		await serverDocument.save();

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "🔊 Voice Channel Created",
				description: `Created **${name}**\nJoin: <#${channel.id}>`,
				fields: [
					{ name: "User Limit", value: limit === 0 ? "Unlimited" : String(limit), inline: true },
				],
				footer: { text: "Use /voice lock to make it private" },
			}],
		});
	},

	getOwnedChannel (interaction, serverDocument) {
		const voiceChannel = interaction.member.voice?.channel;
		if (!voiceChannel) {
			throw new Error("You must be in a voice channel to use this command.");
		}

		const roomData = serverDocument.config.room_data?.find(r => r._id === voiceChannel.id);
		if (!roomData) {
			throw new Error("This is not a managed voice channel.");
		}

		if (roomData.owner_id !== interaction.user.id) {
			throw new Error("You don't own this voice channel.");
		}

		return { voiceChannel, roomData };
	},

	async lockChannel (interaction, serverDocument, lock) {
		// Check bot permissions - ManageRoles is required to edit permission overwrites
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({
				content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);

		await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
			Connect: lock ? false : null,
		}, { reason: `Voice Management | ${lock ? "Locked" : "Unlocked"} by ${interaction.user.tag}` });

		await interaction.editReply({
			embeds: [{
				color: lock ? 0xED4245 : 0x57F287,
				title: lock ? "🔒 Channel Locked" : "🔓 Channel Unlocked",
				description: lock ?
					"Only invited users can join now.\nUse `/voice invite` to add users." :
					"Anyone can now join this channel.",
			}],
		});
	},

	async inviteUser (interaction, serverDocument) {
		// Check bot permissions - ManageRoles is required to edit permission overwrites
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({
				content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);
		const user = interaction.options.getUser("user");

		if (user.id === interaction.user.id) {
			throw new Error("You can't invite yourself.");
		}

		await voiceChannel.permissionOverwrites.edit(user.id, {
			ViewChannel: true,
			Connect: true,
		}, { reason: `Voice Management | Invited by ${interaction.user.tag}` });

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ User Invited",
				description: `${user} can now join <#${voiceChannel.id}>`,
			}],
		});

		try {
			await user.send({
				embeds: [{
					color: 0x5865F2,
					title: "🔊 Voice Channel Invite",
					description: `**${interaction.user.tag}** invited you to join their voice channel in **${interaction.guild.name}**`,
					fields: [{ name: "Channel", value: voiceChannel.name }],
				}],
			});
		} catch {
			// User has DMs disabled
		}
	},

	async kickUser (interaction, serverDocument) {
		// Check bot permissions - ManageRoles is required to edit permission overwrites
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({
				content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);
		const user = interaction.options.getUser("user");

		if (user.id === interaction.user.id) {
			throw new Error("You can't kick yourself.");
		}

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);
		if (!member) {
			throw new Error("User not found in this server.");
		}

		if (member.voice?.channelId === voiceChannel.id) {
			await member.voice.disconnect("Kicked by channel owner");
		}

		await voiceChannel.permissionOverwrites.edit(user.id, {
			Connect: false,
		}, { reason: `Voice Management | Kicked by ${interaction.user.tag}` });

		await interaction.editReply({
			embeds: [{
				color: 0xED4245,
				title: "👢 User Kicked",
				description: `${user} has been kicked from the channel.`,
			}],
		});
	},

	async transferOwnership (interaction, serverDocument) {
		// Check bot permissions - ManageRoles is required to edit permission overwrites
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({
				content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);
		const user = interaction.options.getUser("user");

		if (user.id === interaction.user.id) {
			throw new Error("You already own this channel.");
		}

		if (user.bot) {
			throw new Error("You can't transfer ownership to a bot.");
		}

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);
		if (!member || member.voice?.channelId !== voiceChannel.id) {
			throw new Error("The new owner must be in the voice channel.");
		}

		await voiceChannel.permissionOverwrites.edit(interaction.user.id, {
			ManageChannels: null,
			MuteMembers: null,
			DeafenMembers: null,
			MoveMembers: null,
		});

		await voiceChannel.permissionOverwrites.edit(user.id, {
			ViewChannel: true,
			Connect: true,
			ManageChannels: true,
			MuteMembers: true,
			DeafenMembers: true,
			MoveMembers: true,
		}, { reason: `Voice Management | Ownership transferred by ${interaction.user.tag}` });

		const roomIndex = serverDocument.config.room_data.findIndex(r => r._id === voiceChannel.id);
		if (roomIndex !== -1) {
			serverDocument.query.set(`config.room_data.${roomIndex}.owner_id`, user.id);
			await serverDocument.save();
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "👑 Ownership Transferred",
				description: `${user} is now the owner of this channel.`,
			}],
		});
	},

	async renameChannel (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);
		const name = interaction.options.getString("name");

		const oldName = voiceChannel.name;
		await voiceChannel.setName(name, `Voice Management | Renamed by ${interaction.user.tag}`);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✏️ Channel Renamed",
				description: `**${oldName}** → **${name}**`,
			}],
		});
	},

	async setLimit (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);
		const count = interaction.options.getInteger("count");

		await voiceChannel.setUserLimit(count, `Voice Management | Limit set by ${interaction.user.tag}`);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "👥 User Limit Updated",
				description: count === 0 ? "User limit removed (unlimited)." : `User limit set to **${count}**.`,
			}],
		});
	},

	async claimChannel (interaction, serverDocument) {
		// Check bot permissions - ManageRoles is required to edit permission overwrites
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({
				content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const voiceChannel = interaction.member.voice?.channel;
		if (!voiceChannel) {
			throw new Error("You must be in a voice channel to claim it.");
		}

		const roomData = serverDocument.config.room_data?.find(r => r._id === voiceChannel.id);
		if (!roomData) {
			throw new Error("This is not a managed voice channel.");
		}

		const currentOwner = await interaction.guild.members.fetch(roomData.owner_id).catch(() => null);
		if (currentOwner && currentOwner.voice?.channelId === voiceChannel.id) {
			throw new Error("The current owner is still in the channel.");
		}

		if (currentOwner) {
			await voiceChannel.permissionOverwrites.edit(currentOwner.id, {
				ManageChannels: null,
				MuteMembers: null,
				DeafenMembers: null,
				MoveMembers: null,
			}).catch(() => null);
		}

		await voiceChannel.permissionOverwrites.edit(interaction.user.id, {
			ViewChannel: true,
			Connect: true,
			ManageChannels: true,
			MuteMembers: true,
			DeafenMembers: true,
			MoveMembers: true,
		}, { reason: `Voice Management | Claimed by ${interaction.user.tag}` });

		const roomIndex = serverDocument.config.room_data.findIndex(r => r._id === voiceChannel.id);
		if (roomIndex !== -1) {
			serverDocument.query.set(`config.room_data.${roomIndex}.owner_id`, interaction.user.id);
			await serverDocument.save();
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "👑 Channel Claimed",
				description: "You are now the owner of this voice channel.",
			}],
		});
	},

	async showStats (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const memberDoc = serverDocument.members[interaction.user.id];
		const voiceMinutes = memberDoc?.voice || 0;

		const hours = Math.floor(voiceMinutes / 60);
		const minutes = voiceMinutes % 60;
		const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

		const currentSession = serverDocument.voice_data?.find(v => v._id === interaction.user.id);
		let currentSessionStr = "Not in voice";
		if (currentSession) {
			const sessionMinutes = Math.floor((Date.now() - new Date(currentSession.started_timestamp).getTime()) / 60000);
			const sessionHours = Math.floor(sessionMinutes / 60);
			const sessionMins = sessionMinutes % 60;
			currentSessionStr = sessionHours > 0 ?
				`${sessionHours}h ${sessionMins}m` :
				`${sessionMins}m`;
		}

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "🎙️ Your Voice Stats",
				fields: [
					{ name: "Total Voice Time", value: timeStr, inline: true },
					{ name: "Current Session", value: currentSessionStr, inline: true },
				],
				footer: { text: "Voice time contributes to your activity rank" },
			}],
		});
	},

	async showLeaderboard (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const members = Object.entries(serverDocument.members || {})
			.filter(([, m]) => m.voice && m.voice > 0)
			.sort((a, b) => b[1].voice - a[1].voice)
			.slice(0, 10);

		if (members.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "🎙️ Voice Leaderboard",
					description: "No voice activity recorded yet.",
				}],
			});
		}

		const leaderboard = await Promise.all(members.map(async ([id, data], index) => {
			const user = await interaction.client.users.fetch(id).catch(() => null);
			const hours = Math.floor(data.voice / 60);
			const minutes = data.voice % 60;
			const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
			const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
			return `${medal} ${user?.tag || "Unknown"} - **${timeStr}**`;
		}));

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "🎙️ Voice Leaderboard",
				description: leaderboard.join("\n"),
				footer: { text: "Top 10 members by voice time" },
			}],
		});
	},

	async deleteChannel (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const { voiceChannel } = this.getOwnedChannel(interaction, serverDocument);

		const channelName = voiceChannel.name;
		await voiceChannel.delete(`Voice Management | Deleted by ${interaction.user.tag}`);

		serverDocument.query.pull("config.room_data", voiceChannel.id);
		await serverDocument.save();

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "🗑️ Channel Deleted",
				description: `**${channelName}** has been deleted.`,
			}],
		});
	},
};
