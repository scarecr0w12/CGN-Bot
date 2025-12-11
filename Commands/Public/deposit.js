module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	const wallet = userDocument.economy?.wallet || 0;
	const bank = userDocument.economy?.bank || 0;
	const bankCapacity = userDocument.economy?.bank_capacity || 5000;
	const availableSpace = bankCapacity - bank;

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🏦 Bank Deposit",
				description: `Your wallet: **${wallet.toLocaleString()}** coins\nBank: **${bank.toLocaleString()}** / **${bankCapacity.toLocaleString()}** coins`,
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <amount|all>`,
				},
			}],
		});
	}

	let amount;
	if (msg.suffix.toLowerCase() === "all" || msg.suffix.toLowerCase() === "max") {
		amount = Math.min(wallet, availableSpace);
	} else {
		amount = parseInt(msg.suffix, 10);
	}

	if (isNaN(amount) || amount <= 0) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Please enter a valid amount to deposit! 💸",
			}],
		});
	}

	if (amount > wallet) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You don't have that much in your wallet!\n\n💵 Wallet: **${wallet.toLocaleString()}** coins`,
			}],
		});
	}

	if (amount > availableSpace) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Your bank doesn't have enough space!\n\n🏦 Available space: **${availableSpace.toLocaleString()}** coins`,
			}],
		});
	}

	userQueryDocument.inc("economy.wallet", -amount);
	userQueryDocument.inc("economy.bank", amount);

	const newBank = bank + amount;
	const newWallet = wallet - amount;

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "🏦 Deposit Successful!",
			description: `You deposited **${amount.toLocaleString()}** coins into your bank.`,
			fields: [
				{
					name: "💵 Wallet",
					value: `${newWallet.toLocaleString()} coins`,
					inline: true,
				},
				{
					name: "🏦 Bank",
					value: `${newBank.toLocaleString()} / ${bankCapacity.toLocaleString()} coins`,
					inline: true,
				},
			],
		}],
	});
};
