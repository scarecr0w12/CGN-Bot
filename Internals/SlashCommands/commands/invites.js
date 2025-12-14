const {
	SlashCommandBuilder,
	PermissionFlagsBits,
} = require("discord.js");

/* global InviteTracking */

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("invites")
		.setDescription("Invite tracking and management")
		.addSubcommand(sub =>
			sub.setName("leaderboard")
				.setDescription("View the top inviters"),
		)
		.addSubcommand(sub =>
			sub.setName("info")
				.setDescription("View invite info for a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to check (default: yourself)"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("who")
				.setDescription("See who invited a member")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("Member to check")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a tracked invite")
				.addStringOption(opt =>
					opt.setName("label")
						.setDescription("Label for this invite (e.g., 'Twitter Campaign')")
						.setMaxLength(50),
				)
				.addIntegerOption(opt =>
					opt.setName("max_uses")
						.setDescription("Maximum uses (0 for unlimited)")
						.setMinValue(0)
						.setMaxValue(1000),
				)
				.addIntegerOption(opt =>
					opt.setName("expires")
						.setDescription("Expires in hours (0 for never)")
						.setMinValue(0)
						.setMaxValue(168),
				),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all tracked invites"),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete an invite")
				.addStringOption(opt =>
					opt.setName("code")
						.setDescription("Invite code to delete")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("sync")
				.setDescription("Sync invites with Discord (admin only)"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),

	async execute (interaction, _client, _serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "leaderboard":
					await this.showLeaderboard(interaction);
					break;
				case "info":
					await this.showInfo(interaction);
					break;
				case "who":
					await this.showWhoInvited(interaction);
					break;
				case "create":
					await this.createInvite(interaction);
					break;
				case "list":
					await this.listInvites(interaction);
					break;
				case "delete":
					await this.deleteInvite(interaction);
					break;
				case "sync":
					await this.syncInvites(interaction);
					break;
			}
		} catch (error) {
			logger.error("Invites command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async showLeaderboard (interaction) {
		await interaction.deferReply();

		const inviteData = await InviteTracking.find({ server_id: interaction.guild.id }).exec();

		const inviterStats = {};
		for (const invite of inviteData) {
			if (!inviterStats[invite.inviter_id]) {
				inviterStats[invite.inviter_id] = { total: 0, active: 0, left: 0 };
			}
			for (const member of invite.members || []) {
				inviterStats[invite.inviter_id].total++;
				if (member.left) {
					inviterStats[invite.inviter_id].left++;
				} else {
					inviterStats[invite.inviter_id].active++;
				}
			}
		}

		const sorted = Object.entries(inviterStats)
			.sort((a, b) => b[1].active - a[1].active)
			.slice(0, 10);

		if (sorted.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "📨 Invite Leaderboard",
					description: "No invite data tracked yet.\nUse `/invites sync` to import existing invites.",
				}],
			});
		}

		const leaderboard = await Promise.all(sorted.map(async ([userId, stats], index) => {
			const user = await interaction.client.users.fetch(userId).catch(() => null);
			const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
			return `${medal} ${user?.tag || "Unknown"} - **${stats.active}** invites (${stats.left} left)`;
		}));

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "📨 Invite Leaderboard",
				description: leaderboard.join("\n"),
				footer: { text: "Active invites (members still in server)" },
			}],
		});
	},

	async showInfo (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser("user") || interaction.user;

		const inviteData = await InviteTracking.find({
			server_id: interaction.guild.id,
			inviter_id: user.id,
		}).exec();

		let totalInvites = 0;
		let activeInvites = 0;
		let leftInvites = 0;

		for (const invite of inviteData) {
			for (const member of invite.members || []) {
				totalInvites++;
				if (member.left) {
					leftInvites++;
				} else {
					activeInvites++;
				}
			}
		}

		const userInvitedBy = await this.findInviter(interaction.guild.id, user.id);

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: `📨 Invite Info for ${user.tag}`,
				thumbnail: { url: user.displayAvatarURL() },
				fields: [
					{ name: "Active Invites", value: String(activeInvites), inline: true },
					{ name: "Left Server", value: String(leftInvites), inline: true },
					{ name: "Total Invited", value: String(totalInvites), inline: true },
					{ name: "Invited By", value: userInvitedBy || "Unknown", inline: true },
				],
			}],
		});
	},

	async findInviter (serverId, userId) {
		const allInvites = await InviteTracking.find({ server_id: serverId }).exec();

		for (const invite of allInvites) {
			const member = (invite.members || []).find(m => m._id === userId);
			if (member) {
				const inviter = await global.client?.users.fetch(invite.inviter_id).catch(() => null);
				return inviter?.tag || `<@${invite.inviter_id}>`;
			}
		}
		return null;
	},

	async showWhoInvited (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser("user");
		const inviter = await this.findInviter(interaction.guild.id, user.id);

		if (!inviter) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "❓ Inviter Unknown",
					description: `Could not determine who invited ${user}.`,
					footer: { text: "The invite may have been created before tracking started" },
				}],
			});
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "📨 Invite Source",
				description: `${user} was invited by **${inviter}**`,
			}],
		});
	},

	async createInvite (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const label = interaction.options.getString("label");
		const maxUses = interaction.options.getInteger("max_uses") || 0;
		const expiresHours = interaction.options.getInteger("expires") || 0;

		const invite = await interaction.channel.createInvite({
			maxUses,
			maxAge: expiresHours * 3600,
			unique: true,
			reason: `Tracked invite created by ${interaction.user.tag}`,
		});

		const trackingDoc = InviteTracking.new({
			_id: `${interaction.guild.id}_${invite.code}`,
			server_id: interaction.guild.id,
			code: invite.code,
			inviter_id: interaction.user.id,
			uses: 0,
			members: [],
			created_at: new Date(),
			max_uses: maxUses,
			expires_at: expiresHours > 0 ? new Date(Date.now() + expiresHours * 3600000) : null,
			channel_id: interaction.channel.id,
			label: label || null,
		});

		await InviteTracking.insert(trackingDoc);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Tracked Invite Created",
				fields: [
					{ name: "Code", value: invite.code, inline: true },
					{ name: "URL", value: invite.url, inline: true },
					{ name: "Label", value: label || "None", inline: true },
					{ name: "Max Uses", value: maxUses === 0 ? "Unlimited" : String(maxUses), inline: true },
					{ name: "Expires", value: expiresHours === 0 ? "Never" : `${expiresHours} hours`, inline: true },
				],
			}],
		});
	},

	async listInvites (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const inviteData = await InviteTracking.find({ server_id: interaction.guild.id }).exec();

		if (inviteData.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "📨 Tracked Invites",
					description: "No tracked invites found.\nUse `/invites create` to create one or `/invites sync` to import existing.",
				}],
			});
		}

		const inviteList = await Promise.all(inviteData.slice(0, 15).map(async inv => {
			const inviter = await interaction.client.users.fetch(inv.inviter_id).catch(() => null);
			const memberCount = (inv.members || []).filter(m => !m.left).length;
			const label = inv.label ? `[${inv.label}] ` : "";
			return `${label}\`${inv.code}\` - ${memberCount} members - by ${inviter?.tag || "Unknown"}`;
		}));

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "📨 Tracked Invites",
				description: inviteList.join("\n"),
				footer: { text: `${inviteData.length} total tracked invites` },
			}],
		});
	},

	async deleteInvite (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const code = interaction.options.getString("code");

		const tracking = await InviteTracking.findOne({
			server_id: interaction.guild.id,
			code,
		});

		if (!tracking) {
			return interaction.editReply({ content: "❌ Invite not found in tracking database." });
		}

		try {
			const invite = await interaction.guild.invites.fetch(code);
			await invite.delete(`Deleted by ${interaction.user.tag}`);
		} catch {
			// Invite may already be deleted from Discord
		}

		await InviteTracking.delete({ _id: tracking._id });

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "🗑️ Invite Deleted",
				description: `Invite \`${code}\` has been deleted and removed from tracking.`,
			}],
		});
	},

	async syncInvites (interaction) {
		if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
			return interaction.reply({
				content: "❌ You need the `Manage Server` permission to sync invites.",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const guildInvites = await interaction.guild.invites.fetch();
		let synced = 0;
		let skipped = 0;

		for (const [code, invite] of guildInvites) {
			const existing = await InviteTracking.findOne({
				server_id: interaction.guild.id,
				code,
			});

			if (existing) {
				skipped++;
				continue;
			}

			const trackingDoc = InviteTracking.new({
				_id: `${interaction.guild.id}_${code}`,
				server_id: interaction.guild.id,
				code,
				inviter_id: invite.inviter?.id || "unknown",
				uses: invite.uses || 0,
				members: [],
				created_at: invite.createdAt || new Date(),
				max_uses: invite.maxUses || 0,
				expires_at: invite.expiresAt || null,
				channel_id: invite.channel?.id,
				label: null,
			});

			await InviteTracking.insert(trackingDoc);
			synced++;
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "🔄 Invites Synced",
				description: `Synced **${synced}** new invites.\nSkipped **${skipped}** already tracked.`,
				footer: { text: "New member joins will now be tracked" },
			}],
		});
	},
};
