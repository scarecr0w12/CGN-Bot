const { SHOP_ITEMS } = require("./shop");

const ITEM_EFFECTS = {
	padlock: {
		apply: (userQueryDocument, userDocument) => {
			userQueryDocument.set("economy.padlock_active", true);
			return "🔒 **Padlock activated!** You are now protected from the next robbery attempt.";
		},
	},
	lucky_coin: {
		apply: (userQueryDocument, userDocument) => {
			const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
			userQueryDocument.set("economy.lucky_coin_expiry", expiry);
			return "🍀 **Lucky Coin activated!** Your gamble win chance is increased by 10% for the next hour.";
		},
	},
	robbers_mask: {
		apply: (userQueryDocument, userDocument) => {
			const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
			userQueryDocument.set("economy.robbers_mask_expiry", expiry);
			return "🎭 **Robber's Mask equipped!** Your robbery success chance is increased by 15% for the next hour.";
		},
	},
	golden_ticket: {
		apply: (userQueryDocument, userDocument) => {
			userQueryDocument.set("economy.golden_ticket_active", true);
			return "🎫 **Golden Ticket activated!** Your next daily reward will be doubled.";
		},
	},
};

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const inventory = userDocument.economy?.inventory || [];

	if (!msg.suffix) {
		// Show usable items
		const usableItems = inventory.filter(inv => {
			const itemData = SHOP_ITEMS[inv.item_id];
			return itemData && itemData.consumable && ITEM_EFFECTS[inv.item_id];
		});

		if (usableItems.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "🎒 Use Items",
					description: "You don't have any usable items!\n\nVisit the shop to purchase consumable items.",
					footer: {
						text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <item_id>`,
					},
				}],
			});
		}

		const itemList = usableItems.map(inv => {
			const itemData = SHOP_ITEMS[inv.item_id];
			return `${itemData.emoji} **${itemData.name}** x${inv.quantity}\n\`${inv.item_id}\` - ${itemData.description}`;
		}).join("\n\n");

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎒 Usable Items",
				description: itemList,
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <item_id>`,
				},
			}],
		});
	}

	const itemId = msg.suffix.toLowerCase().replace(/ /g, "_");

	// Find item in inventory
	const invItem = inventory.find(i => i.item_id === itemId);
	if (!invItem) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You don't have **${itemId}** in your inventory!`,
			}],
		});
	}

	// Check if item is usable
	const itemData = SHOP_ITEMS[itemId];
	if (!itemData || !itemData.consumable) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "This item cannot be used!",
			}],
		});
	}

	const effect = ITEM_EFFECTS[itemId];
	if (!effect) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "This item has no effect defined!",
			}],
		});
	}

	// Consume item
	const itemIndex = inventory.findIndex(i => i.item_id === itemId);
	if (invItem.quantity === 1) {
		userQueryDocument.pull("economy.inventory", { item_id: itemId });
	} else {
		userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, -1);
	}

	// Apply effect
	const resultMessage = effect.apply(userQueryDocument, userDocument);

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: `${itemData.emoji} Item Used!`,
			description: resultMessage,
			footer: {
				text: invItem.quantity > 1 ? `Remaining: ${invItem.quantity - 1}` : "Last one used!",
			},
		}],
	});
};
