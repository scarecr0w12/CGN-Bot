/**
 * Seed script for Batch 2 extensions (High & Medium Priority)
 * Run with: node scripts/seed-extensions-batch2.js
 */

const path = require("path");
const fs = require("fs-nextra");

// Extension definitions
const extensions = [
	{
		name: "Wordle",
		description: "Play the daily word guessing game! Guess the 5-letter word in 6 tries.",
		type: "command",
		key: "wordle",
		usage_help: "[guess]",
		extended_help: "Guess the daily 5-letter word! Green means correct letter & spot, Yellow means correct letter wrong spot, Grey means not in word.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const words = [
	"APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "CHEST", "CHORD",
	"CLICK", "CLOCK", "CLOUD", "DANCE", "DIARY", "DRINK", "DRIVE", "EARTH",
	"FEAST", "FIELD", "FRUIT", "GLASS", "GRAPE", "GREEN", "GHOST", "HEART",
	"HOUSE", "JUICE", "LIGHT", "LEMON", "MELON", "MONEY", "MUSIC", "NIGHT",
	"OCEAN", "PARTY", "PHONE", "PIANO", "PILOT", "PLANE", "PLANT", "PLATE",
	"POWER", "RADIO", "RIVER", "ROBOT", "SHIRT", "SHOES", "SNAKE", "SPACE",
	"SPOON", "STORM", "TABLE", "TOAST", "TIGER", "TRAIN", "WATER", "WATCH",
	"WHALE", "WORLD", "WRITE", "YOUTH", "ZEBRA"
];

const today = new Date().toISOString().slice(0, 10);
const seed = parseInt(today.replace(/-/g, ''));
const wordIndex = seed % words.length;
const targetWord = words[wordIndex];

const userId = message.author.id;
const userStateKey = 'wordle_' + userId + '_' + today;
let userState = extension.storage.get(userStateKey) || { guesses: [], solved: false };

const guess = command.suffix.trim().toUpperCase();

if (userState.solved) {
	message.reply('🎉 You already solved today\\'s Wordle! Come back tomorrow.');
	return;
}

if (userState.guesses.length >= 6) {
	message.reply('❌ You used all your guesses! The word was: **' + targetWord + '**');
	return;
}

if (!guess) {
	renderBoard(userState.guesses, targetWord, false);
	return;
}

if (guess.length !== 5 || !/^[A-Z]+$/.test(guess)) {
	message.reply('❌ Please enter a valid 5-letter word!');
	return;
}

userState.guesses.push(guess);

if (guess === targetWord) {
	userState.solved = true;
	renderBoard(userState.guesses, targetWord, true);
} else if (userState.guesses.length >= 6) {
	renderBoard(userState.guesses, targetWord, false, true);
} else {
	renderBoard(userState.guesses, targetWord, false);
}

extension.storage.write(userStateKey, userState);

function renderBoard(guesses, target, won, lost = false) {
	let board = '';
	for (const g of guesses) {
		let line = '';
		for (let i = 0; i < 5; i++) {
			const letter = g[i];
			if (letter === target[i]) line += '🟩 ';
			else if (target.includes(letter)) line += '🟨 ';
			else line += '⬛ ';
		}
		line += '  ' + g.split('').join(' ');
		board += line + '\\n';
	}
	for (let i = guesses.length; i < 6; i++) {
		board += '⬜ ⬜ ⬜ ⬜ ⬜\\n';
	}
	
	message.reply({
		embeds: [embed.create({
			title: '📅 Daily Wordle ' + today,
			description: board,
			color: won ? embed.colors.SUCCESS : (lost ? embed.colors.ERROR : embed.colors.BLUE),
			footer: { text: won ? 'Solved in ' + guesses.length + '/6!' : (lost ? 'The word was: ' + target : 'Guess ' + (guesses.length + 1) + '/6') },
		})]
	});
}
`,
	},
	{
		name: "Roulette",
		description: "Play casino roulette! Bet on colors or numbers.",
		type: "command",
		key: "roulette",
		usage_help: "<bet> <red|black|green|number>",
		extended_help: "Bet points on the roulette wheel! Red/Black pays 2x, Green pays 14x, Specific Number pays 36x.",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');

const args = command.suffix.trim().split(/\\s+/);
const betAmount = parseInt(args[0]);
const betType = args[1]?.toLowerCase();

if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
	message.reply('❌ Usage: \`roulette <amount> <red|black|green|0-36>\`');
	return;
}

if (!betType) {
	message.reply('❌ Please specify what to bet on: red, black, green, or a number (0-36)');
	return;
}

let payout = 0;
let winningNumbers = [];

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

if (betType === 'red') {
	payout = 2;
	winningNumbers = redNumbers;
} else if (betType === 'black') {
	payout = 2;
	winningNumbers = blackNumbers;
} else if (betType === 'green') {
	payout = 14;
	winningNumbers = [0];
} else {
	const num = parseInt(betType);
	if (!isNaN(num) && num >= 0 && num <= 36) {
		payout = 36;
		winningNumbers = [num];
	} else {
		message.reply('❌ Invalid bet type! Choose red, black, green, or 0-36.');
		return;
	}
}

const userData = economy.getSelf();
if (userData.rankScore < betAmount) {
	message.reply('❌ Insufficient funds! You have ' + utils.format.number(userData.rankScore) + ' points.');
	return;
}

const result = utils.random.int(0, 36);
let color = 'green';
if (redNumbers.includes(result)) color = 'red';
else if (blackNumbers.includes(result)) color = 'black';

const colorEmoji = { red: '🔴', black: '⚫', green: '🟢' };
const won = winningNumbers.includes(result);

let description = 'The wheel spins... ' + colorEmoji[color] + ' **' + result + '**\\n\\n';

if (won) {
	const winnings = betAmount * payout;
	economy.addPoints(message.author.id, winnings, 'Roulette win');
	description += '🎉 **YOU WIN!**\\nPayout: ' + payout + 'x\\nWinnings: +' + utils.format.number(winnings) + ' points';
} else {
	economy.removePoints(message.author.id, betAmount, 'Roulette loss');
	description += '😢 **YOU LOSE**\\nLost: -' + utils.format.number(betAmount) + ' points';
}

message.reply({
	embeds: [embed.create({
		title: '🎰 Roulette',
		description: description,
		color: won ? embed.colors.SUCCESS : embed.colors.ERROR,
	})]
});
`,
	},
	{
		name: "Crash",
		description: "Bet points on a multiplier that crashes at a random point!",
		type: "command",
		key: "crash",
		usage_help: "<bet> <cashout>",
		extended_help: "Set your auto-cashout multiplier. If the crash point is higher than your cashout, you win!",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');

const args = command.suffix.trim().split(/\\s+/);
const betAmount = parseInt(args[0]);
const cashout = parseFloat(args[1]);

if (!betAmount || !cashout || isNaN(betAmount) || isNaN(cashout) || betAmount <= 0 || cashout <= 1.0) {
	message.reply('❌ Usage: \`crash <bet> <cashout_multiplier>\` (e.g. crash 100 2.0)');
	return;
}

const userData = economy.getSelf();
if (userData.rankScore < betAmount) {
	message.reply('❌ Insufficient funds! You have ' + utils.format.number(userData.rankScore) + ' points.');
	return;
}

const houseEdge = 0.04;
const r = Math.random();
let crashPoint = Math.floor(100 / (1 - r + houseEdge) * 0.01 * 100) / 100;
if (crashPoint < 1.00) crashPoint = 1.00;

const won = crashPoint >= cashout;

if (won) {
	const winnings = Math.floor(betAmount * cashout);
	const profit = winnings - betAmount;
	economy.addPoints(message.author.id, profit, 'Crash win');
	
	message.reply({
		embeds: [embed.create({
			title: '🚀 Crash - You Win!',
			description: utils.format.progressBar(cashout, crashPoint * 1.2) + '\\n\\n' +
				'Crashed at: **' + crashPoint.toFixed(2) + 'x**\\n' +
				'You cashed out at: **' + cashout.toFixed(2) + 'x**\\n\\n' +
				'💰 Profit: **+' + utils.format.number(profit) + '** points',
			color: embed.colors.SUCCESS,
		})]
	});
} else {
	economy.removePoints(message.author.id, betAmount, 'Crash loss');
	message.reply({
		embeds: [embed.create({
			title: '💥 Crash - Busted!',
			description: utils.format.progressBar(crashPoint, cashout) + '\\n\\n' +
				'Crashed at: **' + crashPoint.toFixed(2) + 'x**\\n' +
				'Your target: **' + cashout.toFixed(2) + 'x**\\n\\n' +
				'💸 Lost: **-' + utils.format.number(betAmount) + '** points',
			color: embed.colors.ERROR,
		})]
	});
}
`,
	},
	{
		name: "Mafia",
		description: "Start a game of Mafia (Werewolf).",
		type: "command",
		key: "mafia",
		usage_help: "[start|join|status]",
		extended_help: "Social deduction game. Villagers must find the Mafia before they eliminate everyone!",
		scopes: ["messages_write", "channels_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const embed = require('embed');
const utils = require('utils');

const action = command.arguments[0]?.toLowerCase();
const lobbyKey = 'mafia_lobby_' + message.channel.id;
let lobby = extension.storage.get(lobbyKey);

if (action === 'start') {
	if (lobby && lobby.state === 'forming') {
		message.reply('❌ Game already forming! Type \`mafia join\` to join.');
		return;
	}
	
	lobby = {
		state: 'forming',
		players: [message.author.id],
		host: message.author.id,
		startTime: Date.now(),
	};
	extension.storage.write(lobbyKey, lobby);
	
	message.reply({
		embeds: [embed.create({
			title: '🕵️ Mafia Game Forming!',
			description: 'A new game of Mafia is starting!\\n\\n' +
				'Type \`' + command.prefix + 'mafia join\` to join!\\n\\n' +
				'**Players:** 1/10\\n' +
				'**Minimum:** 4 players required',
			color: embed.colors.BLUE,
			footer: { text: 'Host: ' + message.author.username },
		})]
	});
} else if (action === 'join') {
	if (!lobby || lobby.state !== 'forming') {
		message.reply('❌ No game forming. Use \`mafia start\` to create one.');
		return;
	}
	
	if (lobby.players.includes(message.author.id)) {
		message.reply('⚠️ You already joined!');
		return;
	}
	
	if (lobby.players.length >= 10) {
		message.reply('❌ Game is full (10/10 players)!');
		return;
	}
	
	lobby.players.push(message.author.id);
	extension.storage.write(lobbyKey, lobby);
	
	const playerList = lobby.players.map((p) => utils.discord.userMention(p)).join(', ');
	message.reply({
		embeds: [embed.create({
			title: '✅ Joined Mafia Game!',
			description: '**Players (' + lobby.players.length + '/10):**\\n' + playerList,
			color: embed.colors.GREEN,
		})]
	});
} else if (action === 'status') {
	if (!lobby) {
		message.reply('No active game. Use \`mafia start\` to begin.');
		return;
	}
	const playerList = lobby.players.map((p) => utils.discord.userMention(p)).join(', ');
	message.reply({
		embeds: [embed.create({
			title: '🕵️ Mafia Game Status',
			description: '**State:** ' + utils.text.capitalize(lobby.state) + '\\n' +
				'**Players (' + lobby.players.length + '):**\\n' + playerList,
			color: embed.colors.BLUE,
		})]
	});
} else {
	message.reply({
		embeds: [embed.create({
			title: '🕵️ Mafia Help',
			description: '**Commands:**\\n' +
				'\`mafia start\` - Start a new game lobby\\n' +
				'\`mafia join\` - Join the current lobby\\n' +
				'\`mafia status\` - View current game status\\n\\n' +
				'*Note: Full game logic requires 4+ players.*',
			color: embed.colors.DEFAULT,
		})]
	});
}
`,
	},
	{
		name: "Adventure",
		description: "Go on a text-based adventure!",
		type: "command",
		key: "adventure",
		usage_help: "[1|2]",
		extended_help: "Make choices that affect your journey. Can you survive?",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const stateKey = 'adventure_' + message.author.id;
let state = extension.storage.get(stateKey);
const choice = parseInt(command.suffix.trim());

const encounters = [
	{
		text: "You wake up in a dark forest. A path splits ahead.",
		options: ["Take the left path into the mist", "Take the right path toward distant lights"],
		next: [1, 2],
	},
	{
		text: "The mist thickens. You hear growling nearby. A wolf appears!",
		options: ["Try to run away", "Stand your ground"],
		results: ["You escaped! But you're lost...", "The wolf respects your courage and leaves."],
	},
	{
		text: "You reach a small village. An old woman offers you a potion.",
		options: ["Drink the potion", "Politely decline"],
		results: ["You feel stronger! +10 HP", "She nods wisely. 'Trust is earned.'"],
	},
];

if (!state || !choice) {
	state = { step: 0, hp: 100 };
	extension.storage.write(stateKey, state);
	const enc = encounters[0];
	
	message.reply({
		embeds: [embed.create({
			title: '🗺️ Adventure Begins!',
			description: enc.text + '\\n\\n' +
				'**Choose:**\\n' +
				'1️⃣ ' + enc.options[0] + '\\n' +
				'2️⃣ ' + enc.options[1],
			color: embed.colors.GREEN,
			footer: { text: 'HP: ' + state.hp + ' | Type: adventure 1 or adventure 2' },
		})]
	});
	return;
}

if (choice !== 1 && choice !== 2) {
	message.reply('❌ Choose 1 or 2!');
	return;
}

const enc = encounters[Math.min(state.step, encounters.length - 1)];
const result = enc.results ? enc.results[choice - 1] : 'You continue your journey...';
state.step++;

extension.storage.write(stateKey, state);

message.reply({
	embeds: [embed.create({
		title: '🗺️ Adventure',
		description: '**You chose:** ' + enc.options[choice - 1] + '\\n\\n' + result,
		color: embed.colors.GOLD,
		footer: { text: 'HP: ' + state.hp + ' | Step: ' + state.step },
	})]
});
`,
	},
	{
		name: "Dungeon",
		description: "Explore a generated dungeon floor.",
		type: "command",
		key: "dungeon",
		usage_help: "[new]",
		extended_help: "Generates a random dungeon layout with monsters and loot.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');
const embed = require('embed');

const tiles = ['⬛', '⬜', '🚪', '💀', '💰', '🧪', '⚔️'];
const weights = [
	{ item: '⬜', weight: 40 },
	{ item: '⬛', weight: 25 },
	{ item: '🚪', weight: 10 },
	{ item: '💀', weight: 10 },
	{ item: '💰', weight: 8 },
	{ item: '🧪', weight: 4 },
	{ item: '⚔️', weight: 3 },
];

let map = '';
let monsters = 0, loot = 0;

for (let i = 0; i < 5; i++) {
	for (let j = 0; j < 5; j++) {
		if (i === 2 && j === 2) {
			map += '👤 ';
		} else {
			const tile = utils.random.weighted(weights);
			map += tile + ' ';
			if (tile === '💀') monsters++;
			if (tile === '💰') loot++;
		}
	}
	map += '\\n';
}

const floor = utils.random.int(1, 10);

message.reply({
	embeds: [embed.create({
		title: '🏰 Dungeon - Floor ' + floor,
		description: map + '\\n' +
			'**Stats:**\\n' +
			'💀 Monsters: ' + monsters + '\\n' +
			'💰 Loot: ' + loot,
		color: embed.colors.PURPLE,
		footer: { text: '👤 You | ⬜ Empty | 🚪 Door | 💀 Monster | 💰 Loot | 🧪 Potion | ⚔️ Weapon' },
	})]
});
`,
	},
	{
		name: "Minesweeper",
		description: "Play a game of Minesweeper.",
		type: "command",
		key: "minesweeper",
		usage_help: "[easy|medium|hard]",
		extended_help: "Generates a spoiler-tagged minesweeper board. Click to reveal!",
		scopes: ["messages_write"],
		timeout: 8000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');

const difficulty = command.suffix.trim().toLowerCase() || 'easy';
let size, mineCount;

if (difficulty === 'hard') {
	size = 7; mineCount = 12;
} else if (difficulty === 'medium') {
	size = 6; mineCount = 8;
} else {
	size = 5; mineCount = 5;
}

const grid = Array(size).fill().map(() => Array(size).fill(0));

let placed = 0;
while (placed < mineCount) {
	const r = utils.random.int(0, size - 1);
	const c = utils.random.int(0, size - 1);
	if (grid[r][c] !== '💣') {
		grid[r][c] = '💣';
		placed++;
	}
}

const numEmoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (grid[r][c] === '💣') continue;
		let count = 0;
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				const nr = r + dr, nc = c + dc;
				if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === '💣') count++;
			}
		}
		grid[r][c] = count === 0 ? '🟦' : numEmoji[count];
	}
}

