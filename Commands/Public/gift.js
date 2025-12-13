const { SHOP_ITEMS } = require("./shop");

module.exports = async ({ Constants: { Colors }, client }, { serverDocument, userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const inventory = userDocument.economy?.inventory || [];
	const args = msg.suffix ? msg.suffix.split("|").map(a => a.trim()) : [];

	if (args.length < 2) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎁 Gift Items",
				description: "Gift items from your inventory to another user!",
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <user> | <item_id> [quantity]`,
				},
			}],
		});
	}

	const [userArg, itemArgs] = args;
	const itemParts = itemArgs.split(" ");
	const itemId = itemParts[0].toLowerCase().replace(/ /g, "_");
	const quantity = itemParts[1] ? parseInt(itemParts[1], 10) : 1;

	// Find target user
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
				description: "You can't gift items to bots! 🤖",
			}],
		});
	}

	if (member.id === msg.author.id) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "You can't gift items to yourself! 🤔",
			}],
		});
	}

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
				description: `You don't have **${itemId}** in your inventory!`,
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
	const itemData = SHOP_ITEMS[itemId] || {
		name: itemId,
		emoji: "📦",
	};

	// Get or create target user document
	let targetUserDocument = await Users.findOne(member.id);
	if (!targetUserDocument) {
		targetUserDocument = Users.new({ _id: member.id });
	}
	const targetUserQueryDocument = targetUserDocument.query;

	if (!targetUserDocument.economy) {
		targetUserQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	// Remove from sender's inventory
	const itemIndex = inventory.findIndex(i => i.item_id === itemId);
	if (invItem.quantity === quantity) {
		userQueryDocument.pull("economy.inventory", { item_id: itemId });
	} else {
		userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, -quantity);
	}

	// Add to recipient's inventory
	const targetInventory = targetUserDocument.economy?.inventory || [];
	const targetExistingItem = targetInventory.find(i => i.item_id === itemId);

	if (targetExistingItem) {
		const targetItemIndex = targetInventory.findIndex(i => i.item_id === itemId);
		targetUserQueryDocument.inc(`economy.inventory.${targetItemIndex}.quantity`, quantity);
	} else {
		targetUserQueryDocument.push("economy.inventory", {
			_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			item_id: itemId,
			quantity: quantity,
			acquired_at: new Date(),
		});
	}

	await targetUserDocument.save();

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "🎁 Gift Sent!",
			description: `You gifted **${quantity}x ${itemData.emoji} ${itemData.name}** to **@${client.getName(serverDocument, member)}**!`,
			footer: {
				text: invItem.quantity > quantity ? `You have ${invItem.quantity - quantity} remaining` : "That was your last one!",
			},
		}],
	});
};
