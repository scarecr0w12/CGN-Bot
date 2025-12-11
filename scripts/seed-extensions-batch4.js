/**
 * Seed script for Batch 4 extensions
 * Run with: node scripts/seed-extensions-batch4.js
 */

const path = require("path");
const fs = require("fs-nextra");

const extensions = [
	{
		name: "Gacha",
		description: "Pull for rare characters and items! Build your collection.",
		type: "command",
		key: "gacha",
		usage_help: "[pull|collection|daily]",
		extended_help: "Gacha game! Pull for characters with different rarities. Collect them all!",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const economy = require('economy');
const utils = require('utils');
const embed = require('embed');

const characters = [
	{ name: 'Common Knight', rarity: '⭐', rate: 50, emoji: '🛡️' },
	{ name: 'Forest Archer', rarity: '⭐', rate: 50, emoji: '🏹' },
	{ name: 'Fire Mage', rarity: '⭐⭐', rate: 25, emoji: '🔥' },
	{ name: 'Ice Wizard', rarity: '⭐⭐', rate: 25, emoji: '❄️' },
	{ name: 'Shadow Ninja', rarity: '⭐⭐⭐', rate: 15, emoji: '🥷' },
	{ name: 'Holy Paladin', rarity: '⭐⭐⭐', rate: 15, emoji: '⚔️' },
	{ name: 'Dragon Rider', rarity: '⭐⭐⭐⭐', rate: 8, emoji: '🐉' },
	{ name: 'Phoenix Queen', rarity: '⭐⭐⭐⭐', rate: 8, emoji: '🔶' },
	{ name: 'Cosmic Emperor', rarity: '⭐⭐⭐⭐⭐', rate: 3, emoji: '👑' },
	{ name: 'Void Goddess', rarity: '⭐⭐⭐⭐⭐', rate: 1, emoji: '🌌' },
];

const collectionKey = 'gacha_' + message.author.id;
let collection = extension.storage.get(collectionKey) || { chars: [], pity: 0, lastDaily: 0 };
const action = command.arguments[0]?.toLowerCase();

const PULL_COST = 100;

if (action === 'daily') {
	const now = Date.now();
	const day = 24 * 60 * 60 * 1000;
	if (now - collection.lastDaily < day) {
		const remaining = day - (now - collection.lastDaily);
		const hours = Math.floor(remaining / (60 * 60 * 1000));
		message.reply('⏰ Daily pull available in **' + hours + '** hours!');
		return;
	}
	
	collection.lastDaily = now;
	const weights = characters.map(c => ({ item: c, weight: c.rate }));
	const pulled = utils.random.weighted(weights);
	
	if (!collection.chars.includes(pulled.name)) {
		collection.chars.push(pulled.name);
	}
	extension.storage.write(collectionKey, collection);
	
	message.reply({
		embeds: [embed.create({
			title: '🎁 Daily Pull!',
			description: pulled.emoji + ' **' + pulled.name + '**\\n' + pulled.rarity,
			color: pulled.rarity.length >= 4 ? embed.colors.GOLD : embed.colors.BLUE,
		})]
	});
	return;
}

if (action === 'collection' || action === 'col') {
	if (collection.chars.length === 0) {
		message.reply('📦 Your collection is empty! Use \`gacha pull\` or \`gacha daily\`');
		return;
	}
	
	const list = collection.chars.slice(0, 15).map(name => {
		const char = characters.find(c => c.name === name);
		return char ? char.emoji + ' ' + name + ' ' + char.rarity : name;
	}).join('\\n');
	
	message.reply({
		embeds: [embed.create({
			title: '📦 Your Collection',
			description: list,
			color: embed.colors.PURPLE,
			footer: { text: collection.chars.length + '/' + characters.length + ' collected' },
		})]
	});
	return;
}

if (action === 'pull') {
	const userData = economy.getSelf();
	if (userData.rankScore < PULL_COST) {
		message.reply('❌ Not enough points! Need ' + PULL_COST + ', have ' + userData.rankScore);
		return;
	}
	
	economy.removePoints(message.author.id, PULL_COST, 'Gacha pull');
	collection.pity++;
	
	// Pity system: guaranteed 4+ star at 50 pulls
	let pulled;
	if (collection.pity >= 50) {
		const rares = characters.filter(c => c.rarity.length >= 4);
		pulled = utils.random.pick(rares);
		collection.pity = 0;
	} else {
		const weights = characters.map(c => ({ item: c, weight: c.rate }));
		pulled = utils.random.weighted(weights);
		if (pulled.rarity.length >= 4) collection.pity = 0;
	}
	
	const isNew = !collection.chars.includes(pulled.name);
	if (isNew) collection.chars.push(pulled.name);
	extension.storage.write(collectionKey, collection);
	
	message.reply({
		embeds: [embed.create({
			title: '✨ Gacha Pull!',
			description: pulled.emoji + ' **' + pulled.name + '**\\n' + pulled.rarity + (isNew ? '\\n\\n🆕 **NEW!**' : ''),
			color: pulled.rarity.length >= 4 ? embed.colors.GOLD : embed.colors.BLUE,
			footer: { text: 'Pity: ' + collection.pity + '/50 | Collection: ' + collection.chars.length + '/' + characters.length },
		})]
	});
	return;
}

message.reply({
	embeds: [embed.create({
		title: '✨ Gacha System',
		description: '**Commands:**\\n' +
			'\`gacha pull\` - Pull for ' + PULL_COST + ' points\\n' +
			'\`gacha daily\` - Free daily pull\\n' +
			'\`gacha collection\` - View your collection\\n\\n' +
			'**Rarities:** ⭐ Common → ⭐⭐⭐⭐⭐ Legendary',
		color: embed.colors.PURPLE,
	})]
});
`,
	},
	{
		name: "Escape Room",
		description: "Solve puzzles to escape!",
		type: "command",
		key: "escape",
		usage_help: "[look|use <item>|take <item>]",
		extended_help: "Text-based escape room! Examine your surroundings and solve puzzles.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const rooms = [
	{
		name: 'The Locked Office',
		description: 'You wake up in a dusty office. The door is locked.',
		items: ['desk', 'painting', 'bookshelf', 'safe'],
		hints: {
			desk: 'A wooden desk with a drawer. Inside is a torn note: "The code is the year the company was founded."',
			painting: 'A painting of mountains. The frame says "Est. 1987".',
			bookshelf: 'Old books. One titled "Company History" has a key taped inside!',
			safe: 'A small safe requiring a 4-digit code.',
		},
		solution: { item: 'safe', code: '1987' },
		keyItem: 'bookshelf',
	},
];

const stateKey = 'escape_' + message.author.id;
let game = extension.storage.get(stateKey);
const args = command.suffix.trim().toLowerCase().split(/\\s+/);
const action = args[0];

if (!game || action === 'new') {
	const room = utils.random.pick(rooms);
	game = { room, inventory: [], examined: [], solved: false };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🚪 ' + room.name,
			description: room.description + '\\n\\n**You can see:** ' + room.items.join(', ') + '\\n\\n*Commands: look <item>, take <item>, use <item> <code>*',
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (action === 'look') {
	const item = args[1];
	if (!item) {
		message.reply('👀 **Room:** ' + game.room.description + '\\n**Items:** ' + game.room.items.join(', '));
		return;
	}
	
	if (!game.room.items.includes(item)) {
		message.reply('❓ You don\\'t see a ' + item + ' here.');
		return;
	}
	
	const hint = game.room.hints[item];
	if (!game.examined.includes(item)) game.examined.push(item);
	extension.storage.write(stateKey, game);
	
	message.reply('🔍 **' + utils.text.capitalize(item) + ':** ' + hint);
	return;
}

if (action === 'take') {
	const item = args[1];
	if (item === game.room.keyItem && !game.inventory.includes('key')) {
		game.inventory.push('key');
		extension.storage.write(stateKey, game);
		message.reply('✅ You found a **key** in the ' + item + '!');
	} else {
		message.reply('❌ Nothing useful to take there.');
	}
	return;
}

if (action === 'use') {
	const item = args[1];
	const code = args[2];
	
	if (item === game.room.solution.item) {
		if (code === game.room.solution.code) {
			game.solved = true;
			extension.storage.write(stateKey, null);
			
			message.reply({
				embeds: [embed.create({
					title: '🎉 ESCAPED!',
					description: 'The ' + item + ' opens with code ' + code + '!\\nYou find a key and unlock the door!\\n\\n**You escaped!**',
					color: embed.colors.SUCCESS,
				})]
			});
		} else {
			message.reply('❌ Wrong code! The ' + item + ' doesn\\'t open.');
		}
		return;
	}
	
	message.reply('❓ You can\\'t use that.');
}

if (!action) {
	message.reply({
		embeds: [embed.create({
			title: '🚪 ' + game.room.name,
			description: '**Inventory:** ' + (game.inventory.length ? game.inventory.join(', ') : 'Empty') + '\\n**Examined:** ' + game.examined.join(', '),
			color: embed.colors.BLUE,
			footer: { text: 'Commands: look, look <item>, take <item>, use <item> <code>' },
		})]
	});
}
`,
	},
	{
		name: "Poker",
		description: "Play Texas Hold'em Poker!",
		type: "command",
		key: "poker",
		usage_help: "[bet <amount>|fold|call]",
		extended_help: "Simplified Texas Hold'em against the bot. Best hand wins!",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const economy = require('economy');
const utils = require('utils');
const embed = require('embed');

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
	const deck = [];
	for (const suit of suits) {
		for (const rank of ranks) {
			deck.push({ rank, suit, value: ranks.indexOf(rank) });
		}
	}
	return utils.random.shuffle(deck);
}

function cardStr(card) {
	const red = ['♥', '♦'].includes(card.suit);
	return card.rank + card.suit;
}

function handStr(cards) {
	return cards.map(cardStr).join(' ');
}

function scoreHand(cards) {
	const values = cards.map(c => c.value).sort((a, b) => b - a);
	const suitCounts = {};
	const rankCounts = {};
	
	cards.forEach(c => {
		suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
		rankCounts[c.value] = (rankCounts[c.value] || 0) + 1;
	});
	
	const isFlush = Object.values(suitCounts).some(v => v >= 5);
	const counts = Object.values(rankCounts).sort((a, b) => b - a);
	
	if (counts[0] === 4) return { score: 7, name: 'Four of a Kind' };
	if (counts[0] === 3 && counts[1] === 2) return { score: 6, name: 'Full House' };
	if (isFlush) return { score: 5, name: 'Flush' };
	if (counts[0] === 3) return { score: 3, name: 'Three of a Kind' };
	if (counts[0] === 2 && counts[1] === 2) return { score: 2, name: 'Two Pair' };
	if (counts[0] === 2) return { score: 1, name: 'Pair' };
	return { score: 0, name: 'High Card' };
}

const stateKey = 'poker_' + message.author.id;
let game = extension.storage.get(stateKey);
const args = command.suffix.trim().toLowerCase().split(/\\s+/);
const action = args[0];

if (action === 'bet' || !game) {
	const bet = parseInt(args[1]) || 50;
	const userData = economy.getSelf();
	
	if (userData.rankScore < bet) {
		message.reply('❌ Not enough points! You have ' + userData.rankScore);
		return;
	}
	
	const deck = createDeck();
	const playerHand = [deck.pop(), deck.pop()];
	const botHand = [deck.pop(), deck.pop()];
	const community = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
	
	game = { playerHand, botHand, community, bet, deck };
	extension.storage.write(stateKey, game);
	
	economy.removePoints(message.author.id, bet, 'Poker bet');
	
	message.reply({
		embeds: [embed.create({
			title: '🃏 Texas Hold\\'em',
			description: '**Your Hand:** ' + handStr(playerHand) + '\\n' +
				'**Community:** ' + handStr(community.slice(0, 3)) + ' 🂠 🂠\\n\\n' +
				'**Pot:** ' + (bet * 2) + ' points\\n\\n' +
				'\`poker call\` to see the showdown\\n\`poker fold\` to forfeit',
			color: embed.colors.GREEN,
		})]
	});
	return;
}

if (action === 'fold') {
	extension.storage.write(stateKey, null);
	message.reply('📤 You folded. Better luck next time!');
	return;
}

if (action === 'call') {
	const allCards = [...game.community];
	const playerScore = scoreHand([...game.playerHand, ...allCards]);
	const botScore = scoreHand([...game.botHand, ...allCards]);
	
	extension.storage.write(stateKey, null);
	
	const won = playerScore.score > botScore.score || 
		(playerScore.score === botScore.score && game.playerHand[0].value > game.botHand[0].value);
	
	if (won) {
		const winnings = game.bet * 2;
		economy.addPoints(message.author.id, winnings, 'Poker win');
		
		message.reply({
			embeds: [embed.create({
				title: '🎉 You Win!',
				description: '**Your Hand:** ' + handStr(game.playerHand) + ' - **' + playerScore.name + '**\\n' +
					'**Bot Hand:** ' + handStr(game.botHand) + ' - **' + botScore.name + '**\\n' +
					'**Community:** ' + handStr(game.community) + '\\n\\n' +
					'💰 Won: ' + winnings + ' points!',
				color: embed.colors.SUCCESS,
			})]
		});
	} else {
		message.reply({
			embeds: [embed.create({
				title: '😢 Bot Wins',
				description: '**Your Hand:** ' + handStr(game.playerHand) + ' - **' + playerScore.name + '**\\n' +
					'**Bot Hand:** ' + handStr(game.botHand) + ' - **' + botScore.name + '**\\n' +
					'**Community:** ' + handStr(game.community) + '\\n\\n' +
					'Lost: ' + game.bet + ' points',
				color: embed.colors.ERROR,
			})]
		});
	}
}
`,
	},
	{
		name: "Boss Raid",
		description: "Team up to defeat a powerful boss!",
		type: "command",
		key: "raid",
		usage_help: "[join|attack|status]",
		extended_help: "Server-wide boss battle! Everyone attacks together.",
		scopes: ["messages_write", "channels_read", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const economy = require('economy');
const utils = require('utils');
const embed = require('embed');

const bosses = [
	{ name: 'Ancient Dragon', hp: 5000, emoji: '🐉', reward: 500 },
	{ name: 'Shadow Lord', hp: 3000, emoji: '👹', reward: 300 },
	{ name: 'Crystal Golem', hp: 4000, emoji: '💎', reward: 400 },
	{ name: 'Demon King', hp: 6000, emoji: '😈', reward: 600 },
];

const raidKey = 'raid_' + message.channel.id;
let raid = extension.storage.get(raidKey);
const action = command.arguments[0]?.toLowerCase();

if (action === 'start' || (!raid && !action)) {
	if (raid && raid.hp > 0) {
		message.reply('⚔️ A raid is already active! Use \`raid join\` to participate.');
		return;
	}
	
	const boss = utils.random.pick(bosses);
	raid = {
		boss: boss.name,
		emoji: boss.emoji,
		maxHp: boss.hp,
		hp: boss.hp,
		reward: boss.reward,
		participants: {},
		startTime: Date.now(),
	};
	extension.storage.write(raidKey, raid);
	
	message.reply({
		embeds: [embed.create({
			title: raid.emoji + ' RAID BOSS: ' + boss.name,
			description: '**HP:** ' + utils.format.number(boss.hp) + '\\n' +
				'**Reward Pool:** ' + boss.reward + ' points\\n\\n' +
				'Type \`raid join\` to join!\\nType \`raid attack\` to attack!',
			color: embed.colors.ERROR,
		})]
	});
	return;
}

if (!raid || raid.hp <= 0) {
	message.reply('🏰 No active raid. Use \`raid start\` to summon a boss!');
	return;
}

if (action === 'join') {
	if (raid.participants[message.author.id]) {
		message.reply('✅ You\\'re already in this raid!');
		return;
	}
	
	raid.participants[message.author.id] = { damage: 0, attacks: 0 };
	extension.storage.write(raidKey, raid);
	
	message.reply('⚔️ ' + message.author.username + ' joined the raid! (' + Object.keys(raid.participants).length + ' raiders)');
	return;
}

if (action === 'attack') {
	if (!raid.participants[message.author.id]) {
		raid.participants[message.author.id] = { damage: 0, attacks: 0 };
	}
	
	const participant = raid.participants[message.author.id];
	const damage = utils.random.int(50, 150);
	
	participant.damage += damage;
	participant.attacks++;
	raid.hp -= damage;
	
	if (raid.hp <= 0) {
		raid.hp = 0;
		const totalDamage = Object.values(raid.participants).reduce((sum, p) => sum + p.damage, 0);
		
		let rewards = '';
		for (const [id, p] of Object.entries(raid.participants)) {
			const share = Math.floor((p.damage / totalDamage) * raid.reward);
			if (share > 0) {
				economy.addPoints(id, share, 'Raid reward');
				rewards += utils.discord.userMention(id) + ': ' + share + ' pts\\n';
			}
		}
		
		extension.storage.write(raidKey, null);
		
		message.reply({
			embeds: [embed.create({
				title: '🎉 BOSS DEFEATED!',
				description: raid.emoji + ' ' + raid.boss + ' has been slain!\\n\\n**Rewards:**\\n' + rewards,
				color: embed.colors.SUCCESS,
			})]
		});
		return;
	}
	
	extension.storage.write(raidKey, raid);
	
	const hpPercent = Math.round((raid.hp / raid.maxHp) * 100);
	message.reply('⚔️ ' + message.author.username + ' dealt **' + damage + '** damage! ' + raid.emoji + ' HP: ' + hpPercent + '%');
	return;
}

if (action === 'status') {
	const hpBar = utils.format.progressBar(raid.hp, raid.maxHp);
	const raiders = Object.keys(raid.participants).length;
	
	message.reply({
		embeds: [embed.create({
			title: raid.emoji + ' ' + raid.boss,
			description: '**HP:** ' + utils.format.number(raid.hp) + '/' + utils.format.number(raid.maxHp) + '\\n' + hpBar + '\\n\\n**Raiders:** ' + raiders,
			color: embed.colors.GOLD,
		})]
	});
}
`,
	},
	{
		name: "Spyfall",
		description: "Find the spy who doesn't know the location!",
		type: "command",
		key: "spyfall",
		usage_help: "[start|join|guess <location>]",
		extended_help: "Social deduction game. The spy must figure out the location, others must find the spy!",
		scopes: ["messages_write", "channels_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const locations = [
	'Beach', 'Hospital', 'School', 'Restaurant', 'Airport',
	'Bank', 'Casino', 'Circus', 'Movie Theater', 'Space Station',
	'Pirate Ship', 'Submarine', 'Zoo', 'Museum', 'Supermarket',
];

const gameKey = 'spyfall_' + message.channel.id;
let game = extension.storage.get(gameKey);
const args = command.suffix.trim().split(/\\s+/);
const action = args[0]?.toLowerCase();

if (action === 'start') {
	if (game && game.state === 'playing') {
		message.reply('❌ Game already in progress!');
		return;
	}
	
	game = {
		state: 'lobby',
		players: [message.author.id],
		host: message.author.id,
		startTime: Date.now(),
	};
	extension.storage.write(gameKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🕵️ Spyfall - Lobby',
			description: 'A game is starting!\\n\\nType \`spyfall join\` to join!\\nHost types \`spyfall begin\` when ready.\\n\\n**Players:** 1 (need 3+)',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (action === 'join') {
	if (!game || game.state !== 'lobby') {
		message.reply('❌ No lobby open. Use \`spyfall start\`');
		return;
	}
	
	if (game.players.includes(message.author.id)) {
		message.reply('✅ You already joined!');
		return;
	}
	
	game.players.push(message.author.id);
	extension.storage.write(gameKey, game);
	
	message.reply('✅ ' + message.author.username + ' joined! (' + game.players.length + ' players)');
	return;
}

if (action === 'begin') {
	if (!game || game.state !== 'lobby') {
		message.reply('❌ No lobby to start.');
		return;
	}
	
	if (message.author.id !== game.host) {
		message.reply('❌ Only the host can start!');
		return;
	}
	
	if (game.players.length < 3) {
		message.reply('❌ Need at least 3 players!');
		return;
	}
	
	const location = utils.random.pick(locations);
	const spyIndex = utils.random.int(0, game.players.length - 1);
	
	game.state = 'playing';
	game.location = location;
	game.spy = game.players[spyIndex];
	game.votes = {};
	extension.storage.write(gameKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🕵️ Spyfall Started!',
			description: 'Roles have been assigned!\\n\\n**Location:** (check your DMs)\\n**Players:** ' + game.players.length +
			'\\n\\nAsk questions to find the spy!\\nSpy: \`spyfall guess <location>\`\\nOthers: \`spyfall vote @user\`',
			color: embed.colors.GREEN,
			footer: { text: 'Possible locations: ' + locations.slice(0, 8).join(', ') + '...' },
		})]
	});
	return;
}

