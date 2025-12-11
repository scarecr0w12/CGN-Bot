const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "⭐", "💎", "7️⃣"];
const WEIGHTS = [25, 20, 18, 15, 10, 7, 4, 1]; // Lower = rarer

const PAYOUTS = {
	"7️⃣7️⃣7️⃣": { multiplier: 100, name: "MEGA JACKPOT" },
	"💎💎💎": { multiplier: 50, name: "Diamond Rush" },
	"⭐⭐⭐": { multiplier: 25, name: "Star Power" },
	"🔔🔔🔔": { multiplier: 15, name: "Bell Ringer" },
	"🍇🍇🍇": { multiplier: 10, name: "Grape Crush" },
	"🍊🍊🍊": { multiplier: 8, name: "Orange Blast" },
	"🍋🍋🍋": { multiplier: 5, name: "Lemon Drop" },
	"🍒🍒🍒": { multiplier: 3, name: "Cherry Bomb" },
};

function weightedRandom () {
	const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);
	let random = Math.random() * totalWeight;

	for (let i = 0; i < SYMBOLS.length; i++) {
		random -= WEIGHTS[i];
		if (random <= 0) return SYMBOLS[i];
	}
	return SYMBOLS[0];
}

function spin () {
	return [weightedRandom(), weightedRandom(), weightedRandom()];
}

function checkWin (result) {
	const key = result.join("");
	if (PAYOUTS[key]) return PAYOUTS[key];

	// Check for two matching (partial win)
	if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
		return { multiplier: 1.5, name: "Partial Match" };
	}

	return null;
}

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	const wallet = userDocument.economy?.wallet || 0;

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎰 Slot Machine",
				description: "Spin the slots and try your luck!",
				fields: [
					{
						name: "Payouts",
						value: Object.entries(PAYOUTS).map(([symbols, data]) => `${symbols} → **${data.multiplier}x** (${data.name})`).join("\n"),
						inline: false,
					},
					{
						name: "Partial Match",
						value: "Any 2 matching → **1.5x**",
						inline: false,
					},
				],
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <amount> | 💵 Wallet: ${wallet.toLocaleString()} coins`,
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
				description: "Please enter a valid bet amount! 🎰",
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
				description: "Minimum bet is **10** coins! 🎰",
			}],
		});
	}

	const result = spin();
	const win = checkWin(result);
	const display = `\`[ ${result.join(" | ")} ]\``;

	let profit, winnings;
	if (win) {
		winnings = Math.floor(amount * win.multiplier);
		profit = winnings - amount;
	} else {
		winnings = 0;
		profit = -amount;
	}

	userQueryDocument.inc("economy.wallet", profit);

	if (profit > 0) {
		userQueryDocument.inc("economy.total_earned", profit);
	} else if (profit < 0) {
		userQueryDocument.inc("economy.total_lost", Math.abs(profit));
	}

	const newWallet = wallet + profit;
	const isWin = profit > 0;

	if (win) {
		msg.send({
			embeds: [{
				color: isWin ? Colors.SUCCESS : Colors.RESPONSE,
				title: `🎰 ${win.name}!`,
				description: `${display}\n\nYou bet **${amount.toLocaleString()}** coins and won **${winnings.toLocaleString()}** coins!${profit > 0 ? `\n\n**Profit:** +${profit.toLocaleString()} coins` : ""}`,
				fields: [
					{
						name: "💵 New Balance",
						value: `${newWallet.toLocaleString()} coins`,
						inline: true,
					},
					{
						name: "🎯 Multiplier",
						value: `${win.multiplier}x`,
						inline: true,
					},
				],
			}],
		});
	} else {
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "🎰 No Match!",
				description: `${display}\n\nYou bet **${amount.toLocaleString()}** coins and lost!`,
				fields: [
					{
						name: "💵 New Balance",
						value: `${newWallet.toLocaleString()} coins`,
						inline: true,
					},
				],
				footer: {
					text: "Better luck next time!",
				},
			}],
		});
	}
};
