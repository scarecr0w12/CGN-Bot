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

	// Only staff can remove users
	const memberBotAdminLevel = client.getUserBotAdmin(msg.guild, serverDocument, msg.member);
	const isStaff = memberBotAdminLevel >= 1 ||
		(serverDocument.tickets?.support_roles || []).some(r => msg.member.roles.cache.has(r));

	if (!isStaff) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Permission Denied",
				description: "Only staff can remove users from tickets.",
			}],
		});
	}

	// Get mentioned user
	const userToRemove = msg.mentions.users.first();
	if (!userToRemove) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Missing User",
				description: "Please mention a user to remove from this ticket.",
			}],
		});
	}

	try {
		await client.serverTicketManager.removeUserFromTicket(msg.guild, ticket._id, userToRemove);

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "User Removed",
				description: `<@${userToRemove.id}> has been removed from this ticket.`,
			}],
		});
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Failed to Remove User",
				description: err.message,
			}],
		});
	}
};

module.exports.metadata = {
	command: "ticketremove",
	description: "Remove a user from the current ticket",
	usage: "ticketremove @user",
	category: "Utility 🔧",
	adminExempt: true,
	defaults: {
		isEnabled: true,
		isNSFWFiltered: false,
		adminLevel: 0,
	},
};
