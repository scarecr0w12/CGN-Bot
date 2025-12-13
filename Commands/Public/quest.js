const DAILY_QUESTS = [
	{ id: "daily_messages", name: "Chatterbox", description: "Send 10 messages", target: 10, reward: 50, emoji: "💬" },
	{ id: "daily_command", name: "Bot User", description: "Use 5 commands", target: 5, reward: 30, emoji: "🤖" },
	{ id: "daily_gamble", name: "Risk Taker", description: "Gamble 3 times", target: 3, reward: 75, emoji: "🎲" },
	{ id: "daily_work", name: "Hard Worker", description: "Work 2 times", target: 2, reward: 100, emoji: "💼" },
	{ id: "daily_give", name: "Generous Soul", description: "Give coins to someone", target: 1, reward: 50, emoji: "🎁" },
];

const WEEKLY_QUESTS = [
	{ id: "weekly_streak", name: "Dedicated", description: "Maintain a 5 day daily streak", target: 5, reward: 500, emoji: "🔥" },
	{ id: "weekly_earn", name: "Money Maker", description: "Earn 1,000 coins total", target: 1000, reward: 300, emoji: "💰" },
	{ id: "weekly_commands", name: "Power User", description: "Use 50 commands", target: 50, reward: 200, emoji: "⚡" },
	{ id: "weekly_shop", name: "Shopper", description: "Buy 3 items from the shop", target: 3, reward: 250, emoji: "🛒" },
];

function getRandomQuests (pool, count) {
	const shuffled = [...pool].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

function shouldResetDaily (lastReset) {
	if (!lastReset) return true;
	const now = new Date();
	const last = new Date(lastReset);
	return now.toDateString() !== last.toDateString();
}

function shouldResetWeekly (lastReset) {
	if (!lastReset) return true;
	const now = new Date();
	const last = new Date(lastReset);
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	return last < weekAgo;
}

function initializeQuests (userDocument, userQueryDocument) {
	const quests = userDocument.economy?.quests || {};

	// Check if daily quests need reset
	if (shouldResetDaily(quests.daily_reset)) {
		const newDaily = getRandomQuests(DAILY_QUESTS, 3).map(q => ({
			_id: q.id,
			progress: 0,
			completed: false,
			claimed: false,
		}));
		userQueryDocument.set("economy.quests.daily", newDaily);
		userQueryDocument.set("economy.quests.daily_reset", new Date());
	}

	// Check if weekly quests need reset
	if (shouldResetWeekly(quests.weekly_reset)) {
		const newWeekly = getRandomQuests(WEEKLY_QUESTS, 2).map(q => ({
			_id: q.id,
			progress: 0,
			completed: false,
			claimed: false,
		}));
		userQueryDocument.set("economy.quests.weekly", newWeekly);
		userQueryDocument.set("economy.quests.weekly_reset", new Date());
	}
}

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, quests: {} });
	}

	// Initialize/reset quests if needed
	initializeQuests(userDocument, userQueryDocument);

	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];
	const quests = userDocument.economy?.quests || {};

	if (args[0] === "claim") {
		const questId = args.slice(1).join("_");
		if (!questId) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Please specify a quest to claim!\n\nUsage: \`${msg.guild.commandPrefix}${commandData.name} claim <quest_id>\``,
				}],
			});
		}

		// Find quest in daily or weekly
		const dailyQuests = quests.daily || [];
		const weeklyQuests = quests.weekly || [];
		let questData = null;
		let questDef = null;
		let questType = null;
		let questIndex = -1;

		const dailyIndex = dailyQuests.findIndex(q => q._id === questId);
		if (dailyIndex !== -1) {
			questData = dailyQuests[dailyIndex];
			questDef = DAILY_QUESTS.find(q => q.id === questId);
			questType = "daily";
			questIndex = dailyIndex;
		}

		if (!questData) {
			const weeklyIndex = weeklyQuests.findIndex(q => q._id === questId);
			if (weeklyIndex !== -1) {
				questData = weeklyQuests[weeklyIndex];
				questDef = WEEKLY_QUESTS.find(q => q.id === questId);
				questType = "weekly";
				questIndex = weeklyIndex;
			}
		}

		if (!questData || !questDef) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Quest not found!",
				}],
			});
		}

		if (!questData.completed) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `This quest isn't completed yet!\n\nProgress: **${questData.progress}/${questDef.target}**`,
				}],
			});
		}

		if (questData.claimed) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "You've already claimed this quest reward!",
				}],
			});
		}

		// Claim reward
		userQueryDocument.set(`economy.quests.${questType}.${questIndex}.claimed`, true);
		userQueryDocument.inc("economy.wallet", questDef.reward);
		userQueryDocument.inc("economy.total_earned", questDef.reward);

		const newWallet = (userDocument.economy?.wallet || 0) + questDef.reward;

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: `${questDef.emoji} Quest Reward Claimed!`,
				description: `You completed **${questDef.name}** and earned **${questDef.reward.toLocaleString()}** coins!`,
				fields: [
					{
						name: "💵 New Balance",
						value: `${newWallet.toLocaleString()} coins`,
						inline: true,
					},
				],
			}],
		});
	}

	// Show quest list
	const dailyQuests = quests.daily || [];
	const weeklyQuests = quests.weekly || [];

	const formatQuest = (questData, questDef, type) => {
		if (!questDef) return null;
		const status = questData.claimed ? "✅ Claimed" :
			questData.completed ? "🎁 Ready to claim!" :
				`${questData.progress}/${questDef.target}`;
		return `${questDef.emoji} **${questDef.name}** - ${questDef.description}\n\`${questDef.id}\` | Progress: ${status} | Reward: ${questDef.reward} coins`;
	};

	const dailyLines = dailyQuests
		.map(q => formatQuest(q, DAILY_QUESTS.find(d => d.id === q._id), "daily"))
		.filter(Boolean);

	const weeklyLines = weeklyQuests
		.map(q => formatQuest(q, WEEKLY_QUESTS.find(w => w.id === q._id), "weekly"))
		.filter(Boolean);

	const fields = [];
	if (dailyLines.length > 0) {
		fields.push({
			name: "📅 Daily Quests",
			value: dailyLines.join("\n\n"),
			inline: false,
		});
	}
	if (weeklyLines.length > 0) {
		fields.push({
			name: "📆 Weekly Quests",
			value: weeklyLines.join("\n\n"),
			inline: false,
		});
	}

	if (fields.length === 0) {
		fields.push({
			name: "No Quests",
			value: "Quests will be assigned automatically!",
			inline: false,
		});
	}

	msg.send({
		embeds: [{
			color: Colors.INFO,
			title: "📜 Your Quests",
			fields,
			footer: {
				text: `Use ${msg.guild.commandPrefix}${commandData.name} claim <quest_id> to claim rewards`,
			},
		}],
	});
};

module.exports.DAILY_QUESTS = DAILY_QUESTS;
module.exports.WEEKLY_QUESTS = WEEKLY_QUESTS;
