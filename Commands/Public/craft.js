const { SHOP_ITEMS } = require("./shop");

const RECIPES = {
	lucky_charm: {
		name: "Lucky Charm",
		description: "A powerful charm that doubles gamble win bonus",
		emoji: "🍀",
		ingredients: [
			{ item_id: "lucky_coin", quantity: 3 },
		],
		result: {
			item_id: "lucky_charm",
			quantity: 1,
		},
	},
	master_thief_kit: {
		name: "Master Thief Kit",
		description: "Increases robbery success by 25% for one use",
		emoji: "🎭",
		ingredients: [
			{ item_id: "robbers_mask", quantity: 2 },
			{ item_id: "padlock", quantity: 1 },
		],
		result: {
			item_id: "master_thief_kit",
			quantity: 1,
		},
	},
	vault_key: {
		name: "Vault Key",
		description: "Instantly upgrades bank capacity by 25,000",
		emoji: "🔑",
		ingredients: [
			{ item_id: "padlock", quantity: 5 },
		],
		result: {
			item_id: "vault_key",
			quantity: 1,
		},
	},
	golden_crown: {
		name: "Golden Crown",
		description: "A legendary collectible showing mastery",
		emoji: "👑",
		ingredients: [
			{ item_id: "collectors_badge", quantity: 2 },
			{ item_id: "diamond_trophy", quantity: 1 },
		],
		result: {
			item_id: "golden_crown",
			quantity: 1,
		},
	},
};

// Add crafted items to be recognized
const CRAFTED_ITEMS = {
	lucky_charm: {
		name: "Lucky Charm",
		description: "Doubles gamble win bonus for one use",
		price: 5000,
		emoji: "🍀",
		type: "item",
		consumable: true,
	},
	master_thief_kit: {
		name: "Master Thief Kit",
		description: "Increases robbery success by 25% for one use",
		price: 8000,
		emoji: "🎭",
		type: "item",
		consumable: true,
	},
	vault_key: {
		name: "Vault Key",
		description: "Instantly upgrades bank capacity by 25,000",
		price: 15000,
		emoji: "🔑",
		type: "upgrade",
	},
	golden_crown: {
		name: "Golden Crown",
		description: "A legendary collectible showing mastery",
		price: 150000,
		emoji: "👑",
		type: "collectible",
	},
};

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const inventory = userDocument.economy?.inventory || [];
	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];

	if (!args.length || args[0] === "list" || args[0] === "recipes") {
		// Show available recipes
		const recipeList = Object.entries(RECIPES).map(([id, recipe]) => {
			const ingredients = recipe.ingredients.map(ing => {
				const item = SHOP_ITEMS[ing.item_id] || CRAFTED_ITEMS[ing.item_id];
				const owned = inventory.find(i => i.item_id === ing.item_id)?.quantity || 0;
				const status = owned >= ing.quantity ? "✅" : "❌";
				return `${status} ${item?.emoji || "📦"} ${item?.name || ing.item_id} x${ing.quantity} (have: ${owned})`;
			}).join("\n");

			return `${recipe.emoji} **${recipe.name}**\n${recipe.description}\n\n**Ingredients:**\n${ingredients}\n\`${id}\``;
		});

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "⚗️ Crafting Recipes",
				description: recipeList.join("\n\n─────────────\n\n"),
				footer: {
					text: `Use ${msg.guild.commandPrefix}${commandData.name} <recipe_id> to craft`,
				},
			}],
		});
	}

	// Craft an item
	const recipeId = args.join("_");
	const recipe = RECIPES[recipeId];

	if (!recipe) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Recipe not found!\n\nUse \`${msg.guild.commandPrefix}${commandData.name}\` to see available recipes.`,
			}],
		});
	}

	// Check if user has all ingredients
	const missingIngredients = [];
	for (const ing of recipe.ingredients) {
		const owned = inventory.find(i => i.item_id === ing.item_id)?.quantity || 0;
		if (owned < ing.quantity) {
			const item = SHOP_ITEMS[ing.item_id] || CRAFTED_ITEMS[ing.item_id];
			missingIngredients.push(`${item?.emoji || "📦"} ${item?.name || ing.item_id}: need ${ing.quantity}, have ${owned}`);
		}
	}

	if (missingIngredients.length > 0) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "❌ Missing Ingredients",
				description: `You don't have all the required materials:\n\n${missingIngredients.join("\n")}`,
			}],
		});
	}

	// Remove ingredients
	for (const ing of recipe.ingredients) {
		const itemIndex = inventory.findIndex(i => i.item_id === ing.item_id);
		const invItem = inventory[itemIndex];

		if (invItem.quantity === ing.quantity) {
			userQueryDocument.pull("economy.inventory", { item_id: ing.item_id });
		} else {
			userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, -ing.quantity);
		}
	}

	// Add crafted item
	const existingCrafted = inventory.find(i => i.item_id === recipe.result.item_id);
	if (existingCrafted) {
		const craftedIndex = inventory.findIndex(i => i.item_id === recipe.result.item_id);
		userQueryDocument.inc(`economy.inventory.${craftedIndex}.quantity`, recipe.result.quantity);
	} else {
		userQueryDocument.push("economy.inventory", {
			_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			item_id: recipe.result.item_id,
			quantity: recipe.result.quantity,
			acquired_at: new Date(),
		});
	}

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "⚗️ Crafting Successful!",
			description: `You crafted **${recipe.result.quantity}x ${recipe.emoji} ${recipe.name}**!`,
			footer: {
				text: `Use ${msg.guild.commandPrefix}inventory to see your items`,
			},
		}],
	});
};

module.exports.RECIPES = RECIPES;
module.exports.CRAFTED_ITEMS = CRAFTED_ITEMS;
