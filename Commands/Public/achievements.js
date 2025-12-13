const ACHIEVEMENTS = {
	// Economy achievements
	first_daily: { name: "First Steps", description: "Claim your first daily reward", emoji: "🌟", reward: 50 },
	streak_7: { name: "Week Warrior", description: "Maintain a 7 day daily streak", emoji: "🔥", reward: 200 },
	streak_30: { name: "Monthly Master", description: "Maintain a 30 day daily streak", emoji: "💫", reward: 1000 },
	streak_100: { name: "Centurion", description: "Maintain a 100 day daily streak", emoji: "👑", reward: 5000 },
	rich_1k: { name: "Getting Started", description: "Have 1,000 coins net worth", emoji: "💰", reward: 100 },
	rich_10k: { name: "Wealthy", description: "Have 10,000 coins net worth", emoji: "💎", reward: 500 },
	rich_100k: { name: "Millionaire", description: "Have 100,000 coins net worth", emoji: "🤑", reward: 2500 },
	first_work: { name: "Employee of the Month", description: "Work for the first time", emoji: "💼", reward: 25 },
	work_100: { name: "Workaholic", description: "Work 100 times", emoji: "🏭", reward: 500 },
	gamble_win: { name: "Lucky", description: "Win your first gamble", emoji: "🍀", reward: 50 },
	gamble_jackpot: { name: "Jackpot!", description: "Hit a 10x jackpot", emoji: "🎰", reward: 1000 },
	rob_success: { name: "Heist Master", description: "Successfully rob someone", emoji: "🦹", reward: 100 },
	rob_fail: { name: "Caught Red-Handed", description: "Fail a robbery attempt", emoji: "🚔", reward: 25 },
	first_purchase: { name: "Shopper", description: "Buy your first item", emoji: "🛒", reward: 50 },
	collector: { name: "Collector", description: "Own 10 different items", emoji: "📦", reward: 300 },
	generous: { name: "Generous Soul", description: "Give 1,000 coins to others", emoji: "🎁", reward: 200 },
	// Social achievements
	first_command: { name: "Hello World", description: "Use your first command", emoji: "👋", reward: 10 },
	commands_100: { name: "Power User", description: "Use 100 commands", emoji: "⚡", reward: 200 },
	commands_1000: { name: "Bot Enthusiast", description: "Use 1,000 commands", emoji: "🤖", reward: 1000 },
};

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, achievements: [] });
	}

	const userAchievements = userDocument.economy?.achievements || [];
	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];

	if (args[0] === "list" || args[0] === "all") {
		// Show all achievements
		const achievementList = Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
			const unlocked = userAchievements.find(a => a._id === id);
			const status = unlocked ? "✅" : "🔒";
			return `${status} ${ach.emoji} **${ach.name}** - ${ach.description}\n   Reward: ${ach.reward} coins`;
		});

		const unlockedCount = userAchievements.length;
		const totalCount = Object.keys(ACHIEVEMENTS).length;

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🏆 All Achievements",
				description: achievementList.join("\n\n"),
				footer: {
					text: `Unlocked: ${unlockedCount}/${totalCount}`,
				},
			}],
		});
	}

	// Show user's unlocked achievements
	if (userAchievements.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🏆 Your Achievements",
				description: "You haven't unlocked any achievements yet!\n\nKeep using the bot to unlock achievements and earn rewards.",
				footer: {
					text: `Use ${msg.guild.commandPrefix}${commandData.name} list to see all achievements`,
				},
			}],
		});
	}

	const achievementList = userAchievements.map(userAch => {
		const ach = ACHIEVEMENTS[userAch._id];
		if (!ach) return null;
		const unlockedDate = new Date(userAch.unlocked_at).toLocaleDateString();
		return `${ach.emoji} **${ach.name}** - ${ach.description}\n   Unlocked: ${unlockedDate}`;
	}).filter(Boolean);

	const unlockedCount = userAchievements.length;
	const totalCount = Object.keys(ACHIEVEMENTS).length;
	const progressPercent = Math.floor((unlockedCount / totalCount) * 100);

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🏆 Your Achievements",
			description: achievementList.join("\n\n"),
			footer: {
				text: `Progress: ${unlockedCount}/${totalCount} (${progressPercent}%) | Use ${msg.guild.commandPrefix}${commandData.name} list to see all`,
			},
		}],
	});
};

module.exports.ACHIEVEMENTS = ACHIEVEMENTS;

module.exports.checkAndUnlock = async function checkAndUnlock (userDocument, userQueryDocument, achievementId) {
	if (!ACHIEVEMENTS[achievementId]) return null;

	const userAchievements = userDocument.economy?.achievements || [];
	if (userAchievements.find(a => a._id === achievementId)) return null;

	// Unlock achievement
	userQueryDocument.push("economy.achievements", {
		_id: achievementId,
		unlocked_at: new Date(),
	});

	// Award coins
	const reward = ACHIEVEMENTS[achievementId].reward;
	userQueryDocument.inc("economy.wallet", reward);
	userQueryDocument.inc("economy.total_earned", reward);

	return {
		achievement: ACHIEVEMENTS[achievementId],
		id: achievementId,
		reward,
	};
};
