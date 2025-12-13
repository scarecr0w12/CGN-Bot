const { SHOP_ITEMS } = require("./shop");
const { CRAFTED_ITEMS } = require("./craft");

const PENDING_TRADES = new Map();
const TRADE_TIMEOUT = 60000; // 60 seconds to accept

function getAllItems () {
	return { ...SHOP_ITEMS, ...CRAFTED_ITEMS };
}

module.exports = async ({ Constants: { Colors }, client }, { serverDocument, userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const inventory = userDocument.economy?.inventory || [];
	const args = msg.suffix ? msg.suffix.split("|").map(a => a.trim()) : [];

	// Check for pending trade acceptance
	if (args[0]?.toLowerCase() === "accept") {
		const pendingTrade = PENDING_TRADES.get(msg.author.id);
		if (!pendingTrade) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "You don't have any pending trade requests!",
				}],
			});
		}

		// Verify trade hasn't expired
		if (Date.now() - pendingTrade.timestamp > TRADE_TIMEOUT) {
			PENDING_TRADES.delete(msg.author.id);
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "This trade request has expired!",
				}],
			});
		}

		// Get both user documents
		const senderUserDocument = await Users.findOne(pendingTrade.senderId);
		if (!senderUserDocument) {
			PENDING_TRADES.delete(msg.author.id);
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Trade sender not found!",
				}],
			});
		}

		const senderInventory = senderUserDocument.economy?.inventory || [];
		const receiverInventory = userDocument.economy?.inventory || [];

		// Verify sender still has the offered items
		for (const offer of pendingTrade.offering) {
			const senderItem = senderInventory.find(i => i.item_id === offer.item_id);
			if (!senderItem || senderItem.quantity < offer.quantity) {
				PENDING_TRADES.delete(msg.author.id);
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "The sender no longer has the offered items!",
					}],
				});
			}
		}

		// Verify receiver still has the requested items (if any)
		for (const request of pendingTrade.requesting) {
			const receiverItem = receiverInventory.find(i => i.item_id === request.item_id);
			if (!receiverItem || receiverItem.quantity < request.quantity) {
				PENDING_TRADES.delete(msg.author.id);
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "You no longer have the requested items!",
					}],
				});
			}
		}

		const senderUserQueryDocument = senderUserDocument.query;

		// Execute the trade - remove from sender, add to receiver
		for (const offer of pendingTrade.offering) {
			const senderItemIndex = senderInventory.findIndex(i => i.item_id === offer.item_id);
			const senderItem = senderInventory[senderItemIndex];

			if (senderItem.quantity === offer.quantity) {
				senderUserQueryDocument.pull("economy.inventory", { item_id: offer.item_id });
			} else {
				senderUserQueryDocument.inc(`economy.inventory.${senderItemIndex}.quantity`, -offer.quantity);
			}

			// Add to receiver
			const receiverExisting = receiverInventory.find(i => i.item_id === offer.item_id);
			if (receiverExisting) {
				const receiverItemIndex = receiverInventory.findIndex(i => i.item_id === offer.item_id);
				userQueryDocument.inc(`economy.inventory.${receiverItemIndex}.quantity`, offer.quantity);
			} else {
				userQueryDocument.push("economy.inventory", {
					_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					item_id: offer.item_id,
					quantity: offer.quantity,
					acquired_at: new Date(),
				});
			}
		}

		// Execute reverse - remove from receiver, add to sender (if requesting items)
		for (const request of pendingTrade.requesting) {
			const receiverItemIndex = receiverInventory.findIndex(i => i.item_id === request.item_id);
			const receiverItem = receiverInventory[receiverItemIndex];

			if (receiverItem.quantity === request.quantity) {
				userQueryDocument.pull("economy.inventory", { item_id: request.item_id });
			} else {
				userQueryDocument.inc(`economy.inventory.${receiverItemIndex}.quantity`, -request.quantity);
			}

			// Add to sender
			const senderExisting = senderInventory.find(i => i.item_id === request.item_id);
			if (senderExisting) {
				const senderItemIndex = senderInventory.findIndex(i => i.item_id === request.item_id);
				senderUserQueryDocument.inc(`economy.inventory.${senderItemIndex}.quantity`, request.quantity);
			} else {
				senderUserQueryDocument.push("economy.inventory", {
					_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					item_id: request.item_id,
					quantity: request.quantity,
					acquired_at: new Date(),
				});
			}
		}

		await senderUserDocument.save();
		PENDING_TRADES.delete(msg.author.id);

		const allItems = getAllItems();
		const offerDisplay = pendingTrade.offering.map(o => {
			const item = allItems[o.item_id];
			return `${item?.emoji || "📦"} ${item?.name || o.item_id} x${o.quantity}`;
		}).join(", ");

		const requestDisplay = pendingTrade.requesting.length > 0 ?
			pendingTrade.requesting.map(r => {
				const item = allItems[r.item_id];
				return `${item?.emoji || "📦"} ${item?.name || r.item_id} x${r.quantity}`;
			}).join(", ") :
			"Nothing (gift)";

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🤝 Trade Complete!",
				description: `Trade between <@${pendingTrade.senderId}> and <@${msg.author.id}> completed!`,
				fields: [
					{
						name: "📤 Items Sent",
						value: offerDisplay,
						inline: true,
					},
					{
						name: "📥 Items Received",
						value: requestDisplay,
						inline: true,
					},
				],
			}],
		});
	}

	// Decline trade
	if (args[0]?.toLowerCase() === "decline" || args[0]?.toLowerCase() === "reject") {
		const pendingTrade = PENDING_TRADES.get(msg.author.id);
		if (!pendingTrade) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "You don't have any pending trade requests!",
				}],
			});
		}

		PENDING_TRADES.delete(msg.author.id);
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: `Trade request from <@${pendingTrade.senderId}> declined.`,
			}],
		});
	}

	// Cancel outgoing trade
	if (args[0]?.toLowerCase() === "cancel") {
		let cancelled = false;
		for (const [receiverId, trade] of PENDING_TRADES.entries()) {
			if (trade.senderId === msg.author.id) {
				PENDING_TRADES.delete(receiverId);
				cancelled = true;
				break;
			}
		}

		if (cancelled) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					description: "Your pending trade request has been cancelled.",
				}],
			});
		}

		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "You don't have any outgoing trade requests!",
			}],
		});
	}

	// Show help
	if (args.length < 2) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🤝 Trade Items",
				description: "Trade items with another user!",
				fields: [
					{
						name: "📤 Start a Trade",
						value: `\`${msg.guild.commandPrefix}${commandData.name} <user> | <your_item> [quantity]\`\nOffer an item to another user`,
						inline: false,
					},
					{
						name: "🔄 Request Items Back",
						value: `\`${msg.guild.commandPrefix}${commandData.name} <user> | <your_item> [qty] | <their_item> [qty]\`\nOffer your item in exchange for theirs`,
						inline: false,
					},
					{
						name: "✅ Accept/Decline",
						value: `\`${msg.guild.commandPrefix}${commandData.name} accept\`\n\`${msg.guild.commandPrefix}${commandData.name} decline\``,
						inline: false,
					},
					{
						name: "❌ Cancel",
						value: `\`${msg.guild.commandPrefix}${commandData.name} cancel\`\nCancel your outgoing trade`,
						inline: false,
					},
				],
			}],
		});
	}

	// Parse trade request: user | offer [qty] | request [qty]
	const [userArg, offerArg, requestArg] = args;

	const member = await client.memberSearch(userArg, msg.guild).catch(() => null);
	if (!member) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "I couldn't find that user! 🔍",
			}],
		});
	}

	if (member.user.bot) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "You can't trade with bots! 🤖",
			}],
		});
	}

	if (member.id === msg.author.id) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "You can't trade with yourself! 🤔",
			}],
		});
	}

	// Check if receiver already has a pending trade
	if (PENDING_TRADES.has(member.id)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "This user already has a pending trade request!",
			}],
		});
	}

	// Parse offer
	const offerParts = offerArg.trim().split(" ");
	const offerItemId = offerParts[0].toLowerCase().replace(/ /g, "_");
	const offerQuantity = offerParts[1] ? parseInt(offerParts[1], 10) : 1;

	if (isNaN(offerQuantity) || offerQuantity < 1) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Please enter a valid quantity!",
			}],
		});
	}

	// Check if sender has the item
	const senderItem = inventory.find(i => i.item_id === offerItemId);
	if (!senderItem || senderItem.quantity < offerQuantity) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You don't have enough of this item!\n\nYou have: **${senderItem?.quantity || 0}x ${offerItemId}**`,
			}],
		});
	}

	const offering = [{ item_id: offerItemId, quantity: offerQuantity }];
	const requesting = [];

	// Parse request if provided
	if (requestArg) {
		const requestParts = requestArg.trim().split(" ");
		const requestItemId = requestParts[0].toLowerCase().replace(/ /g, "_");
		const requestQuantity = requestParts[1] ? parseInt(requestParts[1], 10) : 1;

		if (isNaN(requestQuantity) || requestQuantity < 1) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Please enter a valid request quantity!",
				}],
			});
		}

		// Check if receiver has the item
		let receiverUserDocument = await Users.findOne(member.id);
		if (!receiverUserDocument) {
			receiverUserDocument = Users.new({ _id: member.id });
		}

		const receiverInventory = receiverUserDocument.economy?.inventory || [];
		const receiverItem = receiverInventory.find(i => i.item_id === requestItemId);

		if (!receiverItem || receiverItem.quantity < requestQuantity) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `**@${client.getName(serverDocument, member)}** doesn't have enough of that item!`,
				}],
			});
		}

		requesting.push({ item_id: requestItemId, quantity: requestQuantity });
	}

	// Create pending trade
	PENDING_TRADES.set(member.id, {
		senderId: msg.author.id,
		senderName: msg.author.username,
		receiverId: member.id,
		offering,
		requesting,
		timestamp: Date.now(),
	});

	// Auto-expire after timeout
	setTimeout(() => {
		if (PENDING_TRADES.has(member.id)) {
			const trade = PENDING_TRADES.get(member.id);
			if (trade.senderId === msg.author.id && trade.timestamp === PENDING_TRADES.get(member.id).timestamp) {
				PENDING_TRADES.delete(member.id);
			}
		}
	}, TRADE_TIMEOUT);

	const allItems = getAllItems();
	const offerDisplay = offering.map(o => {
		const item = allItems[o.item_id];
		return `${item?.emoji || "📦"} **${item?.name || o.item_id}** x${o.quantity}`;
	}).join("\n");

	const requestDisplay = requesting.length > 0 ?
		requesting.map(r => {
			const item = allItems[r.item_id];
			return `${item?.emoji || "📦"} **${item?.name || r.item_id}** x${r.quantity}`;
		}).join("\n") :
		"*Nothing (gift)*";

	msg.send({
		embeds: [{
			color: Colors.INFO,
			title: "🤝 Trade Request Sent!",
			description: `<@${member.id}>, you have a trade request from **@${msg.author.username}**!`,
			fields: [
				{
					name: "📤 They're Offering",
					value: offerDisplay,
					inline: true,
				},
				{
					name: "📥 They're Requesting",
					value: requestDisplay,
					inline: true,
				},
			],
			footer: {
				text: `Use ${msg.guild.commandPrefix}${commandData.name} accept or decline | Expires in 60 seconds`,
			},
		}],
	});
};
