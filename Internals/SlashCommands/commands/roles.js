const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	EmbedBuilder,
	ChannelType,
} = require("discord.js");
const { randomBytes } = require("crypto");

const generateId = () => randomBytes(8).toString("hex");

module.exports = {
	adminLevel: 2,
	data: new SlashCommandBuilder()
		.setName("roles")
		.setDescription("Role management commands")
		.addSubcommandGroup(group =>
			group.setName("panel")
				.setDescription("Manage role panels")
				.addSubcommand(sub =>
					sub.setName("create")
						.setDescription("Create a new role panel")
						.addStringOption(opt =>
							opt.setName("name")
								.setDescription("Panel name")
								.setRequired(true)
								.setMaxLength(100),
						)
						.addStringOption(opt =>
							opt.setName("type")
								.setDescription("Panel type")
								.setRequired(true)
								.addChoices(
									{ name: "Buttons", value: "button" },
									{ name: "Dropdown Menu", value: "dropdown" },
									{ name: "Reactions", value: "reaction" },
								),
						)
						.addChannelOption(opt =>
							opt.setName("channel")
								.setDescription("Channel to post the panel")
								.addChannelTypes(ChannelType.GuildText)
								.setRequired(true),
						)
						.addStringOption(opt =>
							opt.setName("description")
								.setDescription("Panel description")
								.setMaxLength(1000),
						)
						.addStringOption(opt =>
							opt.setName("mode")
								.setDescription("Selection mode")
								.addChoices(
									{ name: "Normal - Toggle roles freely", value: "normal" },
									{ name: "Unique - Only one role at a time", value: "unique" },
									{ name: "Verify - Add only, cannot remove", value: "verify" },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("addrole")
						.setDescription("Add a role to an existing panel")
						.addStringOption(opt =>
							opt.setName("panel_id")
								.setDescription("Panel ID (from /roles panel list)")
								.setRequired(true),
						)
						.addRoleOption(opt =>
							opt.setName("role")
								.setDescription("Role to add")
								.setRequired(true),
						)
						.addStringOption(opt =>
							opt.setName("label")
								.setDescription("Button/option label (defaults to role name)")
								.setMaxLength(80),
						)
						.addStringOption(opt =>
							opt.setName("emoji")
								.setDescription("Emoji for the button/option")
								.setMaxLength(100),
						)
						.addStringOption(opt =>
							opt.setName("description")
								.setDescription("Description (for dropdowns)")
								.setMaxLength(100),
						)
						.addStringOption(opt =>
							opt.setName("style")
								.setDescription("Button style")
								.addChoices(
									{ name: "Blue (Primary)", value: "Primary" },
									{ name: "Grey (Secondary)", value: "Secondary" },
									{ name: "Green (Success)", value: "Success" },
									{ name: "Red (Danger)", value: "Danger" },
								),
						),
				)
				.addSubcommand(sub =>
					sub.setName("removerole")
						.setDescription("Remove a role from a panel")
						.addStringOption(opt =>
							opt.setName("panel_id")
								.setDescription("Panel ID")
								.setRequired(true),
						)
						.addRoleOption(opt =>
							opt.setName("role")
								.setDescription("Role to remove")
								.setRequired(true),
						),
				)
				.addSubcommand(sub =>
					sub.setName("list")
						.setDescription("List all role panels"),
				)
				.addSubcommand(sub =>
					sub.setName("delete")
						.setDescription("Delete a role panel")
						.addStringOption(opt =>
							opt.setName("panel_id")
								.setDescription("Panel ID to delete")
								.setRequired(true),
						),
				)
				.addSubcommand(sub =>
					sub.setName("refresh")
						.setDescription("Refresh/resend a panel message")
						.addStringOption(opt =>
							opt.setName("panel_id")
								.setDescription("Panel ID to refresh")
								.setRequired(true),
						),
				),
		)
		.addSubcommandGroup(group =>
			group.setName("auto")
				.setDescription("Autorole settings")
				.addSubcommand(sub =>
					sub.setName("add")
						.setDescription("Add an autorole for new members")
						.addRoleOption(opt =>
							opt.setName("role")
								.setDescription("Role to assign on join")
								.setRequired(true),
						),
				)
				.addSubcommand(sub =>
					sub.setName("remove")
						.setDescription("Remove an autorole")
						.addRoleOption(opt =>
							opt.setName("role")
								.setDescription("Role to remove from autoroles")
								.setRequired(true),
						),
				)
				.addSubcommand(sub =>
					sub.setName("list")
						.setDescription("List all autoroles"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("temp")
				.setDescription("Give a temporary role to a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to give the role to")
						.setRequired(true),
				)
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to assign")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("duration")
						.setDescription("Duration (e.g., 1h, 30m, 7d, 1w)")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("reason")
						.setDescription("Reason for the temporary role")
						.setMaxLength(500),
				),
		)
		.addSubcommand(sub =>
			sub.setName("templist")
				.setDescription("List all active temporary roles"),
		)
		.addSubcommand(sub =>
			sub.setName("tempremove")
				.setDescription("Remove a temporary role early")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to remove the role from")
						.setRequired(true),
				)
				.addRoleOption(opt =>
					opt.setName("role")
						.setDescription("Role to remove")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

	async execute (interaction, client, serverDocument) {
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand();

		try {
			if (subcommandGroup === "panel") {
				await this.handlePanelCommands(interaction, client, serverDocument, subcommand);
			} else if (subcommandGroup === "auto") {
				await this.handleAutoCommands(interaction, client, serverDocument, subcommand);
			} else if (subcommand === "temp") {
				await this.handleTempRole(interaction, client, serverDocument);
			} else if (subcommand === "templist") {
				await this.handleTempList(interaction, client);
			} else if (subcommand === "tempremove") {
				await this.handleTempRemove(interaction, client);
			}
		} catch (error) {
			logger.error("Roles command error", { subcommand, guildId: interaction.guild.id }, error);
			const errorReply = { content: `❌ Error: ${error.message}`, ephemeral: true };
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(errorReply);
			} else {
				await interaction.reply(errorReply);
			}
		}
	},

	async handlePanelCommands (interaction, client, serverDocument, subcommand) {
		switch (subcommand) {
			case "create":
				await this.createPanel(interaction, client, serverDocument);
				break;
			case "addrole":
				await this.addRoleToPanel(interaction, client);
				break;
			case "removerole":
				await this.removeRoleFromPanel(interaction, client);
				break;
			case "list":
				await this.listPanels(interaction, client);
				break;
			case "delete":
				await this.deletePanel(interaction, client);
				break;
			case "refresh":
				await this.refreshPanel(interaction, client);
				break;
		}
	},

	async handleAutoCommands (interaction, client, serverDocument, subcommand) {
		switch (subcommand) {
			case "add":
				await this.addAutorole(interaction, serverDocument);
				break;
			case "remove":
				await this.removeAutorole(interaction, serverDocument);
				break;
			case "list":
				await this.listAutoroles(interaction, serverDocument);
				break;
		}
	},

	async createPanel (interaction, _client, _serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString("name");
		const type = interaction.options.getString("type");
		const channel = interaction.options.getChannel("channel");
		const description = interaction.options.getString("description") || `Select roles from the options below.`;
		const mode = interaction.options.getString("mode") || "normal";

		const panelId = generateId();

		const embed = new EmbedBuilder()
			.setTitle(`🎭 ${name}`)
			.setDescription(description)
			.setColor(0x5865F2)
			.setFooter({ text: `Panel ID: ${panelId} • Mode: ${mode}` });

		let message;
		try {
			if (type === "reaction") {
				message = await channel.send({ embeds: [embed] });
			} else {
				const placeholder = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId("role_placeholder")
						.setLabel("No roles configured yet")
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
				);
				message = await channel.send({ embeds: [embed], components: [placeholder] });
			}
		} catch (err) {
			throw new Error(`Failed to send panel message: ${err.message}`);
		}

		const panelData = {
			_id: panelId,
			server_id: interaction.guild.id,
			channel_id: channel.id,
			message_id: message.id,
			name,
			description,
			type,
			mode,
			max_roles: mode === "unique" ? 1 : 0,
			roles: [],
			created_at: new Date(),
			created_by: interaction.user.id,
		};

		await global.RolePanels.insert(panelData);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Role Panel Created",
				fields: [
					{ name: "Name", value: name, inline: true },
					{ name: "Type", value: type, inline: true },
					{ name: "Mode", value: mode, inline: true },
					{ name: "Panel ID", value: `\`${panelId}\``, inline: true },
					{ name: "Channel", value: `<#${channel.id}>`, inline: true },
				],
				footer: { text: "Use /roles panel addrole to add roles to this panel" },
			}],
		});
	},

	async addRoleToPanel (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const panelId = interaction.options.getString("panel_id");
		const role = interaction.options.getRole("role");
		const label = interaction.options.getString("label") || role.name;
		const emoji = interaction.options.getString("emoji");
		const description = interaction.options.getString("description");
		const style = interaction.options.getString("style") || "Primary";

		const panel = await global.RolePanels.findOne(panelId);
		if (!panel) {
			throw new Error("Panel not found. Use `/roles panel list` to see available panels.");
		}

		if (panel.server_id !== interaction.guild.id) {
			throw new Error("Panel not found in this server.");
		}

		if (panel.roles.some(r => r.role_id === role.id)) {
			throw new Error("This role is already in the panel.");
		}

		if (panel.roles.length >= 25) {
			throw new Error("Maximum 25 roles per panel.");
		}

		const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
		if (role.position >= botMember.roles.highest.position) {
			throw new Error("I cannot manage this role - it's higher than or equal to my highest role.");
		}

		const roleEntry = {
			_id: generateId(),
			role_id: role.id,
			label: label.slice(0, 80),
			description: description?.slice(0, 100),
			emoji,
			style,
		};

		panel.roles.push(roleEntry);
		await global.RolePanels.update({ _id: panelId }, { $set: { roles: panel.roles } });

		await this.updatePanelMessage(interaction.guild, panel);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Role Added to Panel",
				description: `Added **${role.name}** to panel **${panel.name}**`,
				fields: [
					{ name: "Label", value: label, inline: true },
					{ name: "Emoji", value: emoji || "None", inline: true },
				],
			}],
		});
	},

	async removeRoleFromPanel (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const panelId = interaction.options.getString("panel_id");
		const role = interaction.options.getRole("role");

		const panel = await global.RolePanels.findOne(panelId);
		if (!panel || panel.server_id !== interaction.guild.id) {
			throw new Error("Panel not found.");
		}

		const roleIndex = panel.roles.findIndex(r => r.role_id === role.id);
		if (roleIndex === -1) {
			throw new Error("This role is not in the panel.");
		}

		panel.roles.splice(roleIndex, 1);
		await global.RolePanels.update({ _id: panelId }, { $set: { roles: panel.roles } });

		await this.updatePanelMessage(interaction.guild, panel);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Role Removed",
				description: `Removed **${role.name}** from panel **${panel.name}**`,
			}],
		});
	},

	async listPanels (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const panels = await global.RolePanels.find({ server_id: interaction.guild.id }).exec();

		if (!panels || panels.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "📋 Role Panels",
					description: "No role panels configured.\nUse `/roles panel create` to create one.",
				}],
			});
		}

		const panelList = panels.map(p => {
			const roleCount = p.roles?.length || 0;
			return `**${p.name}** (\`${p._id}\`)\n` +
				`├ Type: ${p.type} | Mode: ${p.mode}\n` +
				`├ Roles: ${roleCount}\n` +
				`└ Channel: <#${p.channel_id}>`;
		}).join("\n\n");

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "📋 Role Panels",
				description: panelList,
				footer: { text: `${panels.length} panel(s) configured` },
			}],
		});
	},

	async deletePanel (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const panelId = interaction.options.getString("panel_id");

		const panel = await global.RolePanels.findOne(panelId);
		if (!panel || panel.server_id !== interaction.guild.id) {
			throw new Error("Panel not found.");
		}

		try {
			const channel = interaction.guild.channels.cache.get(panel.channel_id);
			if (channel) {
				const message = await channel.messages.fetch(panel.message_id).catch(() => null);
				if (message) await message.delete().catch(() => null);
			}
		} catch {
			// Message may already be deleted
		}

		await global.RolePanels.delete({ _id: panelId });

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Panel Deleted",
				description: `Deleted panel **${panel.name}**`,
			}],
		});
	},

	async refreshPanel (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const panelId = interaction.options.getString("panel_id");

		const panel = await global.RolePanels.findOne(panelId);
		if (!panel || panel.server_id !== interaction.guild.id) {
			throw new Error("Panel not found.");
		}

		const channel = interaction.guild.channels.cache.get(panel.channel_id);
		if (!channel) {
			throw new Error("Panel channel no longer exists.");
		}

		try {
			const oldMessage = await channel.messages.fetch(panel.message_id).catch(() => null);
			if (oldMessage) await oldMessage.delete().catch(() => null);
		} catch {
			// Old message may be gone
		}

		const { embed, components } = this.buildPanelMessage(panel, interaction.guild);
		const newMessage = await channel.send({ embeds: [embed], components });

		await global.RolePanels.update({ _id: panelId }, { $set: { message_id: newMessage.id } });

		if (panel.type === "reaction" && panel.roles.length > 0) {
			for (const roleEntry of panel.roles) {
				if (roleEntry.emoji) {
					await newMessage.react(roleEntry.emoji).catch(() => null);
				}
			}
		}

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Panel Refreshed",
				description: `Panel **${panel.name}** has been refreshed.`,
			}],
		});
	},

	async updatePanelMessage (guild, panel) {
		const channel = guild.channels.cache.get(panel.channel_id);
		if (!channel) return;

		try {
			const message = await channel.messages.fetch(panel.message_id).catch(() => null);
			if (!message) return;

			const { embed, components } = this.buildPanelMessage(panel, guild);

			if (panel.type === "reaction") {
				await message.edit({ embeds: [embed] });
				await message.reactions.removeAll().catch(() => null);
				for (const roleEntry of panel.roles) {
					if (roleEntry.emoji) {
						await message.react(roleEntry.emoji).catch(() => null);
					}
				}
			} else {
				await message.edit({ embeds: [embed], components });
			}
		} catch (err) {
			logger.warn("Failed to update panel message", { panelId: panel._id }, err);
		}
	},

	buildPanelMessage (panel, guild) {
		const embed = new EmbedBuilder()
			.setTitle(`🎭 ${panel.name}`)
			.setDescription(panel.description || "Select roles from the options below.")
			.setColor(panel.color || 0x5865F2)
			.setFooter({ text: `Panel ID: ${panel._id} • Mode: ${panel.mode}` });

		if (panel.roles.length > 0) {
			const roleList = panel.roles.map(r => {
				const role = guild.roles.cache.get(r.role_id);
				const emoji = r.emoji ? `${r.emoji} ` : "";
				return `${emoji}${role ? role.name : "Unknown Role"}`;
			}).join("\n");
			embed.addFields({ name: "Available Roles", value: roleList });
		}

		const components = [];

		if (panel.type === "button" && panel.roles.length > 0) {
			const rows = [];
			let currentRow = new ActionRowBuilder();

			for (const roleEntry of panel.roles) {
				if (currentRow.components.length >= 5) {
					rows.push(currentRow);
					currentRow = new ActionRowBuilder();
				}

				const button = new ButtonBuilder()
					.setCustomId(`role_panel_${panel._id}_${roleEntry.role_id}`)
					.setLabel(roleEntry.label || "Role")
					.setStyle(ButtonStyle[roleEntry.style] || ButtonStyle.Primary);

				if (roleEntry.emoji) {
					button.setEmoji(roleEntry.emoji);
				}

				currentRow.addComponents(button);
			}

			if (currentRow.components.length > 0) {
				rows.push(currentRow);
			}

			components.push(...rows.slice(0, 5));
		} else if (panel.type === "dropdown" && panel.roles.length > 0) {
			const options = panel.roles.map(r => {
				const role = guild.roles.cache.get(r.role_id);
				const opt = {
					label: r.label || role?.name || "Unknown",
					value: r.role_id,
					description: r.description?.slice(0, 100),
				};
				if (r.emoji) {
					opt.emoji = r.emoji;
				}
				return opt;
			});

			const select = new StringSelectMenuBuilder()
				.setCustomId(`role_panel_select_${panel._id}`)
				.setPlaceholder("Select a role...")
				.setMinValues(0)
				.setMaxValues(panel.mode === "unique" ? 1 : Math.min(options.length, 25))
				.addOptions(options);

			components.push(new ActionRowBuilder().addComponents(select));
		} else if (panel.roles.length === 0) {
			const placeholder = new ButtonBuilder()
				.setCustomId("role_placeholder")
				.setLabel("No roles configured yet")
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);
			components.push(new ActionRowBuilder().addComponents(placeholder));
		}

		return { embed, components };
	},

	async addAutorole (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const role = interaction.options.getRole("role");
		const autoroles = serverDocument.config.moderation.new_member_roles || [];

		if (autoroles.includes(role.id)) {
			throw new Error("This role is already an autorole.");
		}

		const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
		if (role.position >= botMember.roles.highest.position) {
			throw new Error("I cannot assign this role - it's higher than or equal to my highest role.");
		}

		if (role.managed) {
			throw new Error("This role is managed by an integration and cannot be assigned.");
		}

		serverDocument.query.prop("config.moderation.new_member_roles").push(role.id);
		await serverDocument.save();

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Autorole Added",
				description: `**${role.name}** will now be assigned to new members.`,
			}],
		});
	},

	async removeAutorole (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const role = interaction.options.getRole("role");
		const autoroles = serverDocument.config.moderation.new_member_roles || [];

		const index = autoroles.indexOf(role.id);
		if (index === -1) {
			throw new Error("This role is not an autorole.");
		}

		serverDocument.query.prop("config.moderation.new_member_roles").splice(index, 1);
		await serverDocument.save();

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Autorole Removed",
				description: `**${role.name}** will no longer be assigned to new members.`,
			}],
		});
	},

	async listAutoroles (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const autoroles = serverDocument.config.moderation.new_member_roles || [];

		if (autoroles.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "📋 Autoroles",
					description: "No autoroles configured.\nUse `/roles auto add` to add one.",
				}],
			});
		}

		const roleList = autoroles.map(id => {
			const role = interaction.guild.roles.cache.get(id);
			return role ? `• ${role.name}` : `• Unknown (${id})`;
		}).join("\n");

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "📋 Autoroles",
				description: `Roles assigned to new members:\n\n${roleList}`,
				footer: { text: `${autoroles.length} autorole(s) configured` },
			}],
		});
	},

	parseDuration (durationStr) {
		const regex = /^(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?|w|wk|wks|weeks?)$/i;
		const match = durationStr.trim().match(regex);

		if (!match) return null;

		const value = parseInt(match[1], 10);
		const unit = match[2].toLowerCase();

		let ms;
		if (unit.startsWith("m")) {
			ms = value * 60 * 1000;
		} else if (unit.startsWith("h")) {
			ms = value * 60 * 60 * 1000;
		} else if (unit.startsWith("d")) {
			ms = value * 24 * 60 * 60 * 1000;
		} else if (unit.startsWith("w")) {
			ms = value * 7 * 24 * 60 * 60 * 1000;
		}

		return ms;
	},

	async handleTempRole (interaction, client) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser("user");
		const role = interaction.options.getRole("role");
		const durationStr = interaction.options.getString("duration");
		const reason = interaction.options.getString("reason");

		const duration = this.parseDuration(durationStr);
		if (!duration) {
			throw new Error("Invalid duration format. Use: 1h, 30m, 7d, 1w");
		}

		if (duration < 60000) {
			throw new Error("Minimum duration is 1 minute.");
		}

		if (duration > 30 * 24 * 60 * 60 * 1000) {
			throw new Error("Maximum duration is 30 days.");
		}

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);
		if (!member) {
			throw new Error("User is not in this server.");
		}

		const botMember = interaction.guild.members.cache.get(client.user.id);
		if (role.position >= botMember.roles.highest.position) {
			throw new Error("I cannot assign this role - it's higher than or equal to my highest role.");
		}

		if (role.managed) {
			throw new Error("This role is managed by an integration and cannot be assigned.");
		}

		const existing = await global.TempRoles.findOne({
			server_id: interaction.guild.id,
			user_id: user.id,
			role_id: role.id,
		});

		if (existing) {
			throw new Error("This user already has this temporary role. Remove it first to reassign.");
		}

		await member.roles.add(role, `Temp role by ${interaction.user.tag}: ${reason || "No reason"}`);

		const expiresAt = new Date(Date.now() + duration);

		await global.TempRoles.insert({
			_id: generateId(),
			server_id: interaction.guild.id,
			user_id: user.id,
			role_id: role.id,
			assigned_by: interaction.user.id,
			assigned_at: new Date(),
			expires_at: expiresAt,
			reason: reason || null,
			notified: false,
		});

		const expiresTimestamp = Math.floor(expiresAt.getTime() / 1000);

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Temporary Role Assigned",
				fields: [
					{ name: "User", value: `${user.tag}`, inline: true },
					{ name: "Role", value: role.name, inline: true },
					{ name: "Expires", value: `<t:${expiresTimestamp}:R>`, inline: true },
					{ name: "Reason", value: reason || "No reason provided", inline: false },
				],
			}],
		});
	},

	async handleTempList (interaction, client) {
		await interaction.deferReply({ ephemeral: true });

		const tempRoles = await global.TempRoles.find({
			server_id: interaction.guild.id,
			expires_at: { $gt: new Date() },
		}).exec();

		if (!tempRoles || tempRoles.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "⏱️ Temporary Roles",
					description: "No active temporary roles.",
				}],
			});
		}

		const roleList = await Promise.all(tempRoles.slice(0, 20).map(async tr => {
			const user = await client.users.fetch(tr.user_id).catch(() => null);
			const role = interaction.guild.roles.cache.get(tr.role_id);
			const expiresTimestamp = Math.floor(new Date(tr.expires_at).getTime() / 1000);

			return `**${user?.tag || "Unknown"}** - ${role?.name || "Unknown Role"}\n` +
				`└ Expires <t:${expiresTimestamp}:R>`;
		}));

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "⏱️ Temporary Roles",
				description: roleList.join("\n\n"),
				footer: { text: `${tempRoles.length} active temp role(s)` },
			}],
		});
	},

	async handleTempRemove (interaction, _client) {
		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser("user");
		const role = interaction.options.getRole("role");

		const tempRole = await global.TempRoles.findOne({
			server_id: interaction.guild.id,
			user_id: user.id,
			role_id: role.id,
		});

		if (!tempRole) {
			throw new Error("No temporary role assignment found for this user/role combination.");
		}

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);
		if (member && member.roles.cache.has(role.id)) {
			await member.roles.remove(role, `Temp role removed early by ${interaction.user.tag}`);
		}

		await global.TempRoles.delete({ _id: tempRole._id });

		await interaction.editReply({
			embeds: [{
				color: 0x57F287,
				title: "✅ Temporary Role Removed",
				description: `Removed **${role.name}** from ${user.tag}`,
			}],
		});
	},
};
