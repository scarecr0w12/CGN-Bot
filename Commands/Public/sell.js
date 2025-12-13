const { SHOP_ITEMS } = require("./shop");

const SELL_RATE = 0.5; // Sell items back for 50% of their value

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const inventory = userDocument.economy?.inventory || [];
	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];

	if (!args.length) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "💸 Sell Items",
				description: `Sell items from your inventory for **${(SELL_RATE * 100).toFixed(0)}%** of their original price.`,
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <item_id> [quantity]`,
				},
			}],
		});
	}

	const itemId = args[0].replace(/_/g, "_");
	const quantity = args[1] ? parseInt(args[1], 10) : 1;

	if (isNaN(quantity) || quantity < 1) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Please enter a valid quantity!",
			}],
		});
	}

	// Find item in inventory
	const invItem = inventory.find(i => i.item_id === itemId);
	if (!invItem) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You don't have **${itemId}** in your inventory!\n\nUse \`${msg.guild.commandPrefix}inventory\` to see your items.`,
			}],
		});
	}

	if (invItem.quantity < quantity) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You only have **${invItem.quantity}** of this item!`,
			}],
		});
	}

	// Get item data
	const itemData = SHOP_ITEMS[itemId];
	if (!itemData) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "This item cannot be sold!",
			}],
		});
	}

	// Calculate sell price
	const sellPrice = Math.floor(itemData.price * SELL_RATE * quantity);

	// Update inventory
	const itemIndex = inventory.findIndex(i => i.item_id === itemId);
	if (invItem.quantity === quantity) {
		// Remove item entirely
		userQueryDocument.pull("economy.inventory", { item_id: itemId });
	} else {
		// Decrease quantity
		userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, -quantity);
	}

	// Add coins
	userQueryDocument.inc("economy.wallet", sellPrice);

	const newWallet = (userDocument.economy?.wallet || 0) + sellPrice;

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "💸 Item Sold!",
			description: `You sold **${quantity}x ${itemData.emoji} ${itemData.name}** for **${sellPrice.toLocaleString()}** coins!`,
			fields: [
				{
					name: "💵 New Wallet Balance",
					value: `${newWallet.toLocaleString()} coins`,
					inline: true,
				},
			],
			footer: {
				text: `Sell rate: ${(SELL_RATE * 100).toFixed(0)}% of original price`,
			},
		}],
	});
};