let output = '';
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		output += '||' + grid[r][c] + '||';
	}
	output += '\\n';
}

message.reply('💣 **Minesweeper** (' + utils.text.capitalize(difficulty) + ' - ' + mineCount + ' mines)\\n\\n' + output);
`,
	},
	{
		name: "Battleship",
		description: "Play Battleship against the bot.",
		type: "command",
		key: "battleship",
		usage_help: "<A-E><1-5> | reset",
		extended_help: "Guess coordinates to hit the bot's ships. 5x5 grid with 5 ship tiles.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const stateKey = 'battleship_' + message.author.id;
let game = extension.storage.get(stateKey);
const input = command.suffix.trim().toUpperCase();

if (!game || input === 'RESET') {
	const ships = [];
	while (ships.length < 5) {
		const r = utils.random.int(0, 4);
		const c = utils.random.int(0, 4);
		if (!ships.some((s) => s.r === r && s.c === c)) {
			ships.push({ r, c });
		}
	}
	game = { ships, hits: [], misses: [], moves: 0 };
	extension.storage.write(stateKey, game);
	
	if (input === 'RESET') {
		message.reply('🔄 Game reset! New ships placed.');
		return;
	}
}

if (!input || input === 'RESET') {
	message.reply('🚢 **Battleship**\\nGuess a coordinate like \`battleship A1\`\\nType \`battleship reset\` to start over.');
	return;
}

if (!/^[A-E][1-5]$/.test(input)) {
	message.reply('❌ Invalid coordinate! Use A-E and 1-5 (e.g. A1, C3)');
	return;
}

const r = input.charCodeAt(0) - 65;
const c = parseInt(input[1]) - 1;
const coord = input;

if (game.hits.includes(coord) || game.misses.includes(coord)) {
	message.reply('⚠️ You already guessed ' + coord + '!');
	return;
}

game.moves++;
const hit = game.ships.some((s) => s.r === r && s.c === c);

if (hit) {
	game.hits.push(coord);
} else {
	game.misses.push(coord);
}

extension.storage.write(stateKey, game);

const rows = ['A', 'B', 'C', 'D', 'E'];
let board = '⬛1️⃣2️⃣3️⃣4️⃣5️⃣\\n';
for (let i = 0; i < 5; i++) {
	board += ['🇦', '🇧', '🇨', '🇩', '🇪'][i];
	for (let j = 0; j < 5; j++) {
		const cellCoord = rows[i] + (j + 1);
		if (game.hits.includes(cellCoord)) board += '💥';
		else if (game.misses.includes(cellCoord)) board += '🌊';
		else board += '⬜';
	}
	board += '\\n';
}

const won = game.hits.length === 5;
const status = hit ? '💥 **HIT!**' : '🌊 **MISS**';

message.reply({
	embeds: [embed.create({
		title: won ? '🎉 Victory!' : '🚢 Battleship',
		description: board + '\\n' + (won ? 'You sunk all ships in **' + game.moves + '** moves!' : status + ' at ' + coord),
		color: won ? embed.colors.SUCCESS : (hit ? embed.colors.GOLD : embed.colors.BLUE),
		footer: { text: 'Hits: ' + game.hits.length + '/5 | Moves: ' + game.moves },
	})]
});

if (won) {
	extension.storage.write(stateKey, null);
}
`,
	},
	{
		name: "Auction",
		description: "Start an auction for an item.",
		type: "command",
		key: "auction",
		usage_help: "<item> <starting_price>",
		extended_help: "Auction off an item to other users. Points deducted from winner.",
		scopes: ["messages_write", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const embed = require('embed');
const utils = require('utils');

const args = command.suffix.trim().split(/\\s+/);
const price = parseInt(args.pop());
const item = args.join(' ');

if (!item || isNaN(price) || price <= 0) {
	message.reply('❌ Usage: \`auction <item name> <starting price>\`');
	return;
}

const auctionKey = 'auction_' + message.channel.id;
const existing = extension.storage.get(auctionKey);

if (existing && Date.now() - existing.startTime < 300000) {
	message.reply('❌ An auction is already active in this channel!');
	return;
}

const auction = {
	item: item,
	startPrice: price,
	currentBid: price,
	highestBidder: null,
	host: message.author.id,
	startTime: Date.now(),
};

extension.storage.write(auctionKey, auction);

message.reply({
	embeds: [embed.create({
		title: '🔨 Auction Started!',
		description: '**Item:** ' + item + '\\n' +
			'**Starting Price:** ' + utils.format.number(price) + ' points\\n\\n' +
			'Type \`bid <amount>\` to place a bid!\\n' +
			'Auction ends in 5 minutes.',
		color: embed.colors.GOLD,
		footer: { text: 'Hosted by ' + message.author.username },
		timestamp: new Date().toISOString(),
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

	const generateCodeID = (code) => crypto
		.createHash("sha256")
		.update(code)
		.digest("hex")
		.substring(0, 16);

	console.log("🔧 Seeding Batch 2 Extensions...\n");

	for (const ext of extensions) {
		const codeId = generateCodeID(ext.code);

		const existing = await Gallery.findOne({ name: ext.name }).catch(() => null);

		if (existing) {
			console.log(`⚠️  Updating existing extension: ${ext.name}`);
			existing.code_id = codeId;
			const versionIndex = existing.versions.findIndex((v) => v._id === existing.published_version);
			if (versionIndex !== -1) {
				existing.versions[versionIndex].code_id = codeId;
			}
			await existing.save();
		} else {
			const galleryDocument = await Gallery.new({
				name: ext.name,
				description: ext.description,
				level: "gallery",
				state: "gallery",
				owner_id: "system",
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

	console.log("\n🎉 Batch 2 Complete!");
	process.exit(0);
}

seedExtensions().catch((err) => {
	console.error(err);
	process.exit(1);
});
