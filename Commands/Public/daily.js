const DAILY_AMOUNT = 100;
const STREAK_BONUS = 25;
const MAX_STREAK_BONUS = 500;

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, daily_streak: 0 });
	}

	const now = new Date();
	const lastClaimed = userDocument.economy?.daily_last_claimed;

	if (lastClaimed) {
		const lastClaimDate = new Date(lastClaimed);
		const hoursSinceLastClaim = (now - lastClaimDate) / (1000 * 60 * 60);

		if (hoursSinceLastClaim < 24) {
			const nextClaim = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000);
			const hoursRemaining = Math.floor((nextClaim - now) / (1000 * 60 * 60));
			const minutesRemaining = Math.floor(((nextClaim - now) % (1000 * 60 * 60)) / (1000 * 60));

			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "⏰ Already Claimed!",
					description: `You've already claimed your daily reward today!\n\nCome back in **${hoursRemaining}h ${minutesRemaining}m**`,
					footer: {
						text: `Current streak: ${userDocument.economy?.daily_streak || 0} days`,
					},
				}],
			});
		}

		// Check if streak should be reset (more than 48 hours)
		if (hoursSinceLastClaim > 48) {
			userQueryDocument.set("economy.daily_streak", 0);
		}
	}

	const currentStreak = (userDocument.economy?.daily_streak || 0) + 1;
	const streakBonus = Math.min(currentStreak * STREAK_BONUS, MAX_STREAK_BONUS);
	const totalReward = DAILY_AMOUNT + streakBonus;

	userQueryDocument.set("economy.daily_last_claimed", now);
	userQueryDocument.set("economy.daily_streak", currentStreak);
	userQueryDocument.inc("economy.wallet", totalReward);
	userQueryDocument.inc("economy.total_earned", totalReward);

	const fields = [
		{
			name: "💵 Base Reward",
			value: `+${DAILY_AMOUNT} coins`,
			inline: true,
		},
	];

	if (streakBonus > 0) {
		fields.push({
			name: "🔥 Streak Bonus",
			value: `+${streakBonus} coins`,
			inline: true,
		});
	}

	fields.push({
		name: "💰 Total",
		value: `+${totalReward} coins`,
		inline: true,
	});

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "📅 Daily Reward Claimed!",
			fields,
			footer: {
				text: `🔥 ${currentStreak} day streak! Come back tomorrow to keep it going!`,
			},
		}],
	});
};