if (action === 'guess' && game?.state === 'playing') {
	if (message.author.id !== game.spy) {
		message.reply('❌ Only the spy can guess!');
		return;
	}
	
	const guess = args.slice(1).join(' ').toLowerCase();
	const correct = guess === game.location.toLowerCase();
	
	extension.storage.write(gameKey, null);
	
	if (correct) {
		message.reply({
			embeds: [embed.create({
				title: '🕵️ Spy Wins!',
				description: 'The spy (' + utils.discord.userMention(game.spy) + ') correctly guessed **' + game.location + '**!',
				color: embed.colors.ERROR,
			})]
		});
	} else {
		message.reply({
			embeds: [embed.create({
				title: '✅ Spy Loses!',
				description: 'The spy guessed wrong!\\nLocation was: **' + game.location + '**\\nSpy was: ' + utils.discord.userMention(game.spy),
				color: embed.colors.SUCCESS,
			})]
		});
	}
	return;
}

if (action === 'vote' && game?.state === 'playing') {
	const mention = command.suffix.match(/<@!?(\\d+)>/);
	if (!mention) {
		message.reply('❌ Vote for someone: \`spyfall vote @user\`');
		return;
	}
	
	const target = mention[1];
	game.votes[message.author.id] = target;
	extension.storage.write(gameKey, game);
	
	message.reply('🗳️ ' + message.author.username + ' voted!');
	
	// Check if all voted
	if (Object.keys(game.votes).length === game.players.length) {
		const counts = {};
		Object.values(game.votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
		const accused = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
		
		extension.storage.write(gameKey, null);
		
		if (accused === game.spy) {
			message.reply({
				embeds: [embed.create({
					title: '✅ Spy Caught!',
					description: utils.discord.userMention(game.spy) + ' was the spy!\\nLocation: **' + game.location + '**',
					color: embed.colors.SUCCESS,
				})]
			});
		} else {
			message.reply({
				embeds: [embed.create({
					title: '😈 Spy Wins!',
					description: 'Wrong person accused!\\nThe spy was: ' + utils.discord.userMention(game.spy) + '\\nLocation: **' + game.location + '**',
					color: embed.colors.ERROR,
				})]
			});
		}
	}
	return;
}

message.reply({
	embeds: [embed.create({
		title: '🕵️ Spyfall',
		description: '**Commands:**\\n' +
			'\`spyfall start\` - Create a game lobby\\n' +
			'\`spyfall join\` - Join the lobby\\n' +
			'\`spyfall begin\` - Start the game (host)\\n' +
			'\`spyfall vote @user\` - Vote for the spy\\n' +
			'\`spyfall guess <location>\` - Spy guesses location',
		color: embed.colors.BLUE,
	})]
});
`,
	},
	{
		name: "Pattern",
		description: "Complete the pattern sequence!",
		type: "command",
		key: "pattern",
		usage_help: "[answer]",
		extended_help: "Figure out what comes next in the sequence!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const patterns = [
	{ seq: [2, 4, 6, 8], next: 10, hint: 'Even numbers' },
	{ seq: [1, 4, 9, 16], next: 25, hint: 'Perfect squares' },
	{ seq: [1, 1, 2, 3, 5], next: 8, hint: 'Fibonacci' },
	{ seq: [3, 6, 12, 24], next: 48, hint: 'Doubling' },
	{ seq: [1, 3, 6, 10], next: 15, hint: 'Triangle numbers' },
	{ seq: [2, 3, 5, 7, 11], next: 13, hint: 'Prime numbers' },
	{ seq: [1, 8, 27, 64], next: 125, hint: 'Perfect cubes' },
	{ seq: [100, 81, 64, 49], next: 36, hint: 'Descending squares' },
];

const emojiPatterns = [
	{ seq: ['🔴', '🟠', '🟡', '🟢'], next: '🔵', hint: 'Rainbow order' },
	{ seq: ['🌑', '🌒', '🌓', '🌔'], next: '🌕', hint: 'Moon phases' },
	{ seq: ['♠️', '♥️', '♦️'], next: '♣️', hint: 'Card suits' },
];

const stateKey = 'pattern_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim();

if (!game || guess === 'new') {
	const useEmoji = utils.random.int(0, 2) === 0;
	const pattern = useEmoji ? utils.random.pick(emojiPatterns) : utils.random.pick(patterns);
	
	game = { pattern, isEmoji: useEmoji, attempts: 0 };
	extension.storage.write(stateKey, game);
	
	const seqStr = game.pattern.seq.join(useEmoji ? ' ' : ', ');
	
	message.reply({
		embeds: [embed.create({
			title: '🔢 Pattern Puzzle',
			description: '**What comes next?**\\n\\n' + seqStr + ', **?**',
			color: embed.colors.BLUE,
			footer: { text: 'Type: pattern <answer> | pattern hint' },
		})]
	});
	return;
}

if (guess === 'hint') {
	message.reply('💡 Hint: ' + game.pattern.hint);
	return;
}

if (!guess) {
	const seqStr = game.pattern.seq.join(game.isEmoji ? ' ' : ', ');
	message.reply({
		embeds: [embed.create({
			title: '🔢 Current Pattern',
			description: seqStr + ', **?**\\nAttempts: ' + game.attempts,
			color: embed.colors.BLUE,
		})]
	});
	return;
}

game.attempts++;
const answer = game.isEmoji ? guess : parseInt(guess);
const correct = String(answer) === String(game.pattern.next);

if (correct) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '✅ Correct!',
			description: 'The answer was **' + game.pattern.next + '**!\\n(' + game.pattern.hint + ')\\n\\nSolved in ' + game.attempts + ' ' + utils.format.pluralize(game.attempts, 'attempt') + '!',
			color: embed.colors.SUCCESS,
		})]
	});
} else {
	extension.storage.write(stateKey, game);
	message.reply('❌ Not quite! Try again.');
}
`,
	},
	{
		name: "Cipher",
		description: "Decode encrypted messages!",
		type: "command",
		key: "cipher",
		usage_help: "[answer]",
		extended_help: "Crack the code! Various cipher types to solve.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const words = ['DISCORD', 'GAMING', 'SECRET', 'PUZZLE', 'CIPHER', 'ENIGMA', 'RIDDLE', 'DECODE'];

function caesarShift(text, shift) {
	return text.split('').map(c => {
		if (c >= 'A' && c <= 'Z') {
			return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
		}
		return c;
	}).join('');
}

function reverseText(text) {
	return text.split('').reverse().join('');
}

function atbash(text) {
	return text.split('').map(c => {
		if (c >= 'A' && c <= 'Z') {
			return String.fromCharCode(90 - (c.charCodeAt(0) - 65));
		}
		return c;
	}).join('');
}

const stateKey = 'cipher_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim().toUpperCase();

if (!game || guess === 'NEW') {
	const word = utils.random.pick(words);
	const cipherType = utils.random.int(0, 2);
	let encoded, hint;
	
	if (cipherType === 0) {
		const shift = utils.random.int(1, 25);
		encoded = caesarShift(word, shift);
		hint = 'Caesar cipher (shift ' + shift + ')';
	} else if (cipherType === 1) {
		encoded = reverseText(word);
		hint = 'Reversed text';
	} else {
		encoded = atbash(word);
		hint = 'Atbash cipher (A↔Z)';
	}
	
	game = { word, encoded, hint, cipherType, attempts: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🔐 Cipher Challenge',
			description: '**Decode this message:**\\n\\n\`' + encoded + '\`',
			color: embed.colors.PURPLE,
			footer: { text: 'Type: cipher <answer> | cipher hint' },
		})]
	});
	return;
}

