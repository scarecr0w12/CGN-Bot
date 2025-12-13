module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, streaks: {} });
	}

	const streaks = userDocument.economy?.streaks || {};
	const dailyStreak = userDocument.economy?.daily_streak || 0;

	const fields = [
		{
			name: "🔥 Daily Claim Streak",
			value: `**${dailyStreak}** days\n${getStreakBar(dailyStreak, 30)}`,
			inline: true,
		},
	];

	if (streaks.login) {
		fields.push({
			name: "📅 Login Streak",
			value: `**${streaks.login}** days`,
			inline: true,
		});
	}

	if (streaks.commands) {
		fields.push({
			name: "⚡ Command Streak",
			value: `**${streaks.commands}** days`,
			inline: true,
		});
	}

	if (streaks.messages) {
		fields.push({
			name: "💬 Message Streak",
			value: `**${streaks.messages}** days`,
			inline: true,
		});
	}

	// Calculate streak bonuses
	const streakBonuses = [];
	if (dailyStreak >= 7) streakBonuses.push("🎁 **7-day bonus**: +25 daily coins");
	if (dailyStreak >= 14) streakBonuses.push("🎁 **14-day bonus**: +50 daily coins");
	if (dailyStreak >= 30) streakBonuses.push("🎁 **30-day bonus**: +100 daily coins");

	if (streakBonuses.length > 0) {
		fields.push({
			name: "🎉 Active Bonuses",
			value: streakBonuses.join("\n"),
			inline: false,
		});
	}

	// Next milestone
	const nextMilestone = getNextMilestone(dailyStreak);
	const description = nextMilestone ?
		`Keep your streak going! **${nextMilestone.days - dailyStreak}** more days until the next milestone.` :
		`You've reached all milestones! Amazing dedication! 🏆`;

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "📊 Your Streaks",
			description,
			fields,
			footer: {
				text: "Streaks reset if you miss a day!",
			},
		}],
	});
};

function getStreakBar (current, max) {
	const filled = Math.min(Math.floor((current / max) * 10), 10);
	const empty = 10 - filled;
	return `${"▓".repeat(filled)}${"░".repeat(empty)} (${Math.min(current, max)}/${max})`;
}

function getNextMilestone (current) {
	const milestones = [
		{ days: 7, reward: "Week Warrior achievement" },
		{ days: 14, reward: "Two Week Champion" },
		{ days: 30, reward: "Monthly Master achievement" },
		{ days: 60, reward: "Double Month" },
		{ days: 100, reward: "Centurion achievement" },
		{ days: 365, reward: "Year Long dedication" },
	];

	return milestones.find(m => m.days > current);
}
