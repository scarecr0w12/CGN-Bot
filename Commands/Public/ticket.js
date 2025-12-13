const { ServerTicketManager } = require("../../Modules/index");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	// Initialize server ticket manager
	if (!client.serverTicketManager) {
		client.serverTicketManager = new ServerTicketManager(client);
	}

	// Check if ticket system is enabled
	if (!client.serverTicketManager.isEnabled(serverDocument)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Ticket System Not Available",
				description: "The ticket system is not enabled on this server or requires a premium subscription.",
			}],
		});
	}

	const ticketConfig = serverDocument.tickets;
	const args = msg.suffix ? msg.suffix.split(" ") : [];
	const subcommand = args[0]?.toLowerCase();

	// If no subcommand, create a new ticket
	if (!subcommand || subcommand === "new" || subcommand === "create") {
		const reason = subcommand === "new" || subcommand === "create" ?
			args.slice(1).join(" ") : msg.suffix;

		// Determine category
		let categoryId = "general";
		if (ticketConfig.categories?.length > 0) {
			const categoryArg = args[0]?.toLowerCase();
			const foundCategory = ticketConfig.categories.find(c =>
				c._id.toLowerCase() === categoryArg || c.name.toLowerCase() === categoryArg,
			);
			if (foundCategory) {
				categoryId = foundCategory._id;
			}
		}

		try {
			const { ticket, channel } = await client.serverTicketManager.createTicket(
				msg.guild,
				serverDocument,
				msg.member,
				categoryId,
				reason || "",
			);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "🎫 Ticket Created",
					description: `Your ticket has been created: <#${channel.id}>`,
					fields: [
						{ name: "Ticket Number", value: `#${ticket.ticket_number}`, inline: true },
						{ name: "Category", value: ticket.category_name, inline: true },
					],
				}],
			});
		} catch (err) {
			return msg.send({
				embeds: [{
					color: Colors.ERR,
					title: "Failed to Create Ticket",
					description: err.message,
				}],
			});
		}
	}

	// List user's tickets
	if (subcommand === "list" || subcommand === "my") {
		const tickets = await global.ServerTickets.find({
			server_id: msg.guild.id,
			user_id: msg.author.id,
		}).sort({ created_at: -1 }).limit(10)
			.exec();

		if (!tickets || tickets.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "Your Tickets",
					description: "You don't have any tickets on this server.",
				}],
			});
		}

		const ticketList = tickets.map(t => {
			const status = {
				open: "🟢 Open",
				in_progress: "🔵 In Progress",
				on_hold: "🟡 On Hold",
				closed: "🔴 Closed",
			}[t.status] || t.status;
			return `**#${t.ticket_number}** - ${status}\n${t.subject.substring(0, 50)}`;
		}).join("\n\n");

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "Your Tickets",
				description: ticketList,
				footer: { text: `Showing ${tickets.length} most recent tickets` },
			}],
		});
	}

	// Help
	return msg.send({
		embeds: [{
			color: Colors.INFO,
			title: "🎫 Ticket Commands",
			description: `**${msg.guild.commandPrefix}ticket** - Create a new ticket\n` +
				`**${msg.guild.commandPrefix}ticket [reason]** - Create ticket with reason\n` +
				`**${msg.guild.commandPrefix}ticket list** - View your tickets\n` +
				`**${msg.guild.commandPrefix}ticketclose [reason]** - Close current ticket\n` +
				`**${msg.guild.commandPrefix}ticketadd @user** - Add user to ticket\n` +
				`**${msg.guild.commandPrefix}ticketremove @user** - Remove user from ticket`,
		}],
	});
};

module.exports.metadata = {
	command: "ticket",
	description: "Create and manage support tickets",
	usage: "ticket [reason] | ticket list",
	category: "Utility 🔧",
	adminExempt: true,
	defaults: {
		isEnabled: true,
		isNSFWFiltered: false,
		adminLevel: 0,
	},
};
