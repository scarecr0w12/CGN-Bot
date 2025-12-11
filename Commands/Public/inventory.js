const { SHOP_ITEMS } = require("./shop");

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const inventory = userDocument.economy?.inventory || [];

	if (inventory.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎒 Your Inventory",
				description: "Your inventory is empty!",
				footer: {
					text: `Use ${msg.guild.commandPrefix}shop to browse items`,
				},
			}],
		});
	}

	const items = inventory.map(inv => {
		const itemData = SHOP_ITEMS[inv.item_id] || {
			name: inv.item_id,
			emoji: "📦",
			description: "Unknown item",
			type: "unknown",
		};

		return {
			...itemData,
			quantity: inv.quantity,
			itemId: inv.item_id,
			acquiredAt: inv.acquired_at,
		};
	});

	// Group by type
	const categories = {
		upgrade: { name: "🔧 Upgrades", items: [] },
		item: { name: "📦 Consumable Items", items: [] },
		collectible: { name: "✨ Collectibles", items: [] },
		unknown: { name: "❓ Other", items: [] },
	};

	for (const item of items) {
		const category = categories[item.type] || categories.unknown;
		category.items.push(item);
	}

	const fields = [];
	for (const category of Object.values(categories)) {
		if (category.items.length > 0) {
			const value = category.items.map(item =>
				`${item.emoji} **${item.name}** x${item.quantity}`,
			).join("\n");
			fields.push({
				name: category.name,
				value,
				inline: true,
			});
		}
	}

	const totalItems = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
	const totalValue = inventory.reduce((sum, inv) => {
		const itemData = SHOP_ITEMS[inv.item_id];
		return sum + (itemData ? itemData.price * inv.quantity : 0);
	}, 0);

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🎒 Your Inventory",
			fields,
			footer: {
				text: `Total items: ${totalItems} | Estimated value: ${totalValue.toLocaleString()} coins`,
			},
		}],
	});
};
