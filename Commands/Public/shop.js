const SHOP_ITEMS = {
	bank_upgrade_small: {
		name: "Small Bank Upgrade",
		description: "Increases bank capacity by 2,500",
		price: 5000,
		emoji: "🏦",
		type: "upgrade",
		effect: { bank_capacity: 2500 },
	},
	bank_upgrade_medium: {
		name: "Medium Bank Upgrade",
		description: "Increases bank capacity by 10,000",
		price: 15000,
		emoji: "🏛️",
		type: "upgrade",
		effect: { bank_capacity: 10000 },
	},
	bank_upgrade_large: {
		name: "Large Bank Upgrade",
		description: "Increases bank capacity by 50,000",
		price: 60000,
		emoji: "💎",
		type: "upgrade",
		effect: { bank_capacity: 50000 },
	},
	padlock: {
		name: "Padlock",
		description: "Protects you from one robbery attempt",
		price: 2500,
		emoji: "🔒",
		type: "item",
		consumable: true,
	},
	lucky_coin: {
		name: "Lucky Coin",
		description: "Increases gamble win chance by 10% for one use",
		price: 1500,
		emoji: "🍀",
		type: "item",
		consumable: true,
	},
	robbers_mask: {
		name: "Robber's Mask",
		description: "Increases robbery success chance by 15% for one use",
		price: 3000,
		emoji: "🎭",
		type: "item",
		consumable: true,
	},
	golden_ticket: {
		name: "Golden Ticket",
		description: "Doubles your next daily reward",
		price: 5000,
		emoji: "🎫",
		type: "item",
		consumable: true,
	},
	collectors_badge: {
		name: "Collector's Badge",
		description: "A rare collectible badge to show off",
		price: 25000,
		emoji: "🏅",
		type: "collectible",
	},
	diamond_trophy: {
		name: "Diamond Trophy",
		description: "The ultimate symbol of wealth",
		price: 100000,
		emoji: "🏆",
		type: "collectible",
	},
};

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const wallet = userDocument.economy?.wallet || 0;
	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];

	if (!args.length || args[0] === "list") {
		// Show shop
		const categories = {
			upgrade: { name: "🔧 Upgrades", items: [] },
			item: { name: "📦 Items", items: [] },
			collectible: { name: "✨ Collectibles", items: [] },
		};

		for (const [id, item] of Object.entries(SHOP_ITEMS)) {
			categories[item.type].items.push({ id, ...item });
		}

		const fields = [];
		for (const category of Object.values(categories)) {
			if (category.items.length > 0) {
				const value = category.items.map(item =>
					`${item.emoji} **${item.name}** - ${item.price.toLocaleString()} coins\n\`${item.id}\` - ${item.description}`,
				).join("\n\n");
				fields.push({
					name: category.name,
					value,
					inline: false,
				});
			}
		}

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🛒 Economy Shop",
				description: `Welcome to the shop! Use \`${msg.guild.commandPrefix}${commandData.name} buy <item_id>\` to purchase.\n\n💵 Your wallet: **${wallet.toLocaleString()}** coins`,
				fields,
			}],
		});
	}

	if (args[0] === "buy") {
		const itemId = args.slice(1).join("_");
		const item = SHOP_ITEMS[itemId];

		if (!item) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Item not found! Use \`${msg.guild.commandPrefix}${commandData.name}\` to see available items.`,
				}],
			});
		}

		if (wallet < item.price) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `You don't have enough coins!\n\n${item.emoji} **${item.name}** costs **${item.price.toLocaleString()}** coins\n💵 Your wallet: **${wallet.toLocaleString()}** coins`,
				}],
			});
		}

		// Deduct cost
		userQueryDocument.inc("economy.wallet", -item.price);

		// Apply effect based on item type
		if (item.type === "upgrade" && item.effect) {
			if (item.effect.bank_capacity) {
				userQueryDocument.inc("economy.bank_capacity", item.effect.bank_capacity);
			}

			const newCapacity = (userDocument.economy?.bank_capacity || 5000) + (item.effect.bank_capacity || 0);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: `${item.emoji} Upgrade Applied!`,
					description: `You purchased **${item.name}** for **${item.price.toLocaleString()}** coins!`,
					fields: [
						{
							name: "🏦 New Bank Capacity",
							value: `${newCapacity.toLocaleString()} coins`,
							inline: true,
						},
						{
							name: "💵 Remaining Balance",
							value: `${(wallet - item.price).toLocaleString()} coins`,
							inline: true,
						},
					],
				}],
			});
		}

		// Add to inventory for items and collectibles
		const inventory = userDocument.economy?.inventory || [];
		const existingItem = inventory.find(i => i.item_id === itemId);

		if (existingItem) {
			// Increment quantity
			const itemIndex = inventory.findIndex(i => i.item_id === itemId);
			userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, 1);
		} else {
			// Add new item
			userQueryDocument.push("economy.inventory", {
				_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				item_id: itemId,
				quantity: 1,
				acquired_at: new Date(),
			});
		}

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: `${item.emoji} Purchase Successful!`,
				description: `You purchased **${item.name}** for **${item.price.toLocaleString()}** coins!`,
				fields: [
					{
						name: "💵 Remaining Balance",
						value: `${(wallet - item.price).toLocaleString()} coins`,
						inline: true,
					},
				],
				footer: {
					text: `Use ${msg.guild.commandPrefix}inventory to see your items`,
				},
			}],
		});
	}

	// Show item info
	const itemId = args.join("_");
	const item = SHOP_ITEMS[itemId];

	if (item) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: `${item.emoji} ${item.name}`,
				description: item.description,
				fields: [
					{
						name: "💰 Price",
						value: `${item.price.toLocaleString()} coins`,
						inline: true,
					},
					{
						name: "📁 Type",
						value: item.type.charAt(0).toUpperCase() + item.type.slice(1),
						inline: true,
					},
					{
						name: "🔄 Consumable",
						value: item.consumable ? "Yes" : "No",
						inline: true,
					},
				],
				footer: {
					text: `Use ${msg.guild.commandPrefix}${commandData.name} buy ${itemId} to purchase`,
				},
			}],
		});
	}

	msg.send({
		embeds: [{
			color: Colors.SOFT_ERR,
			description: `Unknown command or item. Use \`${msg.guild.commandPrefix}${commandData.name}\` to see the shop.`,
		}],
	});
};

module.exports.SHOP_ITEMS = SHOP_ITEMS;
