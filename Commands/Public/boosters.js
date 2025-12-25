const moment = require("moment");
const PaginatedEmbed = require("../../Modules/MessageUtils/PaginatedEmbed");

const BOOST_TIER_NAMES = {
	0: "No Level",
	1: "Level 1",
	2: "Level 2",
	3: "Level 3",
};

const BOOST_TIER_EMOJIS = {
	0: "⚫",
	1: "🟣",
	2: "💜",
	3: "💎",
};

const BOOST_PERKS = {
	1: ["50 extra emoji slots", "128kbps audio", "Animated server icon", "Custom invite background"],
	2: ["50 more emoji slots (100 total)", "256kbps audio", "Server banner", "50MB upload limit"],
	3: ["100 more emoji slots (250 total)", "384kbps audio", "Vanity URL", "100MB upload limit"],
};

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	const guild = msg.guild;
	const boostCount = guild.premiumSubscriptionCount || 0;
	const boostTier = guild.premiumTier || 0;

	const boosters = guild.members.cache
		.filter(m => m.premiumSince)
		.sort((a, b) => a.premiumSince - b.premiumSince);

	const boosterList = boosters.map((member, index) => {
		const boostingSince = moment(member.premiumSince).fromNow();
		return `${index + 1}. **${member.user.tag}** - boosting ${boostingSince}`;
	});

	const tierEmoji = BOOST_TIER_EMOJIS[boostTier];
	const tierName = BOOST_TIER_NAMES[boostTier];

	const nextTierBoosts = {
		0: 2,
		1: 7,
		2: 14,
		3: null,
	};

	const boostsNeeded = nextTierBoosts[boostTier];
	const progressText = boostsNeeded ?
		`${boostCount}/${boostsNeeded} boosts to next level` :
		"Maximum level reached! 🎉";

	const currentPerks = [];
	for (let i = 1; i <= boostTier; i++) {
		currentPerks.push(...BOOST_PERKS[i]);
	}

	if (boosterList.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: `${tierEmoji} Server Boost Status`,
				description: "This server has no boosters yet!\n\nBoost the server to unlock awesome perks like more emoji slots, better audio quality, and more!",
				fields: [
					{
						name: "📊 Current Level",
						value: tierName,
						inline: true,
					},
					{
						name: "🚀 Total Boosts",
						value: boostCount.toString(),
						inline: true,
					},
					{
						name: "📈 Progress",
						value: progressText,
						inline: true,
					},
				],
				footer: {
					text: "Be the first to boost this server!",
				},
			}],
		});
	}

	const itemsPerPage = 10;
	const pages = [];

	for (let i = 0; i < boosterList.length; i += itemsPerPage) {
		pages.push(boosterList.slice(i, i + itemsPerPage).join("\n"));
	}

	if (pages.length === 1) {
		return msg.send({
			embeds: [{
				color: 0xF47FFF,
				title: `${tierEmoji} Server Boost Status`,
				fields: [
					{
						name: "📊 Current Level",
						value: tierName,
						inline: true,
					},
					{
						name: "🚀 Total Boosts",
						value: boostCount.toString(),
						inline: true,
					},
					{
						name: "📈 Progress",
						value: progressText,
						inline: true,
					},
					{
						name: `💎 Boosters (${boosters.size})`,
						value: pages[0],
						inline: false,
					},
					...currentPerks.length > 0 ? [{
						name: "✨ Current Perks",
						value: currentPerks.map(p => `• ${p}`).join("\n"),
						inline: false,
					}] : [],
				],
				thumbnail: {
					url: guild.iconURL({ size: 256 }) || null,
				},
				footer: {
					text: "Thank you to all our boosters! 💜",
				},
			}],
		});
	}

	await new PaginatedEmbed(msg, {
		color: 0xF47FFF,
		title: `${tierEmoji} Server Boost Status`,
		description: `**Level:** ${tierName} | **Boosts:** ${boostCount} | **Progress:** ${progressText}\n\n**💎 Boosters (${boosters.size}):**\n{description}`,
		footer: "Page {currentPage} of {totalPages} • Thank you to all our boosters! 💜",
	}, {
		descriptions: pages,
	}).init();
};
