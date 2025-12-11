const OUTCOMES = [
	{ multiplier: 0, chance: 0.45, message: "You lost it all! 😢", emoji: "💀" },
	{ multiplier: 1.5, chance: 0.30, message: "Small win! 🎉", emoji: "🪙" },
	{ multiplier: 2, chance: 0.15, message: "Nice win! 💰", emoji: "💵" },
	{ multiplier: 3, chance: 0.07, message: "Big win! 🤑", emoji: "💎" },
	{ multiplier: 5, chance: 0.025, message: "HUGE WIN! 🎊", emoji: "🏆" },
	{ multiplier: 10, chance: 0.005, message: "JACKPOT!!! 🎰", emoji: "👑" },
];

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	const wallet = userDocument.economy?.wallet || 0;

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎲 Gamble",
				description: "Test your luck! Bet coins from your wallet.",
				fields: [
					{
						name: "Odds",
						value: OUTCOMES.map(o => `${o.emoji} ${o.multiplier}x - ${(o.chance * 100).toFixed(1)}%`).join("\n"),
						inline: false,
					},
				],
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <amount|all> | 💵 Wallet: ${wallet.toLocaleString()} coins`,
				},
			}],
		});
	}

	let amount;
	if (msg.suffix.toLowerCase() === "all" || msg.suffix.toLowerCase() === "max") {
		amount = wallet;
	} else {
		amount = parseInt(msg.suffix, 10);
	}

	if (isNaN(amount) || amount <= 0) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Please enter a valid amount to gamble! 🎲",
			}],
		});
	}

	if (amount > wallet) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You don't have enough coins!\n\n💵 Wallet: **${wallet.toLocaleString()}** coins`,
			}],
		});
	}

	if (amount < 10) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Minimum bet is **10** coins! 🎲",
			}],
		});
	}

	// Determine outcome
	const roll = Math.random();
	let cumulative = 0;
	let outcome = OUTCOMES[0];

	for (const o of OUTCOMES) {
		cumulative += o.chance;
		if (roll < cumulative) {
			outcome = o;
			break;
		}
	}

	const winnings = Math.floor(amount * outcome.multiplier);
	const profit = winnings - amount;

	userQueryDocument.inc("economy.wallet", profit);

	if (profit > 0) {
		userQueryDocument.inc("economy.total_earned", profit);
	} else if (profit < 0) {
		userQueryDocument.inc("economy.total_lost", Math.abs(profit));
	}

	const newWallet = wallet + profit;
	const isWin = profit > 0;

	let description;
	if (isWin) {
		description = `You bet **${amount.toLocaleString()}** coins and won **${winnings.toLocaleString()}** coins!\n\n**Profit:** +${profit.toLocaleString()} coins`;
	} else if (profit === 0) {
		description = `You bet **${amount.toLocaleString()}** coins and got your money back!`;
	} else {
		description = `You bet **${amount.toLocaleString()}** coins and lost it all!`;
	}

	msg.send({
		embeds: [{
			color: isWin ? Colors.SUCCESS : Colors.ERR,
			title: `${outcome.emoji} ${outcome.message}`,
			description,
			fields: [
				{
					name: "💵 New Balance",
					value: `${newWallet.toLocaleString()} coins`,
					inline: true,
				},
				{
					name: "🎯 Multiplier",
					value: `${outcome.multiplier}x`,
					inline: true,
				},
			],
		}],
	});
};
