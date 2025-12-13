const BADGES = {
	// Special badges (earned through achievements/activities)
	early_adopter: { name: "Early Adopter", description: "Joined during beta", emoji: "🌟", rarity: "legendary" },
	supporter: { name: "Supporter", description: "Premium subscriber", emoji: "💎", rarity: "epic" },
	bug_hunter: { name: "Bug Hunter", description: "Reported a bug", emoji: "🐛", rarity: "rare" },
	// Purchasable badges (from shop - collectibles count as badges too)
	collectors_badge: { name: "Collector's Badge", description: "A rare collectible badge", emoji: "🏅", rarity: "rare" },
	diamond_trophy: { name: "Diamond Trophy", description: "The ultimate symbol of wealth", emoji: "🏆", rarity: "legendary" },
	// Achievement-based badges
	streak_master: { name: "Streak Master", description: "Maintained a 30+ day streak", emoji: "🔥", rarity: "epic" },
	millionaire: { name: "Millionaire", description: "Reached 100k net worth", emoji: "💰", rarity: "epic" },
	workaholic: { name: "Workaholic", description: "Worked 100+ times", emoji: "💼", rarity: "rare" },
	gambler: { name: "High Roller", description: "Won a 10x jackpot", emoji: "🎰", rarity: "epic" },
	thief: { name: "Master Thief", description: "Successfully robbed 10 times", emoji: "🦹", rarity: "rare" },
};

const RARITY_COLORS = {
	common: 0x9E9E9E,
	uncommon: 0x4CAF50,
	rare: 0x2196F3,
	epic: 0x9C27B0,
	legendary: 0xFF9800,
};

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, badges: [] });
	}

	const userBadges = userDocument.economy?.badges || [];
	const args = msg.suffix ? msg.suffix.toLowerCase().split(" ") : [];

	if (args[0] === "equip") {
		const badgeId = args.slice(1).join("_");
		if (!badgeId) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Please specify a badge to equip!\n\nUsage: \`${msg.guild.commandPrefix}${commandData.name} equip <badge_id>\``,
				}],
			});
		}

		const userBadge = userBadges.find(b => b._id === badgeId);
		if (!userBadge) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "You don't have this badge!",
				}],
			});
		}

		const badgeData = BADGES[badgeId];
		if (!badgeData) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Badge not found!",
				}],
			});
		}

		// Unequip all other badges first
		for (let i = 0; i < userBadges.length; i++) {
			if (userBadges[i].equipped) {
				userQueryDocument.set(`economy.badges.${i}.equipped`, false);
			}
		}

		// Equip the selected badge
		const badgeIndex = userBadges.findIndex(b => b._id === badgeId);
		userQueryDocument.set(`economy.badges.${badgeIndex}.equipped`, true);

		return msg.send({
			embeds: [{
				color: RARITY_COLORS[badgeData.rarity] || Colors.SUCCESS,
				title: `${badgeData.emoji} Badge Equipped!`,
				description: `You are now displaying the **${badgeData.name}** badge!`,
			}],
		});
	}

	if (args[0] === "unequip") {
		// Unequip all badges
		for (let i = 0; i < userBadges.length; i++) {
			if (userBadges[i].equipped) {
				userQueryDocument.set(`economy.badges.${i}.equipped`, false);
			}
		}

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				description: "All badges unequipped!",
			}],
		});
	}

	if (args[0] === "list" || args[0] === "all") {
		// Show all badges
		const badgeList = Object.entries(BADGES).map(([id, badge]) => {
			const owned = userBadges.find(b => b._id === id);
			let status = "🔒";
			if (owned) {
				status = owned.equipped ? "✨" : "✅";
			}
			const rarityLabel = badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1);
			return `${status} ${badge.emoji} **${badge.name}** [${rarityLabel}]\n   ${badge.description}`;
		});

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎖️ All Badges",
				description: badgeList.join("\n\n"),
				footer: {
					text: `✨ = Equipped | ✅ = Owned | 🔒 = Locked`,
				},
			}],
		});
	}

	// Show user's badges
	if (userBadges.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🎖️ Your Badges",
				description: "You don't have any badges yet!\n\nBadges are earned through achievements, special events, or purchased from the shop.",
				footer: {
					text: `Use ${msg.guild.commandPrefix}${commandData.name} list to see all badges`,
				},
			}],
		});
	}

	const badgeList = userBadges.map(userBadge => {
		const badge = BADGES[userBadge._id];
		if (!badge) return null;
		const equipped = userBadge.equipped ? " ✨ **[EQUIPPED]**" : "";
		return `${badge.emoji} **${badge.name}**${equipped}\n   ${badge.description}`;
	}).filter(Boolean);

	const equippedBadge = userBadges.find(b => b.equipped);
	const equippedBadgeData = equippedBadge && BADGES[equippedBadge._id];
	const equippedInfo = equippedBadgeData ?
		`Currently displaying: ${equippedBadgeData.emoji} ${equippedBadgeData.name}` :
		"No badge equipped";

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🎖️ Your Badges",
			description: badgeList.join("\n\n"),
			footer: {
				text: `${equippedInfo} | Use ${msg.guild.commandPrefix}${commandData.name} equip <badge_id>`,
			},
		}],
	});
};

module.exports.BADGES = BADGES;
