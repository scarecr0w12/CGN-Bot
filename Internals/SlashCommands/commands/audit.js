const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
} = require("discord.js");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("audit")
		.setDescription("Server audit and permission management")
		.addSubcommand(sub =>
			sub.setName("snapshot")
				.setDescription("Take a snapshot of server permissions")
				.addStringOption(opt =>
					opt.setName("format")
						.setDescription("Export format")
						.addChoices(
							{ name: "Summary (Embed)", value: "summary" },
							{ name: "Full (JSON)", value: "json" },
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("roles")
				.setDescription("Audit role permissions")
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Specific role to audit (optional)"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("channels")
				.setDescription("Audit channel permissions")
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Specific channel to audit (optional)")
						.addChannelTypes(
							ChannelType.GuildText,
							ChannelType.GuildVoice,
							ChannelType.GuildCategory,
						),
				),
		)
		.addSubcommand(sub =>
			sub.setName("dangerous")
				.setDescription("Find roles/users with dangerous permissions"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute (interaction) {
		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case "snapshot":
					await this.takeSnapshot(interaction);
					break;
				case "roles":
					await this.auditRoles(interaction);
					break;
				case "channels":
					await this.auditChannels(interaction);
					break;
				case "dangerous":
					await this.findDangerous(interaction);
					break;
			}
		} catch (error) {
			logger.error("Audit command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async takeSnapshot (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guild = interaction.guild;
		const format = interaction.options.getString("format") || "summary";

		const snapshot = {
			guild_id: guild.id,
			guild_name: guild.name,
			snapshot_time: new Date().toISOString(),
			member_count: guild.memberCount,
			roles: [],
			channels: [],
			dangerous_permissions: [],
		};

		const dangerousPerms = [
			"Administrator",
			"ManageGuild",
			"ManageRoles",
			"ManageChannels",
			"BanMembers",
			"KickMembers",
			"ManageWebhooks",
			"ManageMessages",
			"MentionEveryone",
		];

		for (const [, role] of guild.roles.cache.sort((a, b) => b.position - a.position)) {
			const permissions = role.permissions.toArray();
			const hasDangerous = permissions.filter(p => dangerousPerms.includes(p));

			snapshot.roles.push({
				id: role.id,
				name: role.name,
				position: role.position,
				color: role.hexColor,
				mentionable: role.mentionable,
				hoisted: role.hoist,
				managed: role.managed,
				permissions: permissions,
				dangerous_permissions: hasDangerous,
				member_count: role.members.size,
			});

			if (hasDangerous.length > 0 && !role.managed && role.id !== guild.id) {
				snapshot.dangerous_permissions.push({
					type: "role",
					id: role.id,
					name: role.name,
					permissions: hasDangerous,
				});
			}
		}

		for (const [, channel] of guild.channels.cache) {
			const overwrites = [];
			for (const [id, overwrite] of channel.permissionOverwrites.cache) {
				const allow = overwrite.allow.toArray();
				const deny = overwrite.deny.toArray();
				if (allow.length > 0 || deny.length > 0) {
					overwrites.push({
						id: id,
						type: overwrite.type === 0 ? "role" : "member",
						allow: allow,
						deny: deny,
					});
				}
			}

			snapshot.channels.push({
				id: channel.id,
				name: channel.name,
				type: channel.type,
				parent_id: channel.parentId,
				position: channel.position,
				overwrites: overwrites,
			});
		}

		if (format === "json") {
			const { AttachmentBuilder } = require("discord.js");
			const fileContent = JSON.stringify(snapshot, null, 2);
			const fileName = `audit_snapshot_${guild.id}_${Date.now()}.json`;
			const attachment = new AttachmentBuilder(Buffer.from(fileContent), { name: fileName });

			await interaction.editReply({
				embeds: [{
					color: 0x57F287,
					title: "🔍 Permission Snapshot",
					description: `Full server permission snapshot exported.`,
					fields: [
						{ name: "Roles", value: `${snapshot.roles.length}`, inline: true },
						{ name: "Channels", value: `${snapshot.channels.length}`, inline: true },
						{ name: "Dangerous", value: `${snapshot.dangerous_permissions.length}`, inline: true },
					],
					timestamp: new Date().toISOString(),
				}],
				files: [attachment],
			});
		} else {
			const dangerousList = snapshot.dangerous_permissions.slice(0, 10).map(d =>
				`• **${d.name}**: ${d.permissions.join(", ")}`,
			).join("\n") || "None found";

			const topRoles = snapshot.roles.slice(0, 5).map(r =>
				`• **${r.name}** (${r.member_count} members)`,
			).join("\n");

			await interaction.editReply({
				embeds: [{
					color: 0x5865F2,
					title: "🔍 Permission Snapshot",
					description: `Server permission audit for **${guild.name}**`,
					fields: [
						{ name: "📊 Overview", value: `**Roles:** ${snapshot.roles.length}\n**Channels:** ${snapshot.channels.length}\n**Members:** ${guild.memberCount}`, inline: true },
						{ name: "⚠️ Dangerous Permissions", value: dangerousList.slice(0, 1024) },
						{ name: "🎭 Top Roles", value: topRoles },
					],
					footer: { text: "Use format:json for full export" },
					timestamp: new Date().toISOString(),
				}],
			});
		}
	},

	async auditRoles (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guild = interaction.guild;
		const targetRole = interaction.options.getRole("role");

		if (targetRole) {
			const permissions = targetRole.permissions.toArray();
			const dangerousPerms = ["Administrator", "ManageGuild", "ManageRoles", "ManageChannels", "BanMembers", "KickMembers"];
			const dangerous = permissions.filter(p => dangerousPerms.includes(p));

			const permList = permissions.length > 0 ?
				permissions.slice(0, 20).join(", ") + (permissions.length > 20 ? ` (+${permissions.length - 20} more)` : "") :
				"No special permissions";

			await interaction.editReply({
				embeds: [{
					color: targetRole.color || 0x5865F2,
					title: `🎭 Role Audit: ${targetRole.name}`,
					fields: [
						{ name: "Position", value: `${targetRole.position}`, inline: true },
						{ name: "Members", value: `${targetRole.members.size}`, inline: true },
						{ name: "Mentionable", value: targetRole.mentionable ? "Yes" : "No", inline: true },
						{ name: "Permissions", value: permList.slice(0, 1024) },
						{ name: "⚠️ Dangerous", value: dangerous.length > 0 ? dangerous.join(", ") : "None" },
					],
				}],
			});
		} else {
			const roles = guild.roles.cache
				.filter(r => r.id !== guild.id)
				.sort((a, b) => b.position - a.position)
				.first(15);

			const roleList = roles.map(r => {
				const perms = r.permissions.toArray();
				const hasAdmin = perms.includes("Administrator");
				const hasDangerous = perms.some(p => ["ManageGuild", "ManageRoles", "BanMembers"].includes(p));
				const icon = hasAdmin ? "🔴" : hasDangerous ? "🟡" : "🟢";
				return `${icon} **${r.name}** - ${r.members.size} members`;
			}).join("\n");

			await interaction.editReply({
				embeds: [{
					color: 0x5865F2,
					title: "🎭 Role Audit",
					description: roleList || "No roles found",
					footer: { text: "🔴 Admin | 🟡 Dangerous perms | 🟢 Safe" },
				}],
			});
		}
	},

	async auditChannels (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guild = interaction.guild;
		const targetChannel = interaction.options.getChannel("channel");

		if (targetChannel) {
			const overwrites = [];
			for (const [id, overwrite] of targetChannel.permissionOverwrites.cache) {
				const target = overwrite.type === 0 ?
					guild.roles.cache.get(id)?.name || "Unknown Role" :
					(await interaction.client.users.fetch(id).catch(() => null))?.tag || "Unknown User";

				const allow = overwrite.allow.toArray();
				const deny = overwrite.deny.toArray();

				if (allow.length > 0 || deny.length > 0) {
					overwrites.push({
						name: target,
						type: overwrite.type === 0 ? "Role" : "Member",
						allow: allow.slice(0, 5).join(", ") || "None",
						deny: deny.slice(0, 5).join(", ") || "None",
					});
				}
			}

			const overwriteList = overwrites.slice(0, 10).map(o =>
				`**${o.name}** (${o.type})\n✅ ${o.allow}\n❌ ${o.deny}`,
			).join("\n\n") || "No permission overwrites";

			await interaction.editReply({
				embeds: [{
					color: 0x5865F2,
					title: `📺 Channel Audit: #${targetChannel.name}`,
					description: overwriteList.slice(0, 4000),
					fields: [
						{ name: "Type", value: ChannelType[targetChannel.type] || "Unknown", inline: true },
						{ name: "Category", value: targetChannel.parent?.name || "None", inline: true },
						{ name: "Overwrites", value: `${targetChannel.permissionOverwrites.cache.size}`, inline: true },
					],
				}],
			});
		} else {
			const channels = guild.channels.cache
				.filter(c => c.type !== ChannelType.GuildCategory)
				.sort((a, b) => (a.position || 0) - (b.position || 0))
				.first(20);

			const channelList = channels.map(c => {
				const overwriteCount = c.permissionOverwrites.cache.size;
				const icon = c.type === ChannelType.GuildVoice ? "🔊" : "#";
				const warning = overwriteCount > 5 ? " ⚠️" : "";
				return `${icon} **${c.name}** - ${overwriteCount} overwrites${warning}`;
			}).join("\n");

			await interaction.editReply({
				embeds: [{
					color: 0x5865F2,
					title: "📺 Channel Audit",
					description: channelList || "No channels found",
					footer: { text: "⚠️ = Many permission overwrites" },
				}],
			});
		}
	},

	async findDangerous (interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guild = interaction.guild;
		const dangerousPerms = [
			"Administrator",
			"ManageGuild",
			"ManageRoles",
			"ManageChannels",
			"BanMembers",
			"KickMembers",
			"ManageWebhooks",
		];

		const dangerousRoles = [];
		const dangerousUsers = new Map();

		for (const [, role] of guild.roles.cache) {
			if (role.managed || role.id === guild.id) continue;

			const permissions = role.permissions.toArray();
			const dangerous = permissions.filter(p => dangerousPerms.includes(p));

			if (dangerous.length > 0) {
				dangerousRoles.push({
					role: role,
					permissions: dangerous,
					isAdmin: permissions.includes("Administrator"),
				});

				for (const [, member] of role.members) {
					if (member.id === guild.ownerId) continue;
					if (!dangerousUsers.has(member.id)) {
						dangerousUsers.set(member.id, {
							member: member,
							roles: [],
							permissions: new Set(),
						});
					}
					const userData = dangerousUsers.get(member.id);
					userData.roles.push(role.name);
					dangerous.forEach(p => userData.permissions.add(p));
				}
			}
		}

		const roleList = dangerousRoles
			.sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0))
			.slice(0, 10)
			.map(d => {
				const icon = d.isAdmin ? "🔴" : "🟡";
				return `${icon} **${d.role.name}** (${d.role.members.size} members)\n   ${d.permissions.join(", ")}`;
			})
			.join("\n") || "None";

		const userList = Array.from(dangerousUsers.values())
			.sort((a, b) => b.permissions.size - a.permissions.size)
			.slice(0, 10)
			.map(u => {
				const isAdmin = u.permissions.has("Administrator");
				const icon = isAdmin ? "🔴" : "🟡";
				return `${icon} **${u.member.user.tag}**\n   Via: ${u.roles.slice(0, 3).join(", ")}`;
			})
			.join("\n") || "None (excluding owner)";

		await interaction.editReply({
			embeds: [{
				color: 0xED4245,
				title: "⚠️ Dangerous Permissions Audit",
				description: `Found **${dangerousRoles.length}** roles and **${dangerousUsers.size}** users with elevated permissions.`,
				fields: [
					{ name: "🎭 Dangerous Roles", value: roleList.slice(0, 1024) },
					{ name: "👤 Users with Elevated Perms", value: userList.slice(0, 1024) },
				],
				footer: { text: "🔴 Administrator | 🟡 Other dangerous perms" },
			}],
		});
	},
};
