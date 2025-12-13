const UPGRADES = {
	bank_capacity: {
		name: "Bank Capacity",
		description: "Increase your bank storage limit",
		emoji: "🏦",
		levels: [
			{ level: 1, cost: 1000, bonus: 2500, total: 7500 },
			{ level: 2, cost: 2500, bonus: 5000, total: 12500 },
			{ level: 3, cost: 5000, bonus: 7500, total: 20000 },
			{ level: 4, cost: 10000, bonus: 15000, total: 35000 },
			{ level: 5, cost: 25000, bonus: 25000, total: 60000 },
			{ level: 6, cost: 50000, bonus: 40000, total: 100000 },
			{ level: 7, cost: 100000, bonus: 50000, total: 150000 },
			{ level: 8, cost: 200000, bonus: 100000, total: 250000 },
			{ level: 9, cost: 500000, bonus: 250000, total: 500000 },
			{ level: 10, cost: 1000000, bonus: 500000, total: 1000000 },
		],
		apply: (userQueryDocument, bonus) => {
			userQueryDocument.inc("economy.bank_capacity", bonus);
		},
	},
	daily_bonus: {
		name: "Daily Multiplier",
		description: "Increase your daily reward",
		emoji: "📅",
		levels: [
			{ level: 1, cost: 2000, bonus: 10, display: "+10 coins" },
			{ level: 2, cost: 5000, bonus: 25, display: "+25 coins" },
			{ level: 3, cost: 10000, bonus: 50, display: "+50 coins" },
			{ level: 4, cost: 25000, bonus: 100, display: "+100 coins" },
			{ level: 5, cost: 50000, bonus: 200, display: "+200 coins" },
		],
		apply: (userQueryDocument, bonus, level) => {
			userQueryDocument.set("economy.daily_bonus_level", level);
		},
	},
	work_bonus: {
		name: "Work Efficiency",
		description: "Earn more from working",
		emoji: "💼",
		levels: [
			{ level: 1, cost: 3000, bonus: 20, display: "+20% earnings" },
			{ level: 2, cost: 8000, bonus: 40, display: "+40% earnings" },
			{ level: 3, cost: 20000, bonus: 60, display: "+60% earnings" },
			{ level: 4, cost: 50000, bonus: 80, display: "+80% earnings" },
			{ level: 5, cost: 100000, bonus: 100, display: "+100% earnings" },
		],
		apply: (userQueryDocument, bonus, level) => {
			userQueryDocument.set("economy.work_bonus_level", level);
		},
	},
	rob_protection: {
		name: "Security System",
		description: "Reduce coins lost when robbed",
		emoji: "🛡️",
		levels: [
			{ level: 1, cost: 5000, bonus: 10, display: "-10% loss" },
			{ level: 2, cost: 15000, bonus: 25, display: "-25% loss" },
			{ level: 3, cost: 40000, bonus: 40, display: "-40% loss" },
			{ level: 4, cost: 100000, bonus: 60, display: "-60% loss" },
			{ level: 5, cost: 250000, bonus: 80, display: "-80% loss" },
		],
		apply: (userQueryDocument, bonus, level) => {
			userQueryDocument.set("economy.rob_protection_level", level);
		},
	},
};

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	const wallet = userDocument.economy?.wallet || 0;
	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];

	if (!args.length || args[0] === "list") {
		// Show available upgrades
		const upgradeList = Object.entries(UPGRADES).map(([id, upgrade]) => {
			const currentLevel = userDocument.economy?.[`${id}_level`] || 0;
			const nextLevel = upgrade.levels.find(l => l.level === currentLevel + 1);

			let status;
			if (!nextLevel) {
				status = "✅ **MAX LEVEL**";
			} else {
				const canAfford = wallet >= nextLevel.cost;
				const costDisplay = `${nextLevel.cost.toLocaleString()} coins`;
				const bonusDisplay = nextLevel.display || `+${nextLevel.bonus.toLocaleString()}`;
				status = `Level ${currentLevel} → ${currentLevel + 1}\nCost: ${canAfford ? "✅" : "❌"} ${costDisplay}\nBonus: ${bonusDisplay}`;
			}

			return `${upgrade.emoji} **${upgrade.name}**\n${upgrade.description}\n${status}\n\`${id}\``;
		});

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "⬆️ Upgrades",
				description: upgradeList.join("\n\n─────────────\n\n"),
				footer: {
					text: `💵 Wallet: ${wallet.toLocaleString()} coins | Use ${msg.guild.commandPrefix}${commandData.name} <upgrade_id>`,
				},
			}],
		});
	}

	// Purchase upgrade
	const upgradeId = args.join("_");
	const upgrade = UPGRADES[upgradeId];

	if (!upgrade) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Upgrade not found!\n\nUse \`${msg.guild.commandPrefix}${commandData.name}\` to see available upgrades.`,
			}],
		});
	}

	const currentLevel = userDocument.economy?.[`${upgradeId}_level`] || 0;
	const nextLevel = upgrade.levels.find(l => l.level === currentLevel + 1);

	if (!nextLevel) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: `${upgrade.emoji} ${upgrade.name}`,
				description: "This upgrade is already at maximum level!",
			}],
		});
	}

	if (wallet < nextLevel.cost) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: `${upgrade.emoji} ${upgrade.name}`,
				description: `You don't have enough coins!\n\n💵 Required: **${nextLevel.cost.toLocaleString()}** coins\n💵 You have: **${wallet.toLocaleString()}** coins`,
			}],
		});
	}

	// Deduct cost and apply upgrade
	userQueryDocument.inc("economy.wallet", -nextLevel.cost);
	userQueryDocument.set(`economy.${upgradeId}_level`, nextLevel.level);

	// Apply the upgrade effect
	if (upgrade.apply) {
		upgrade.apply(userQueryDocument, nextLevel.bonus, nextLevel.level);
	}

	const newWallet = wallet - nextLevel.cost;
	const bonusDisplay = nextLevel.display || `+${nextLevel.bonus.toLocaleString()}`;

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: `${upgrade.emoji} Upgrade Successful!`,
			description: `**${upgrade.name}** upgraded to level **${nextLevel.level}**!`,
			fields: [
				{
					name: "🎁 Bonus",
					value: bonusDisplay,
					inline: true,
				},
				{
					name: "💵 Remaining",
					value: `${newWallet.toLocaleString()} coins`,
					inline: true,
				},
			],
		}],
	});
};

module.exports.UPGRADES = UPGRADES;
