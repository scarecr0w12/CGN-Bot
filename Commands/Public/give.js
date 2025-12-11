module.exports = async ({ Constants: { Colors }, client }, { serverDocument, userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	const args = msg.suffix ? msg.suffix.split("|").map(a => a.trim()) : [];
	if (args.length < 2) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "💸 Give Coins",
				description: "Transfer coins from your wallet to another user.",
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <user> | <amount>`,
				},
			}],
		});
	}

	const [userArg, amountArg] = args;
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
				description: "You can't give coins to bots! 🤖",
			}],
		});
	}

	if (member.id === msg.author.id) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "You can't give coins to yourself! 🤔",
			}],
		});
	}

	let amount;
	if (amountArg.toLowerCase() === "all" || amountArg.toLowerCase() === "max") {
		amount = userDocument.economy?.wallet || 0;
	} else {
		amount = parseInt(amountArg, 10);
	}

	if (isNaN(amount) || amount <= 0) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "Please enter a valid amount! 💸",
			}],
		});
	}

	const wallet = userDocument.economy?.wallet || 0;
	if (amount > wallet) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `You don't have enough coins in your wallet!\n\n💵 Wallet: **${wallet.toLocaleString()}** coins`,
			}],
		});
	}

	// Get or create target user document
	let targetUserDocument = await Users.findOne(member.id);
	if (!targetUserDocument) {
		targetUserDocument = Users.new({ _id: member.id });
	}
	const targetUserQueryDocument = targetUserDocument.query;

	if (!targetUserDocument.economy) {
		targetUserQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	// Transfer coins
	userQueryDocument.inc("economy.wallet", -amount);
	targetUserQueryDocument.inc("economy.wallet", amount);

	await targetUserDocument.save();

	const newWallet = wallet - amount;
	const targetNewWallet = (targetUserDocument.economy?.wallet || 0) + amount;

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "💸 Transfer Successful!",
			description: `You gave **${amount.toLocaleString()}** coins to **@${client.getName(serverDocument, member)}**!`,
			fields: [
				{
					name: "Your Wallet",
					value: `${newWallet.toLocaleString()} coins`,
					inline: true,
				},
				{
					name: `${member.user.username}'s Wallet`,
					value: `${targetNewWallet.toLocaleString()} coins`,
					inline: true,
				},
			],
		}],
	});
};
