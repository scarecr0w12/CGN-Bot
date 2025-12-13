const { ServerTicketManager } = require("../../Modules/index");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg) => {
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
				description: "The ticket system is not enabled on this server.",
			}],
		});
	}

	// Find ticket for this channel
	const ticket = await client.serverTicketManager.findTicketByChannel(msg.channel.id);

	if (!ticket) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Not a Ticket Channel",
				description: "This command can only be used in a ticket channel.",
			}],
		});
	}

	// Check if user is ticket owner or staff
	const isOwner = ticket.user_id === msg.author.id;
	const memberBotAdminLevel = client.getUserBotAdmin(msg.guild, serverDocument, msg.member);
	const isStaff = memberBotAdminLevel >= 1 ||
		(serverDocument.tickets?.support_roles || []).some(r => msg.member.roles.cache.has(r));

	if (!isOwner && !isStaff) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Permission Denied",
				description: "Only the ticket owner or staff can close this ticket.",
			}],
		});
	}

	const reason = msg.suffix || "";

	try {
		await client.serverTicketManager.closeTicket(msg.guild, serverDocument, ticket._id, msg.author, reason);
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Failed to Close Ticket",
				description: err.message,
			}],
		});
	}
};

module.exports.metadata = {
	command: "ticketclose",
	description: "Close the current support ticket",
	usage: "ticketclose [reason]",
	category: "Utility 🔧",
	adminExempt: true,
	defaults: {
		isEnabled: true,
		isNSFWFiltered: false,
		adminLevel: 0,
	},
};
