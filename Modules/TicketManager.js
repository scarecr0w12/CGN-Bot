/**
 * TicketManager - Handles global support tickets via DM
 *
 * Users can create tickets by:
 * 1. DMing the bot with "ticket <subject>"
 * 2. Using the /ticket slash command
 *
 * Replies to existing tickets are automatically routed when:
 * - User has an open ticket and sends a DM
 */

class TicketManager {
	constructor (client) {
		this.client = client;
		// Cache of active tickets by user ID for quick lookup
		this.activeTicketCache = new Map();
	}

	/**
	 * Get next ticket number (auto-increment)
	 */
	async getNextTicketNumber () {
		try {
			const result = await global.Tickets.aggregate([
				{ $group: { _id: null, maxNumber: { $max: "$ticket_number" } } },
			]);
			return (result && result[0] && result[0].maxNumber ? result[0].maxNumber : 0) + 1;
		} catch {
			// Fallback: get highest ticket number
			const tickets = await global.Tickets.find({}).limit(1).sort({ ticket_number: -1 })
				.exec();
			return tickets && tickets.length > 0 ? (tickets[0].ticket_number || 0) + 1 : 1;
		}
	}

	/**
	 * Find an active (open/in_progress/awaiting) ticket for a user
	 * @param {string} userId
	 * @returns {Promise<Object|null>}
	 */
	async findActiveTicketForUser (userId) {
		// Check cache first
		if (this.activeTicketCache.has(userId)) {
			const cached = this.activeTicketCache.get(userId);
			// Verify it's still active
			const ticket = await global.Tickets.findOne(cached);
			if (ticket && ["open", "in_progress", "awaiting_response"].includes(ticket.status)) {
				return ticket;
			}
			this.activeTicketCache.delete(userId);
		}

		// Query database
		const tickets = await global.Tickets.find({
			user_id: userId,
			status: { $in: ["open", "in_progress", "awaiting_response"] },
		}).limit(1).sort({ created_at: -1 })
			.exec();

		if (tickets && tickets.length > 0) {
			this.activeTicketCache.set(userId, tickets[0]._id);
			return tickets[0];
		}
		return null;
	}

	/**
	 * Create a new ticket from a DM
	 * @param {Message} msg Discord message
	 * @param {string} subject Ticket subject
	 * @param {string} category Optional category
	 * @returns {Promise<Object>} Created ticket
	 */
	async createTicket (msg, subject, category = "general") {
		const ticketNumber = await this.getNextTicketNumber();
		const ticketId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const ticket = await global.Tickets.create({
			_id: ticketId,
			ticket_number: ticketNumber,
			user_id: msg.author.id,
			username: msg.author.username,
			user_avatar: msg.author.displayAvatarURL() || "",
			subject: subject.substring(0, 500),
			category,
			priority: "normal",
			status: "open",
			dm_channel_id: msg.channel.id,
			message_count: 1,
			last_message_preview: subject.substring(0, 100),
			last_activity_at: new Date(),
			created_at: new Date(),
			updated_at: new Date(),
		});

		// Create initial message
		const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		await global.TicketMessages.create({
			_id: messageId,
			ticket_id: ticketId,
			author_id: msg.author.id,
			author_username: msg.author.username,
			author_avatar: msg.author.displayAvatarURL() || "",
			is_staff: false,
			content: subject,
			is_system_message: false,
			created_at: new Date(),
		});

		// Cache the ticket
		this.activeTicketCache.set(msg.author.id, ticketId);

		return ticket;
	}

	/**
	 * Add a message to an existing ticket
	 * @param {Object} ticket The ticket document
	 * @param {Message} msg Discord message
	 * @returns {Promise<void>}
	 */
	async addMessageToTicket (ticket, msg) {
		// Create the message
		const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		await global.TicketMessages.create({
			_id: messageId,
			ticket_id: ticket._id,
			author_id: msg.author.id,
			author_username: msg.author.username,
			author_avatar: msg.author.displayAvatarURL() || "",
			is_staff: false,
			content: msg.content.substring(0, 4000),
			attachments: msg.attachments.map(a => a.url),
			discord_message_id: msg.id,
			is_system_message: false,
			created_at: new Date(),
		});

		// Update ticket
		ticket.query.set("message_count", (ticket.message_count || 0) + 1);
		ticket.query.set("last_message_preview", msg.content.substring(0, 100));
		ticket.query.set("last_activity_at", new Date());
		ticket.query.set("updated_at", new Date());
		// If ticket was awaiting response, mark it as open again
		if (ticket.status === "awaiting_response") {
			ticket.query.set("status", "open");
		}
		await ticket.save();
	}

