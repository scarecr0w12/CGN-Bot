/**
 * ServerTicketManager - Handles per-server ticket system (Tier 2 feature)
 *
 * Server owners can set up their own ticket system with:
 * - Ticket panels with button-based creation
 * - Custom categories
 * - Support roles
 * - Transcript logging
 */

const {
	ChannelType,
	PermissionFlagsBits,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	EmbedBuilder,
} = require("discord.js");

class ServerTicketManager {
	constructor (client) {
		this.client = client;
	}

	/**
	 * Check if a server has the ticket system enabled and is Tier 2+
	 * @param {Document} serverDocument
	 * @returns {boolean}
	 */
	isEnabled (serverDocument) {
		if (!serverDocument.tickets?.enabled) return false;

		// Check Tier 2 requirement
		const tier = serverDocument.subscription?.tier_id || "free";
		return tier !== "free";
	}

	/**
	 * Get the next ticket number for a server
	 * @param {Document} serverDocument
	 * @returns {number}
	 */
	async getNextTicketNumber (serverDocument) {
		const currentNumber = serverDocument.tickets?.next_ticket_number || 1;
		serverDocument.query.set("tickets.next_ticket_number", currentNumber + 1);
		await serverDocument.save();
		return currentNumber;
	}

	/**
	 * Create a new ticket channel
	 * @param {Guild} guild
	 * @param {Document} serverDocument
	 * @param {GuildMember} member
	 * @param {string} categoryId - The ticket category ID
	 * @param {string} reason - Optional reason/subject
	 * @returns {Promise<Object>} Created ticket data
	 */
	async createTicket (guild, serverDocument, member, categoryId = "general", reason = "") {
		const ticketConfig = serverDocument.tickets;

		// Check max tickets per user
		const userTickets = await global.ServerTickets.find({
			server_id: guild.id,
			user_id: member.id,
			status: { $in: ["open", "in_progress", "on_hold"] },
		}).exec();

		if (userTickets.length >= (ticketConfig.max_tickets_per_user || 3)) {
			throw new Error(`You already have ${userTickets.length} open tickets. Please close one before opening another.`);
		}

		// Get category config
		const category = ticketConfig.categories?.find(c => c._id === categoryId) || {
			_id: "general",
			name: "General",
			emoji: "🎫",
			welcome_message: ticketConfig.default_welcome_message,
		};

		const ticketNumber = await this.getNextTicketNumber(serverDocument);
		const channelName = (ticketConfig.channel_name_pattern || "ticket-{number}")
			.replace("{number}", ticketNumber.toString().padStart(4, "0"))
			.replace("{user}", member.user.username.toLowerCase().replace(/[^a-z0-9]/g, ""));

		// Create the ticket channel
		const parentCategory = ticketConfig.ticket_category_id ?
			guild.channels.cache.get(ticketConfig.ticket_category_id) : null;

		const permissionOverwrites = [
			{
				id: guild.id,
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: member.id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
					PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
			},
			{
				id: this.client.user.id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
					PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
			},
		];

		// Add support roles
		for (const roleId of ticketConfig.support_roles || []) {
			const role = guild.roles.cache.get(roleId);
			if (role) {
				permissionOverwrites.push({
					id: roleId,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
						PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
						PermissionFlagsBits.ManageMessages],
				});
			}
		}

		const ticketChannel = await guild.channels.create({
			name: channelName,
			type: ChannelType.GuildText,
			parent: parentCategory?.id,
			permissionOverwrites,
			topic: `Ticket #${ticketNumber} - ${member.user.tag} - ${category.name}`,
		});

		// Create ticket in database
		const ticketId = `${guild.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const ticket = await global.ServerTickets.create({
			_id: ticketId,
			server_id: guild.id,
			ticket_number: ticketNumber,
			channel_id: ticketChannel.id,
			user_id: member.id,
			username: member.user.username,
			user_avatar: member.user.displayAvatarURL() || "",
			category_id: category._id,
			category_name: category.name,
			subject: reason || "Support Request",
			status: "open",
			priority: "normal",
			participants: [],
			staff_participants: [],
			message_count: 1,
			created_at: new Date(),
			updated_at: new Date(),
			last_activity_at: new Date(),
		});

		// Create system message
		await this.addSystemMessage(ticket, member.id, "opened", `Ticket opened by ${member.user.tag}`);

		// Send welcome embed
		const welcomeMessage = category.welcome_message || ticketConfig.default_welcome_message ||
			"Thank you for creating a ticket! A staff member will be with you shortly.";

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle(`${category.emoji} Ticket #${ticketNumber}`)
			.setDescription(welcomeMessage)
			.addFields(
				{ name: "Category", value: category.name, inline: true },
				{ name: "Opened By", value: `<@${member.id}>`, inline: true },
			)
			.setTimestamp();