if (guess === 'HINT') {
	message.reply('💡 Hint: ' + game.hint);
	return;
}

if (!guess) {
	message.reply({
		embeds: [embed.create({
			title: '🔐 Current Cipher',
			description: '\`' + game.encoded + '\`\\nAttempts: ' + game.attempts,
			color: embed.colors.PURPLE,
		})]
	});
	return;
}

game.attempts++;

if (guess === game.word) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🔓 Decoded!',
			description: 'The message was **' + game.word + '**!\\n(' + game.hint + ')\\n\\nCracked in ' + game.attempts + ' ' + utils.format.pluralize(game.attempts, 'attempt') + '!',
			color: embed.colors.SUCCESS,
		})]
	});
} else {
	extension.storage.write(stateKey, game);
	message.reply('❌ Wrong! Keep trying.');
}
`,
	},
	{
		name: "Icebreaker",
		description: "Get random conversation starters!",
		type: "command",
		key: "icebreaker",
		usage_help: "[category]",
		extended_help: "Random icebreaker questions to spark conversations!",
		scopes: ["messages_write"],
		timeout: 3000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');
const embed = require('embed');

const questions = {
	fun: [
		"If you could have any superpower, what would it be?",
		"What's the weirdest food combination you enjoy?",
		"If you were a pizza topping, what would you be?",
		"What's your go-to karaoke song?",
		"If you could live in any fictional world, where?",
		"What's the most useless talent you have?",
		"If animals could talk, which would be the rudest?",
		"What's your spirit animal and why?",
	],
	deep: [
		"What's something you've changed your mind about?",
		"What's a lesson you learned the hard way?",
		"What would you tell your younger self?",
		"What's something you're grateful for today?",
		"If you could master any skill instantly, what?",
		"What's a fear you've overcome?",
		"What does success mean to you?",
		"What's the best advice you've received?",
	],
	gaming: [
		"What's your most played game ever?",
		"Favorite video game soundtrack?",
		"Most frustrating game you've ever played?",
		"What game do you wish you could play for the first time again?",
		"Favorite boss fight of all time?",
		"What game character do you relate to most?",
		"Your hottest gaming take?",
		"What game deserves a sequel/remake?",
	],
	random: [
		"How do you like your eggs?",
		"What's the last thing you searched on the internet?",
		"Do you fold or scrunch?",
		"What's your typing speed?",
		"Morning person or night owl?",
		"What's your phone wallpaper?",
		"Last song you listened to?",
		"What's in your pocket/nearby right now?",
	],
};

const category = command.suffix.trim().toLowerCase();
const validCategories = Object.keys(questions);

if (category && !validCategories.includes(category)) {
	message.reply('❌ Categories: ' + validCategories.join(', '));
	return;
}

const pool = category ? questions[category] : Object.values(questions).flat();
const question = utils.random.pick(pool);
const emoji = { fun: '🎉', deep: '💭', gaming: '🎮', random: '🎲' };

message.reply({
	embeds: [embed.create({
		title: (category ? emoji[category] + ' ' : '❄️ ') + 'Icebreaker',
		description: '**' + question + '**',
		color: embed.colors.BLUE,
		footer: { text: category ? utils.text.capitalize(category) : 'Random | Categories: fun, deep, gaming, random' },
	})]
});
`,
	},
	{
		name: "War",
		description: "Play the simple card game War!",
		type: "command",
		key: "war",
		usage_help: "[play]",
		extended_help: "Classic War card game! Higher card wins the round.",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const economy = require('economy');
const utils = require('utils');
const embed = require('embed');

const suits = ['♠️', '♥️', '♦️', '♣️'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
	const deck = [];
	for (const suit of suits) {
		for (const rank of ranks) {
			deck.push({ rank, suit, value: ranks.indexOf(rank) });
		}
	}
	return utils.random.shuffle(deck);
}

function cardStr(card) {
	return card.rank + card.suit;
}

const stateKey = 'war_' + message.author.id;
let game = extension.storage.get(stateKey);
const action = command.suffix.trim().toLowerCase();

if (!game || action === 'new') {
	const deck = createDeck();
	const mid = Math.floor(deck.length / 2);
	game = {
		playerDeck: deck.slice(0, mid),
		botDeck: deck.slice(mid),
		round: 0,
	};
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '⚔️ War!',
			description: 'Cards dealt!\\n\\n**Your cards:** ' + game.playerDeck.length + '\\n**Bot cards:** ' + game.botDeck.length + '\\n\\nType \`war play\` to flip!',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (action === 'play' || action === 'flip') {
	if (game.playerDeck.length === 0 || game.botDeck.length === 0) {
		const won = game.playerDeck.length > 0;
		extension.storage.write(stateKey, null);
		
		if (won) {
			economy.addPoints(message.author.id, 50, 'War victory');
			message.reply({
				embeds: [embed.create({
					title: '🎉 You Win!',
					description: 'You collected all the cards!\\n+50 points!',
					color: embed.colors.SUCCESS,
				})]
			});
		} else {
			message.reply({
				embeds: [embed.create({
					title: '😢 Bot Wins',
					description: 'The bot collected all your cards!',
					color: embed.colors.ERROR,
				})]
			});
		}
		return;
	}
	
	const playerCard = game.playerDeck.shift();
	const botCard = game.botDeck.shift();
	game.round++;
	
	let result, color;
	if (playerCard.value > botCard.value) {
		game.playerDeck.push(playerCard, botCard);
		result = '✅ You win this round!';
		color = embed.colors.SUCCESS;
	} else if (playerCard.value < botCard.value) {
		game.botDeck.push(playerCard, botCard);
		result = '❌ Bot wins this round!';
		color = embed.colors.ERROR;
	} else {
		// War!
		game.playerDeck.push(playerCard);
		game.botDeck.push(botCard);
		result = '⚔️ WAR! Cards returned (tie)';
		color = embed.colors.GOLD;
	}
	
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '⚔️ War - Round ' + game.round,
			description: '**You:** ' + cardStr(playerCard) + '\\n**Bot:** ' + cardStr(botCard) + '\\n\\n' + result + '\\n\\n📊 You: ' + game.playerDeck.length + ' | Bot: ' + game.botDeck.length,
			color: color,
		})]
	});
	return;
}

