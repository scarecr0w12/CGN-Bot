const ROB_COOLDOWN = 60 * 60 * 1000; // 1 hour
const SUCCESS_CHANCE = 0.35;
const MIN_WALLET_TO_ROB = 100;
const FINE_MULTIPLIER = 0.25;

module.exports = async ({ Constants: { Colors }, client }, { serverDocument, userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🔫 Rob",
				description: "Attempt to steal coins from another user's wallet!\n\n⚠️ **Warning:** If you fail, you'll pay a fine!",
				fields: [
					{
						name: "Success Rate",
						value: `${(SUCCESS_CHANCE * 100).toFixed(0)}%`,
						inline: true,
					},
					{
						name: "Cooldown",
						value: "1 hour",
						inline: true,
					},
					{
						name: "Fine on Failure",
						value: `${(FINE_MULTIPLIER * 100).toFixed(0)}% of their wallet`,
						inline: true,
					},
				],
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} <user>`,
				},
			}],
		});
	}

	// Check cooldown
	const lastAttempt = userDocument.economy?.rob_last_attempt;
	if (lastAttempt) {
		const timeSince = Date.now() - new Date(lastAttempt).getTime();
		if (timeSince < ROB_COOLDOWN) {
			const remaining = ROB_COOLDOWN - timeSince;
			const minutes = Math.floor(remaining / (60 * 1000));
			const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "⏰ Cooldown Active",
					description: `You need to lay low for a while!\n\nTry again in **${minutes}m ${seconds}s**`,
				}],
			});
		}
	}

	const member = await client.memberSearch(msg.suffix, msg.guild).catch(() => null);

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
				description: "You can't rob bots! They have no money! 🤖",
			}],
		});
	}

	if (member.id === msg.author.id) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "You can't rob yourself! 🤔",
			}],
		});
	}

	// Get target user document
	let targetUserDocument = await Users.findOne(member.id);
	if (!targetUserDocument) {
		targetUserDocument = Users.new({ _id: member.id });
	}
	const targetUserQueryDocument = targetUserDocument.query;

	const targetWallet = targetUserDocument.economy?.wallet || 0;

	if (targetWallet < MIN_WALLET_TO_ROB) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `**@${client.getName(serverDocument, member)}** doesn't have enough coins in their wallet to rob!\n\nThey need at least **${MIN_WALLET_TO_ROB}** coins.`,
			}],
		});
	}

	const userWallet = userDocument.economy?.wallet || 0;

	// Set cooldown
	userQueryDocument.set("economy.rob_last_attempt", new Date());

	// Attempt the robbery
	const success = Math.random() < SUCCESS_CHANCE;

	if (success) {
		// Steal 10-50% of their wallet
		const stealPercent = 0.1 + Math.random() * 0.4;
		const stolen = Math.floor(targetWallet * stealPercent);

		userQueryDocument.inc("economy.wallet", stolen);
		userQueryDocument.inc("economy.total_earned", stolen);
		targetUserQueryDocument.inc("economy.wallet", -stolen);
		targetUserQueryDocument.inc("economy.total_lost", stolen);

		await targetUserDocument.save();

		msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🔫 Robbery Successful!",
				description: `You snuck up on **@${client.getName(serverDocument, member)}** and stole **${stolen.toLocaleString()}** coins!`,
				fields: [
					{
						name: "💵 Your Wallet",
						value: `${(userWallet + stolen).toLocaleString()} coins`,
						inline: true,
					},
				],
				footer: {
					text: "Don't get caught next time!",
				},
			}],
		});
	} else {
		// Failed - pay a fine
		const fine = Math.floor(targetWallet * FINE_MULTIPLIER);
		const actualFine = Math.min(fine, userWallet);

		if (actualFine > 0) {
			userQueryDocument.inc("economy.wallet", -actualFine);
			userQueryDocument.inc("economy.total_lost", actualFine);
		}

		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "🚔 Robbery Failed!",
				description: `You got caught trying to rob **@${client.getName(serverDocument, member)}**!${actualFine > 0 ? `\n\nYou paid a fine of **${actualFine.toLocaleString()}** coins.` : "\n\nLuckily, you had no money to pay as a fine!"}`,
				fields: [
					{
						name: "💵 Your Wallet",
						value: `${(userWallet - actualFine).toLocaleString()} coins`,
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
