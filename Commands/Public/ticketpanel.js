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
				description: "The ticket system is not enabled on this server or requires a premium subscription.",
			}],
		});
	}

	// Only admins can create panels
	const memberBotAdminLevel = client.getUserBotAdmin(msg.guild, serverDocument, msg.member);
	if (memberBotAdminLevel < 2) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Permission Denied",
				description: "Only server administrators can create ticket panels.",
			}],
		});
	}

	const args = msg.suffix ? msg.suffix.split("|").map(s => s.trim()) : [];
	const title = args[0] || "🎫 Create a Support Ticket";
	const description = args[1] || "Click the button below to create a support ticket. Our team will respond as soon as possible.";

	try {
		const { panelId } = await client.serverTicketManager.createPanel(
			msg.guild,
			serverDocument,
			msg.channel,
			{ title, description },
		);

		// Delete the command message
		try {
			await msg.delete();
		} catch {
			// May not have permission
		}

		return null;
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Failed to Create Panel",
				description: err.message,
			}],
		});
	}
};

module.exports.metadata = {
	command: "ticketpanel",
	description: "Create a ticket panel with buttons for ticket creation",
	usage: "ticketpanel [title | description]",
	category: "Moderation ⚒️",
	adminExempt: false,
	defaults: {
		isEnabled: true,
		isNSFWFiltered: false,
		adminLevel: 2,
	},
};