	/**
	 * Handle an incoming DM - either create ticket, add to existing, or ignore
	 * @param {Message} msg Discord message
	 * @returns {Promise<boolean>} True if handled as ticket, false otherwise
	 */
	async handleDM (msg) {
		const content = msg.content.trim();
		const lowerContent = content.toLowerCase();

		// Check for explicit ticket creation command
		if (lowerContent.startsWith("ticket ") || lowerContent === "ticket") {
			const subject = content.substring(7).trim() || "Support Request";

			// Check if user already has an active ticket
			const existingTicket = await this.findActiveTicketForUser(msg.author.id);
			if (existingTicket) {
				await msg.reply({
					embeds: [{
						color: 0xffdd57,
						title: "You Already Have an Open Ticket",
						description: `You have an active ticket: **#${existingTicket.ticket_number}** - ` +
						`${existingTicket.subject}\n\nJust send your message here and it will be added to your ` +
						`existing ticket. If you want to create a new ticket, please wait for your current one ` +
						`to be resolved or ask staff to close it.`,
						footer: { text: "Reply to this message to continue your conversation" },
					}],
				});
				return true;
			}

			// Create new ticket
			const ticket = await this.createTicket(msg, subject);

			const nextStepsValue = "Our support team has been notified and will respond as soon as possible. " +
				"You can continue to send messages here and they will be added to your ticket.";
			await msg.reply({
				embeds: [{
					color: 0x48c774,
					title: "🎫 Support Ticket Created",
					description: `Your ticket has been created successfully!\n\n**Ticket #${ticket.ticket_number}**\n**Subject:** ${subject}`,
					fields: [
						{ name: "What's Next?", value: nextStepsValue },
					],
					footer: { text: "Reply to this message to add more details" },
					timestamp: new Date().toISOString(),
				}],
			});

			// Notify maintainers
			await this.notifyMaintainers(ticket, msg);
			return true;
		}

		// Check if user has an active ticket - route message to it
		const activeTicket = await this.findActiveTicketForUser(msg.author.id);
		if (activeTicket) {
			await this.addMessageToTicket(activeTicket, msg);

			// Send confirmation
			await msg.react("📨").catch(() => null);

			// Notify assigned maintainer or all maintainers
			await this.notifyTicketUpdate(activeTicket, msg);
			return true;
		}

		// No active ticket and not a ticket command - let normal DM handling proceed
		return false;
	}

	/**
	 * Notify maintainers about a new ticket
	 * @param {Object} ticket The ticket document
	 * @param {Message} msg Original message
	 */
	async notifyMaintainers (ticket, msg) {
		const embed = {
			color: 0x3273dc,
			title: `🎫 New Support Ticket #${ticket.ticket_number}`,
			author: {
				name: msg.author.tag,
				icon_url: msg.author.displayAvatarURL(),
			},
			description: ticket.subject.substring(0, 1000),
			fields: [
				{ name: "Category", value: ticket.category, inline: true },
				{ name: "Priority", value: ticket.priority, inline: true },
				{ name: "Status", value: ticket.status, inline: true },
			],
			footer: { text: `User ID: ${msg.author.id} | Ticket ID: ${ticket._id}` },
			timestamp: new Date().toISOString(),
		};

		const actionRow = {
			type: 1,
			components: [{
				type: 2,
				style: 5,
				label: "View in Dashboard",
				url: `${global.configJS?.hostingURL || "https://localhost"}/dashboard/maintainer/tickets/${ticket._id}`,
			}],
		};

		for (const maintainerId of global.configJSON.maintainers || []) {
			try {
				const user = await this.client.users.fetch(maintainerId);
				if (user) {
					await user.send({ embeds: [embed], components: [actionRow] }).catch(() => null);
				}
			} catch {
				// Ignore DM failures
			}
		}
	}

	/**
	 * Notify about a ticket update (new user message)
	 * @param {Object} ticket The ticket document
	 * @param {Message} msg New message
	 */
	async notifyTicketUpdate (ticket, msg) {
		const embed = {
			color: 0xe0e7ff,
			title: `📨 New Reply on Ticket #${ticket.ticket_number}`,
			author: {
				name: msg.author.tag,
				icon_url: msg.author.displayAvatarURL(),
			},
			description: msg.content.substring(0, 1000),
			footer: { text: ticket.subject.substring(0, 100) },
			timestamp: new Date().toISOString(),
		};

		// Notify assigned maintainer first, or all maintainers if unassigned
		const notifyList = ticket.assigned_to ?
			[ticket.assigned_to] :
			global.configJSON.maintainers || [];

		for (const maintainerId of notifyList) {
			try {
				const user = await this.client.users.fetch(maintainerId);
				if (user) {
					await user.send({ embeds: [embed] }).catch(() => null);
				}
			} catch {
				// Ignore DM failures
			}
		}
	}

	/**
	 * Close a ticket and notify the user
	 * @param {string} ticketId
	 * @param {string} staffId
	 * @param {string} resolutionNotes
	 */
	async closeTicket (ticketId, staffId, resolutionNotes = "") {
		const ticket = await global.Tickets.findOne(ticketId);
		if (!ticket) return null;

		ticket.query.set("status", "closed");
		ticket.query.set("closed_at", new Date());
		ticket.query.set("updated_at", new Date());
		if (resolutionNotes) {
			ticket.query.set("resolution_notes", resolutionNotes);
		}
		await ticket.save();

		// Remove from cache
		this.activeTicketCache.delete(ticket.user_id);

		// Add system message
		const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const staffUser = await this.client.users.fetch(staffId).catch(() => null);
		await global.TicketMessages.create({
			_id: messageId,
			ticket_id: ticketId,
			author_id: staffId,
			author_username: staffUser?.username || "Staff",
			is_staff: true,
			content: `Ticket closed${resolutionNotes ? `: ${resolutionNotes}` : ""}`,
			is_system_message: true,
			created_at: new Date(),
		});

		// Notify user
		try {
			const user = await this.client.users.fetch(ticket.user_id);
			if (user) {
				await user.send({
					embeds: [{
						color: 0x48c774,
						title: `Ticket #${ticket.ticket_number} Closed`,
						description: resolutionNotes || "Your support ticket has been resolved and closed.",
						footer: { text: "Thank you for contacting support! Start a new ticket anytime by messaging 'ticket <subject>'" },
						timestamp: new Date().toISOString(),
					}],
				}).catch(() => null);
			}
		} catch {
			// Ignore DM failures
		}

		return ticket;
	}
}

module.exports = TicketManager;