		if (reason) {
			embed.addFields({ name: "Reason", value: reason });
		}

		const closeButton = new ButtonBuilder()
			.setCustomId(`ticket_close_${ticketId}`)
			.setLabel("Close Ticket")
			.setStyle(ButtonStyle.Danger)
			.setEmoji("🔒");

		const claimButton = new ButtonBuilder()
			.setCustomId(`ticket_claim_${ticketId}`)
			.setLabel("Claim")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("✋");

		const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

		await ticketChannel.send({
			content: `<@${member.id}> ${this.getPingRoles(ticketConfig, category)}`,
			embeds: [embed],
			components: [row],
		});

		// Update stats
		serverDocument.query.inc("tickets.total_tickets");
		await serverDocument.save();

		// Log to ticket log channel
		await this.logTicketEvent(guild, serverDocument, "created", ticket, member.user);

		return { ticket, channel: ticketChannel };
	}

	/**
	 * Get ping roles for a category
	 */
	getPingRoles (ticketConfig, category) {
		const roles = category.ping_roles?.length ?
			category.ping_roles : ticketConfig.support_roles || [];
		return roles.map(r => `<@&${r}>`).join(" ");
	}

	/**
	 * Close a ticket
	 * @param {Guild} guild
	 * @param {Document} serverDocument
	 * @param {string} ticketId
	 * @param {User} closedBy
	 * @param {string} reason
	 */
	async closeTicket (guild, serverDocument, ticketId, closedBy, reason = "") {
		const ticket = await global.ServerTickets.findOne(ticketId);
		if (!ticket || ticket.server_id !== guild.id) {
			throw new Error("Ticket not found");
		}

		if (ticket.status === "closed") {
			throw new Error("Ticket is already closed");
		}

		// Generate transcript before closing
		const transcriptChannel = serverDocument.tickets?.transcript_channel_id ?
			guild.channels.cache.get(serverDocument.tickets.transcript_channel_id) : null;

		if (transcriptChannel) {
			await this.saveTranscript(guild, ticket, transcriptChannel);
		}

		// Update ticket
		ticket.query.set("status", "closed");
		ticket.query.set("closed_by", closedBy.id);
		ticket.query.set("closed_reason", reason);
		ticket.query.set("closed_at", new Date());
		ticket.query.set("updated_at", new Date());
		await ticket.save();

		// Add system message
		await this.addSystemMessage(ticket, closedBy.id, "closed", reason || "Ticket closed");

		// Update stats
		serverDocument.query.inc("tickets.closed_tickets");
		await serverDocument.save();

		// Log event
		await this.logTicketEvent(guild, serverDocument, "closed", ticket, closedBy);

		// Delete the channel after a delay
		const ticketChannel = guild.channels.cache.get(ticket.channel_id);
		if (ticketChannel) {
			await ticketChannel.send({
				embeds: [{
					color: 0xed4245,
					title: "🔒 Ticket Closed",
					description: `This ticket has been closed by <@${closedBy.id}>.${reason ? `\n\n**Reason:** ${reason}` : ""}`,
					footer: { text: "This channel will be deleted in 5 seconds..." },
				}],
			});

			setTimeout(async () => {
				try {
					await ticketChannel.delete("Ticket closed");
				} catch {
					// Channel may already be deleted
				}
			}, 5000);
		}

		return ticket;
	}

	/**
	 * Claim a ticket (assign to staff member)
	 */
	async claimTicket (guild, ticketId, staffMember) {
		const ticket = await global.ServerTickets.findOne(ticketId);
		if (!ticket || ticket.server_id !== guild.id) {
			throw new Error("Ticket not found");
		}

		if (ticket.assigned_to) {
			throw new Error(`Ticket is already claimed by <@${ticket.assigned_to}>`);
		}

		ticket.query.set("assigned_to", staffMember.id);
		ticket.query.set("assigned_username", staffMember.user.username);
		ticket.query.set("status", "in_progress");
		ticket.query.set("updated_at", new Date());

		// Add to staff participants
		const staffList = ticket.staff_participants || [];
		if (!staffList.includes(staffMember.id)) {
			staffList.push(staffMember.id);
			ticket.query.set("staff_participants", staffList);
		}

		await ticket.save();
		await this.addSystemMessage(ticket, staffMember.id, "claimed", `Claimed by ${staffMember.user.tag}`);

		return ticket;
	}

	/**
	 * Add a user to a ticket
	 */
	async addUserToTicket (guild, ticketId, userToAdd) {
		const ticket = await global.ServerTickets.findOne(ticketId);
		if (!ticket || ticket.server_id !== guild.id) {
			throw new Error("Ticket not found");
		}

		const ticketChannel = guild.channels.cache.get(ticket.channel_id);
		if (!ticketChannel) {
			throw new Error("Ticket channel not found");
		}

		// Add permission
		await ticketChannel.permissionOverwrites.edit(userToAdd.id, {
			ViewChannel: true,
			SendMessages: true,
			ReadMessageHistory: true,
			AttachFiles: true,
		});

		// Update participants
		const participants = ticket.participants || [];
		if (!participants.includes(userToAdd.id)) {
			participants.push(userToAdd.id);
			ticket.query.set("participants", participants);
			ticket.query.set("updated_at", new Date());
			await ticket.save();
		}

		await this.addSystemMessage(ticket, userToAdd.id, "user_added", `${userToAdd.tag} was added`);
		return ticket;
	}

	/**
	 * Remove a user from a ticket
	 */
	async removeUserFromTicket (guild, ticketId, userToRemove) {
		const ticket = await global.ServerTickets.findOne(ticketId);
		if (!ticket || ticket.server_id !== guild.id) {
			throw new Error("Ticket not found");
		}

		// Can't remove the ticket owner
		if (userToRemove.id === ticket.user_id) {
			throw new Error("Cannot remove the ticket owner");
		}

		const ticketChannel = guild.channels.cache.get(ticket.channel_id);
		if (ticketChannel) {
			await ticketChannel.permissionOverwrites.delete(userToRemove.id);
		}

		// Update participants
		const participants = (ticket.participants || []).filter(p => p !== userToRemove.id);
		ticket.query.set("participants", participants);
		ticket.query.set("updated_at", new Date());
		await ticket.save();

		await this.addSystemMessage(ticket, userToRemove.id, "user_removed", `${userToRemove.tag} was removed`);
		return ticket;
	}

	/**
	 * Add a system message to ticket history
	 */
	async addSystemMessage (ticket, userId, action, content) {
		const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		await global.ServerTicketMessages.create({
			_id: messageId,
			ticket_id: ticket._id,
			server_id: ticket.server_id,
			author_id: userId,
			author_username: "System",
			is_staff: true,
			content,
			is_system_message: true,
			system_action: action,
			created_at: new Date(),
		});
	}

	/**
	 * Save transcript to channel
	 */
	async saveTranscript (guild, ticket, transcriptChannel) {
		const messages = await global.ServerTicketMessages.find({ ticket_id: ticket._id })
			.sort({ created_at: 1 })
			.exec();

		let transcript = `# Ticket #${ticket.ticket_number} Transcript\n`;
		transcript += `**Subject:** ${ticket.subject}\n`;
		transcript += `**Category:** ${ticket.category_name}\n`;
		transcript += `**Opened By:** ${ticket.username} (${ticket.user_id})\n`;
		transcript += `**Created:** ${ticket.created_at.toISOString()}\n`;
		transcript += `**Closed:** ${new Date().toISOString()}\n`;
		transcript += `\n---\n\n`;

		for (const msg of messages) {
			const timestamp = msg.created_at.toISOString().replace("T", " ").substr(0, 19);
			const prefix = msg.is_system_message ? "[SYSTEM]" : (msg.is_staff ? "[STAFF]" : "[USER]");
			transcript += `[${timestamp}] ${prefix} ${msg.author_username}: ${msg.content}\n`;
		}

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle(`📝 Ticket #${ticket.ticket_number} Transcript`)
			.addFields(
				{ name: "Subject", value: ticket.subject, inline: true },
				{ name: "Category", value: ticket.category_name, inline: true },
				{ name: "Opened By", value: `<@${ticket.user_id}>`, inline: true },
				{ name: "Messages", value: messages.length.toString(), inline: true },
			)
			.setTimestamp();

		try {
			const sentMessage = await transcriptChannel.send({
				embeds: [embed],
				files: [{
					attachment: Buffer.from(transcript),
					name: `ticket-${ticket.ticket_number}-transcript.txt`,
				}],
			});

			ticket.query.set("transcript_channel_id", transcriptChannel.id);
			ticket.query.set("transcript_message_id", sentMessage.id);
			await ticket.save();
		} catch {
			// Transcript channel may not be accessible
		}
	}

	/**
	 * Log ticket events to the log channel
	 */
	async logTicketEvent (guild, serverDocument, event, ticket, user) {
		const logChannelId = serverDocument.tickets?.log_channel_id;
		if (!logChannelId) return;

		const logChannel = guild.channels.cache.get(logChannelId);
		if (!logChannel) return;

		const colors = {
			created: 0x57f287,
			closed: 0xed4245,
			claimed: 0x5865f2,
			reopened: 0xfee75c,
		};

		const embed = new EmbedBuilder()
			.setColor(colors[event] || 0x99aab5)
			.setTitle(`Ticket ${event.charAt(0).toUpperCase() + event.slice(1)}`)
			.addFields(
				{ name: "Ticket", value: `#${ticket.ticket_number}`, inline: true },
				{ name: "User", value: `<@${ticket.user_id}>`, inline: true },
				{ name: "By", value: `<@${user.id}>`, inline: true },
			)
			.setTimestamp();

		if (ticket.subject) {
			embed.setDescription(ticket.subject);
		}

		try {
			await logChannel.send({ embeds: [embed] });
		} catch {
			// Log channel may not be accessible
		}
	}

	/**
	 * Find ticket by channel ID
	 */
	async findTicketByChannel (channelId) {
		const tickets = await global.ServerTickets.find({ channel_id: channelId }).limit(1).exec();
		return tickets?.[0] || null;
	}

	/**
	 * Create a ticket panel embed with buttons
	 */
	async createPanel (guild, serverDocument, channel, options = {}) {
		const ticketConfig = serverDocument.tickets;
		const categories = ticketConfig.categories || [];

		const embed = new EmbedBuilder()
			.setColor(options.color || 0x5865f2)
			.setTitle(options.title || "🎫 Create a Support Ticket")
			.setDescription(options.description ||
				"Click the button below to create a support ticket. Our team will respond as soon as possible.");

		if (categories.length > 0) {
			embed.addFields({
				name: "Categories",
				value: categories.map(c => `${c.emoji} **${c.name}**${c.description ? ` - ${c.description}` : ""}`).join("\n"),
			});
		}

		const panelId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Create buttons for categories or a single create button
		const rows = [];
		if (categories.length > 1 && categories.length <= 5) {
			const row = new ActionRowBuilder();
			for (const cat of categories.slice(0, 5)) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`ticket_create_${panelId}_${cat._id}`)
						.setLabel(cat.name)
						.setStyle(ButtonStyle.Primary)
						.setEmoji(cat.emoji || "🎫"),
				);
			}
			rows.push(row);
		} else {
			rows.push(new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`ticket_create_${panelId}_general`)
					.setLabel("Create Ticket")
					.setStyle(ButtonStyle.Primary)
					.setEmoji("🎫"),
			));
		}

		const message = await channel.send({ embeds: [embed], components: rows });

		// Save panel to config
		const panels = ticketConfig.panels || [];
		panels.push({
			_id: panelId,
			channel_id: channel.id,
			message_id: message.id,
			title: options.title || "Create a Support Ticket",
			description: options.description || "",
			color: options.color || "#5865F2",
			category_ids: categories.map(c => c._id),
			created_at: new Date(),
		});
		serverDocument.query.set("tickets.panels", panels);
		await serverDocument.save();

		return { panelId, message };
	}
}

module.exports = ServerTicketManager;