message.reply({
	embeds: [embed.create({
		title: '⚔️ War Status',
		description: '**Your cards:** ' + game.playerDeck.length + '\\n**Bot cards:** ' + game.botDeck.length + '\\n**Round:** ' + game.round,
		color: embed.colors.BLUE,
		footer: { text: 'Type: war play to flip cards' },
	})]
});
`,
	},
];

async function seedExtensions () {
	require("dotenv").config();
	const Database = require("../Database/Driver");

	await Database.initialize({
		database: process.env.MARIADB_DATABASE || "skynet",
		username: process.env.MARIADB_USER || "skynet",
		password: process.env.MARIADB_PASSWORD,
		host: process.env.MARIADB_HOST || "localhost",
		port: parseInt(process.env.MARIADB_PORT) || 3306,
	});

	const Gallery = global.Gallery;
	const crypto = require("crypto");
	const ownerId = process.env.BOT_MAINTAINERS.split(",")[0].trim();

	const generateCodeID = (code) => crypto
		.createHash("sha256")
		.update(code)
		.digest("hex")
		.substring(0, 16);

	console.log("🔧 Seeding Batch 4 Extensions...\n");

	for (const ext of extensions) {
		const codeId = generateCodeID(ext.code);

		const existing = await Gallery.findOne({ name: ext.name }).catch(() => null);

		if (existing) {
			console.log(`⚠️  Updating existing extension: ${ext.name}`);
			existing._setAtomic("code_id", codeId, "$set");
			const versionIndex = existing.versions.findIndex((v) => v._id === existing.published_version);
			if (versionIndex !== -1) {
				existing._setAtomic(`versions.${versionIndex}.code_id`, codeId, "$set");
			}
			await existing.save();
		} else {
			const galleryDocument = await Gallery.new({
				name: ext.name,
				description: ext.description,
				level: "gallery",
				state: "gallery",
				owner_id: ownerId,
				featured: false,
				points: 0,
				last_updated: new Date(),
				version: 1,
				published_version: 1,
				code_id: codeId,
				versions: [{
					_id: 1,
					accepted: true,
					type: ext.type,
					key: ext.key,
					usage_help: ext.usage_help,
					extended_help: ext.extended_help,
					timeout: ext.timeout,
					scopes: ext.scopes,
					code_id: codeId,
				}],
			});
			await galleryDocument.save();
			console.log(`✅ Created: ${ext.name}`);
		}

		await fs.outputFileAtomic(
			path.join(__dirname, `../extensions/${codeId}.skyext`),
			ext.code.trim(),
		);
	}

	console.log("\n🎉 Batch 4 Complete!");
	process.exit(0);
}

seedExtensions().catch((err) => {
	console.error(err);
	process.exit(1);
});
