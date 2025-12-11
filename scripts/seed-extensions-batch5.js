/**
 * Seed script for Batch 5 extensions
 * Run with: node scripts/seed-extensions-batch5.js
 */

const path = require("path");
const fs = require("fs-nextra");

const extensions = [
	{
		name: "Checkers",
		description: "Play checkers against the bot!",
		type: "command",
		key: "checkers",
		usage_help: "[move <from> <to>|status|new]",
		extended_help: "Classic checkers! Move pieces diagonally. Jump to capture. Format: checkers move a3 b4",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const stateKey = 'checkers_' + message.author.id;
let game = extension.storage.get(stateKey);
const args = command.suffix.trim().toLowerCase().split(/\\s+/);
const action = args[0];

function createBoard() {
	const board = Array(8).fill().map(() => Array(8).fill(null));
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 8; c++) {
			if ((r + c) % 2 === 1) board[r][c] = 'b';
		}
	}
	for (let r = 5; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			if ((r + c) % 2 === 1) board[r][c] = 'r';
		}
	}
	return board;
}

function renderBoard(board) {
	const cols = '  a b c d e f g h';
	let str = cols + '\\n';
	for (let r = 0; r < 8; r++) {
		str += (8 - r) + ' ';
		for (let c = 0; c < 8; c++) {
			const p = board[r][c];
			if (p === 'r') str += '🔴';
			else if (p === 'R') str += '🔵';
			else if (p === 'b') str += '⚫';
			else if (p === 'B') str += '⚪';
			else str += ((r + c) % 2 === 1 ? '🟫' : '🟨');
		}
		str += ' ' + (8 - r) + '\\n';
	}
	return str + cols;
}

function parsePos(pos) {
	if (!pos || pos.length !== 2) return null;
	const c = pos.charCodeAt(0) - 97;
	const r = 8 - parseInt(pos[1]);
	if (c < 0 || c > 7 || r < 0 || r > 7) return null;
	return { r, c };
}

if (!game || action === 'new') {
	game = { board: createBoard(), turn: 'r' };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🎮 Checkers',
			description: renderBoard(game.board) + '\\n\\n🔴 You vs ⚫ Bot\\nYour move! \`checkers move a3 b4\`',
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (action === 'status' || !action) {
	message.reply({
		embeds: [embed.create({
			title: '🎮 Checkers',
			description: renderBoard(game.board),
			color: embed.colors.BLUE,
			footer: { text: game.turn === 'r' ? 'Your turn (🔴)' : 'Bot thinking...' },
		})]
	});
	return;
}

if (action === 'move') {
	const from = parsePos(args[1]);
	const to = parsePos(args[2]);
	
	if (!from || !to) {
		message.reply('❌ Invalid move! Format: \`checkers move a3 b4\`');
		return;
	}
	
	const piece = game.board[from.r][from.c];
	if (!piece || !['r', 'R'].includes(piece)) {
		message.reply('❌ No valid piece at that position!');
		return;
	}
	
	const dr = to.r - from.r;
	const dc = Math.abs(to.c - from.c);
	
	if (dc !== 1 && dc !== 2) {
		message.reply('❌ Invalid move distance!');
		return;
	}
	
	game.board[to.r][to.c] = piece;
	game.board[from.r][from.c] = null;
	
	if (dc === 2) {
		const jr = from.r + dr / 2;
		const jc = from.c + (to.c - from.c) / 2;
		game.board[jr][jc] = null;
	}
	
	if (to.r === 0 && piece === 'r') game.board[to.r][to.c] = 'R';
	
	// Simple bot move
	let moved = false;
	for (let r = 0; r < 8 && !moved; r++) {
		for (let c = 0; c < 8 && !moved; c++) {
			const bp = game.board[r][c];
			if (bp === 'b' || bp === 'B') {
				const nr = r + 1;
				for (const nc of [c - 1, c + 1]) {
					if (nc >= 0 && nc < 8 && nr < 8 && !game.board[nr][nc]) {
						game.board[nr][nc] = nr === 7 ? 'B' : bp;
						game.board[r][c] = null;
						moved = true;
						break;
					}
				}
			}
		}
	}
	
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🎮 Checkers',
			description: renderBoard(game.board) + '\\n\\n✅ Move made!' + (moved ? ' Bot moved.' : ''),
			color: embed.colors.GREEN,
		})]
	});
}
`,
	},
	{
		name: "TicTacToe",
		description: "Play Tic-Tac-Toe against the bot!",
		type: "command",
		key: "tictactoe",
		usage_help: "[1-9]",
		extended_help: "Classic 3x3 Tic-Tac-Toe. Choose positions 1-9 (left to right, top to bottom).",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const stateKey = 'ttt_' + message.author.id;
let game = extension.storage.get(stateKey);
const pos = parseInt(command.suffix.trim());

function renderBoard(board) {
	const symbols = { X: '❌', O: '⭕', '': '⬜' };
	let str = '';
	for (let i = 0; i < 9; i++) {
		str += board[i] ? symbols[board[i]] : (i + 1) + '️⃣';
		if ((i + 1) % 3 === 0) str += '\\n';
	}
	return str;
}

function checkWin(board, player) {
	const wins = [
		[0, 1, 2], [3, 4, 5], [6, 7, 8],
		[0, 3, 6], [1, 4, 7], [2, 5, 8],
		[0, 4, 8], [2, 4, 6],
	];
	return wins.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);
}

function botMove(board) {
	// Try to win
	for (let i = 0; i < 9; i++) {
		if (!board[i]) {
			board[i] = 'O';
			if (checkWin(board, 'O')) return i;
			board[i] = '';
		}
	}
	// Block player
	for (let i = 0; i < 9; i++) {
		if (!board[i]) {
			board[i] = 'X';
			if (checkWin(board, 'X')) { board[i] = ''; return i; }
			board[i] = '';
		}
	}
	// Take center or random
	if (!board[4]) return 4;
	const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
	return utils.random.pick(empty);
}

if (!game || isNaN(pos)) {
	game = { board: Array(9).fill(''), turn: 'X' };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '⭕ Tic-Tac-Toe',
			description: renderBoard(game.board) + '\\nYou are ❌. Pick 1-9!',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (pos < 1 || pos > 9 || game.board[pos - 1]) {
	message.reply('❌ Invalid position! Choose an empty spot 1-9.');
	return;
}

game.board[pos - 1] = 'X';

if (checkWin(game.board, 'X')) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🎉 You Win!',
			description: renderBoard(game.board),
			color: embed.colors.SUCCESS,
		})]
	});
	return;
}

if (!game.board.includes('')) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🤝 Draw!',
			description: renderBoard(game.board),
			color: embed.colors.GOLD,
		})]
	});
	return;
}

const botPos = botMove(game.board);
game.board[botPos] = 'O';

if (checkWin(game.board, 'O')) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '😢 Bot Wins!',
			description: renderBoard(game.board),
			color: embed.colors.ERROR,
		})]
	});
	return;
}

extension.storage.write(stateKey, game);

message.reply({
	embeds: [embed.create({
		title: '⭕ Tic-Tac-Toe',
		description: renderBoard(game.board) + '\\nYour turn! Pick 1-9.',
		color: embed.colors.BLUE,
	})]
});
`,
	},
	{
		name: "Music Quiz",
		description: "Guess the song from lyrics!",
		type: "command",
		key: "musicquiz",
		usage_help: "[answer]",
		extended_help: "Guess the song title from a lyrics snippet!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const songs = [
	{ lyrics: "Is this the real life? Is this just fantasy?", answer: "BOHEMIAN RHAPSODY", artist: "Queen" },
	{ lyrics: "Hello, it's me. I was wondering if after all these years...", answer: "HELLO", artist: "Adele" },
	{ lyrics: "We're no strangers to love. You know the rules and so do I", answer: "NEVER GONNA GIVE YOU UP", artist: "Rick Astley" },
	{ lyrics: "Just a small town girl, living in a lonely world", answer: "DON'T STOP BELIEVIN", artist: "Journey" },
	{ lyrics: "I got my mind on my money and my money on my mind", answer: "GIN AND JUICE", artist: "Snoop Dogg" },
	{ lyrics: "Cause baby you're a firework, come on show em what you're worth", answer: "FIREWORK", artist: "Katy Perry" },
	{ lyrics: "We will, we will rock you!", answer: "WE WILL ROCK YOU", artist: "Queen" },
	{ lyrics: "I came in like a wrecking ball", answer: "WRECKING BALL", artist: "Miley Cyrus" },
	{ lyrics: "Hello from the other side", answer: "HELLO", artist: "Adele" },
	{ lyrics: "I'm on the highway to hell", answer: "HIGHWAY TO HELL", artist: "AC/DC" },
];

const stateKey = 'musicquiz_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim().toUpperCase();

if (!game || guess === 'NEW') {
	const song = utils.random.pick(songs);
	game = { song, attempts: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🎵 Music Quiz',
			description: '**Guess the song!**\\n\\n*"' + song.lyrics + '"*',
			color: embed.colors.PURPLE,
			footer: { text: 'Type: musicquiz <song title> | musicquiz hint' },
		})]
	});
	return;
}

if (guess === 'HINT') {
	message.reply('💡 Artist: **' + game.song.artist + '**');
	return;
}

if (!guess) {
	message.reply({
		embeds: [embed.create({
			title: '🎵 Current Quiz',
			description: '*"' + game.song.lyrics + '"*\\nAttempts: ' + game.attempts,
			color: embed.colors.BLUE,
		})]
	});
	return;
}

game.attempts++;

const answer = game.song.answer.replace(/[^A-Z0-9]/g, '');
const userGuess = guess.replace(/[^A-Z0-9]/g, '');

if (userGuess.includes(answer) || answer.includes(userGuess)) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🎉 Correct!',
			description: '**' + game.song.answer + '** by ' + game.song.artist + '\\n\\nGuessed in ' + game.attempts + ' attempts!',
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
		name: "Flag Quiz",
		description: "Identify country flags!",
		type: "command",
		key: "flagquiz",
		usage_help: "[answer]",
		extended_help: "Guess which country the flag belongs to!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const flags = [
	{ emoji: '🇺🇸', country: 'UNITED STATES', alt: ['USA', 'AMERICA'] },
	{ emoji: '🇬🇧', country: 'UNITED KINGDOM', alt: ['UK', 'BRITAIN', 'ENGLAND'] },
	{ emoji: '🇯🇵', country: 'JAPAN', alt: [] },
	{ emoji: '🇫🇷', country: 'FRANCE', alt: [] },
	{ emoji: '🇩🇪', country: 'GERMANY', alt: [] },
	{ emoji: '🇮🇹', country: 'ITALY', alt: [] },
	{ emoji: '🇪🇸', country: 'SPAIN', alt: [] },
	{ emoji: '🇧🇷', country: 'BRAZIL', alt: [] },
	{ emoji: '🇨🇦', country: 'CANADA', alt: [] },
	{ emoji: '🇦🇺', country: 'AUSTRALIA', alt: [] },
	{ emoji: '🇲🇽', country: 'MEXICO', alt: [] },
	{ emoji: '🇰🇷', country: 'SOUTH KOREA', alt: ['KOREA'] },
	{ emoji: '🇷🇺', country: 'RUSSIA', alt: [] },
	{ emoji: '🇨🇳', country: 'CHINA', alt: [] },
	{ emoji: '🇮🇳', country: 'INDIA', alt: [] },
	{ emoji: '🇸🇪', country: 'SWEDEN', alt: [] },
	{ emoji: '🇳🇴', country: 'NORWAY', alt: [] },
	{ emoji: '🇳🇱', country: 'NETHERLANDS', alt: ['HOLLAND'] },
	{ emoji: '🇵🇱', country: 'POLAND', alt: [] },
	{ emoji: '🇹🇷', country: 'TURKEY', alt: [] },
];

const stateKey = 'flagquiz_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim().toUpperCase();

if (!game || guess === 'NEW') {
	const flag = utils.random.pick(flags);
	game = { flag, score: game?.score || 0, streak: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🏳️ Flag Quiz',
			description: 'Which country is this flag?\\n\\n' + flag.emoji + ' ' + flag.emoji + ' ' + flag.emoji,
			color: embed.colors.BLUE,
			footer: { text: 'Score: ' + game.score + ' | Streak: ' + game.streak },
		})]
	});
	return;
}

if (guess === 'SKIP') {
	const answer = game.flag.country;
	game.streak = 0;
	const flag = utils.random.pick(flags);
	game.flag = flag;
	extension.storage.write(stateKey, game);
	
	message.reply('⏭️ Skipped! It was **' + answer + '**\\n\\nNext flag: ' + flag.emoji);
	return;
}

if (!guess) {
	message.reply(game.flag.emoji + ' ' + game.flag.emoji + ' ' + game.flag.emoji + '\\nType: \`flagquiz <country>\`');
	return;
}

const correct = guess === game.flag.country || game.flag.alt.includes(guess);

if (correct) {
	game.score++;
	game.streak++;
	const bonus = game.streak >= 3 ? ' 🔥 ' + game.streak + ' streak!' : '';
	
	const flag = utils.random.pick(flags);
	game.flag = flag;
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '✅ Correct!' + bonus,
			description: 'Next flag:\\n\\n' + flag.emoji + ' ' + flag.emoji + ' ' + flag.emoji,
			color: embed.colors.SUCCESS,
			footer: { text: 'Score: ' + game.score + ' | Streak: ' + game.streak },
		})]
	});
} else {
	game.streak = 0;
	extension.storage.write(stateKey, game);
	message.reply('❌ Wrong! Try again or \`flagquiz skip\`');
}
`,
	},
	{
		name: "Traitor",
		description: "Vote out the traitor among the crew!",
		type: "command",
		key: "traitor",
		usage_help: "[start|join|vote @user]",
		extended_help: "Social deduction! Find and vote out the traitor before they sabotage everything.",
		scopes: ["messages_write", "channels_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const gameKey = 'traitor_' + message.channel.id;
let game = extension.storage.get(gameKey);
const args = command.suffix.trim().split(/\\s+/);
const action = args[0]?.toLowerCase();

if (action === 'start') {
	if (game && game.state === 'playing') {
		message.reply('❌ Game in progress!');
		return;
	}
	
	game = {
		state: 'lobby',
		players: [message.author.id],
		host: message.author.id,
	};
	extension.storage.write(gameKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🔪 Traitor - Lobby',
			description: 'A new game is starting!\\n\\n\`traitor join\` to join\\n\`traitor begin\` to start (host)\\n\\n**Players:** 1 (need 4+)',
			color: embed.colors.PURPLE,
		})]
	});
	return;
}

if (action === 'join') {
	if (!game || game.state !== 'lobby') {
		message.reply('❌ No lobby. Use \`traitor start\`');
		return;
	}
	if (game.players.includes(message.author.id)) {
		message.reply('✅ Already joined!');
		return;
	}
	game.players.push(message.author.id);
	extension.storage.write(gameKey, game);
	message.reply('✅ ' + message.author.username + ' joined! (' + game.players.length + ' players)');
	return;
}

if (action === 'begin') {
	if (!game || game.host !== message.author.id) {
		message.reply('❌ Only the host can start!');
		return;
	}
	if (game.players.length < 4) {
		message.reply('❌ Need 4+ players!');
		return;
	}
	
	const traitorIdx = utils.random.int(0, game.players.length - 1);
	game.state = 'playing';
	game.traitor = game.players[traitorIdx];
	game.votes = {};
	game.round = 1;
	extension.storage.write(gameKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🔪 Game Started!',
			description: 'The traitor has been chosen!\\n\\nDiscuss and vote with \`traitor vote @user\`\\n\\n**Players:** ' + game.players.length,
			color: embed.colors.ERROR,
			footer: { text: 'Round ' + game.round + ' | One traitor among you...' },
		})]
	});
	return;
}

if (action === 'vote' && game?.state === 'playing') {
	if (!game.players.includes(message.author.id)) {
		message.reply('❌ You\\'re not in this game!');
		return;
	}
	
	const mention = command.suffix.match(/<@!?(\\d+)>/);
	if (!mention) {
		message.reply('❌ Vote: \`traitor vote @user\`');
		return;
	}
	
	const target = mention[1];
	if (!game.players.includes(target)) {
		message.reply('❌ That player isn\\'t in the game!');
		return;
	}
	
	game.votes[message.author.id] = target;
	extension.storage.write(gameKey, game);
	
	const voteCount = Object.keys(game.votes).length;
	message.reply('🗳️ Vote recorded! (' + voteCount + '/' + game.players.length + ')');
	
	if (voteCount === game.players.length) {
		const counts = {};
		Object.values(game.votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
		const eliminated = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
		
		const wasTraitor = eliminated === game.traitor;
		extension.storage.write(gameKey, null);
		
		message.reply({
			embeds: [embed.create({
				title: wasTraitor ? '✅ Crew Wins!' : '🔪 Traitor Wins!',
				description: utils.discord.userMention(eliminated) + ' was eliminated!\\n\\n' +
					(wasTraitor ? 'They were the traitor!' : 'They were innocent! The traitor was ' + utils.discord.userMention(game.traitor)),
				color: wasTraitor ? embed.colors.SUCCESS : embed.colors.ERROR,
			})]
		});
	}
	return;
}

if (action === 'status' && game) {
	const voters = Object.keys(game.votes).length;
	message.reply({
		embeds: [embed.create({
			title: '🔪 Traitor - Status',
			description: '**State:** ' + game.state + '\\n**Players:** ' + game.players.length + '\\n**Votes:** ' + voters + '/' + game.players.length,
			color: embed.colors.BLUE,
		})]
	});
	return;
}

message.reply({
	embeds: [embed.create({
		title: '🔪 Traitor',
		description: '**Commands:**\\n\`traitor start\` - Create lobby\\n\`traitor join\` - Join lobby\\n\`traitor begin\` - Start game\\n\`traitor vote @user\` - Vote someone out',
		color: embed.colors.PURPLE,
	})]
});
`,
	},
	{
		name: "Maze",
		description: "Navigate through a text maze!",
		type: "command",
		key: "maze",
		usage_help: "[w|a|s|d|new]",
		extended_help: "Find your way through the maze! w=up, a=left, s=down, d=right",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const mazes = [
	{
		grid: [
			'#########',
			'#S  #   #',
			'### # # #',
			'#   # # #',
			'# ### # #',
			'#     # #',
			'##### # #',
			'#      E#',
			'#########',
		],
		start: { r: 1, c: 1 },
		end: { r: 7, c: 7 },
	},
	{
		grid: [
			'#######',
			'#S#   #',
			'# # # #',
			'#   # #',
			'### # #',
			'#    E#',
			'#######',
		],
		start: { r: 1, c: 1 },
		end: { r: 5, c: 5 },
	},
];

const stateKey = 'maze_' + message.author.id;
let game = extension.storage.get(stateKey);
const dir = command.suffix.trim().toLowerCase();

function renderMaze(maze, pos) {
	let str = '';
	for (let r = 0; r < maze.grid.length; r++) {
		for (let c = 0; c < maze.grid[r].length; c++) {
			if (r === pos.r && c === pos.c) str += '😀';
			else if (r === maze.end.r && c === maze.end.c) str += '🏁';
			else if (maze.grid[r][c] === '#') str += '⬛';
			else str += '⬜';
		}
		str += '\\n';
	}
	return str;
}

if (!game || dir === 'new') {
	const maze = utils.random.pick(mazes);
	game = { maze, pos: { ...maze.start }, moves: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🔲 Maze',
			description: renderMaze(game.maze, game.pos),
			color: embed.colors.BLUE,
			footer: { text: 'Controls: w=up, a=left, s=down, d=right | Reach 🏁!' },
		})]
	});
	return;
}

const moves = { w: [-1, 0], a: [0, -1], s: [1, 0], d: [0, 1] };
if (!moves[dir]) {
	message.reply({
		embeds: [embed.create({
			title: '🔲 Maze',
			description: renderMaze(game.maze, game.pos),
			color: embed.colors.BLUE,
			footer: { text: 'Moves: ' + game.moves + ' | w/a/s/d to move' },
		})]
	});
	return;
}

const [dr, dc] = moves[dir];
const nr = game.pos.r + dr;
const nc = game.pos.c + dc;

if (game.maze.grid[nr]?.[nc] === '#' || !game.maze.grid[nr]) {
	message.reply('🧱 Blocked! Try another direction.');
	return;
}

game.pos = { r: nr, c: nc };
game.moves++;

if (nr === game.maze.end.r && nc === game.maze.end.c) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🎉 Maze Complete!',
			description: renderMaze(game.maze, game.pos) + '\\nCompleted in **' + game.moves + '** moves!',
			color: embed.colors.SUCCESS,
		})]
	});
	return;
}

extension.storage.write(stateKey, game);
message.reply({
	embeds: [embed.create({
		title: '🔲 Maze',
		description: renderMaze(game.maze, game.pos),
		color: embed.colors.BLUE,
		footer: { text: 'Moves: ' + game.moves },
	})]
});
`,
	},
	{
		name: "Tower Climb",
		description: "Climb the tower floor by floor!",
		type: "command",
		key: "tower",
		usage_help: "[climb|rest|status]",
		extended_help: "Roguelike tower climbing! Fight enemies, gain rewards, see how high you can go.",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const economy = require('economy');
const utils = require('utils');
const embed = require('embed');

const enemies = [
	{ name: 'Slime', hp: 20, dmg: 5, reward: 10 },
	{ name: 'Goblin', hp: 30, dmg: 8, reward: 15 },
	{ name: 'Skeleton', hp: 40, dmg: 10, reward: 20 },
	{ name: 'Orc', hp: 50, dmg: 12, reward: 25 },
	{ name: 'Demon', hp: 70, dmg: 15, reward: 35 },
	{ name: 'Dragon', hp: 100, dmg: 20, reward: 50 },
];

const stateKey = 'tower_' + message.author.id;
let game = extension.storage.get(stateKey);
const action = command.arguments[0]?.toLowerCase();

if (!game || action === 'new') {
	game = { floor: 0, hp: 100, maxHp: 100, totalReward: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🗼 Tower Climb',
			description: 'You stand at the base of the tower...\\n\\n❤️ HP: ' + game.hp + '/' + game.maxHp + '\\n🏛️ Floor: ' + game.floor + '\\n\\n\`tower climb\` to ascend!',
			color: embed.colors.PURPLE,
		})]
	});
	return;
}

if (action === 'status' || !action) {
	message.reply({
		embeds: [embed.create({
			title: '🗼 Tower Status',
			description: '❤️ HP: ' + game.hp + '/' + game.maxHp + '\\n🏛️ Floor: ' + game.floor + '\\n💰 Rewards: ' + game.totalReward,
			color: embed.colors.BLUE,
			footer: { text: 'tower climb | tower rest | tower leave' },
		})]
	});
	return;
}

if (action === 'rest') {
	const heal = utils.random.int(10, 25);
	game.hp = Math.min(game.maxHp, game.hp + heal);
	extension.storage.write(stateKey, game);
	message.reply('💤 You rest and recover **' + heal + '** HP! (HP: ' + game.hp + '/' + game.maxHp + ')');
	return;
}

if (action === 'leave') {
	if (game.totalReward > 0) {
		economy.addPoints(message.author.id, game.totalReward, 'Tower rewards');
	}
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🚪 Left the Tower',
			description: 'You escaped with your loot!\\n\\n🏛️ Floors cleared: ' + game.floor + '\\n💰 Rewards: ' + game.totalReward + ' points',
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (action === 'climb') {
	game.floor++;
	const enemyIdx = Math.min(Math.floor(game.floor / 3), enemies.length - 1);
	const enemy = { ...enemies[enemyIdx] };
	enemy.hp += game.floor * 2;
	enemy.dmg += Math.floor(game.floor / 2);
	enemy.reward += game.floor * 2;
	
	// Combat
	while (enemy.hp > 0 && game.hp > 0) {
		const playerDmg = utils.random.int(10, 20);
		enemy.hp -= playerDmg;
		if (enemy.hp > 0) {
			game.hp -= enemy.dmg;
		}
	}
	
	if (game.hp <= 0) {
		extension.storage.write(stateKey, null);
		message.reply({
			embeds: [embed.create({
				title: '💀 Defeated!',
				description: 'The ' + enemy.name + ' was too strong...\\n\\n🏛️ Reached floor: ' + game.floor + '\\n💰 Rewards lost!',
				color: embed.colors.ERROR,
			})]
		});
		return;
	}
	
	game.totalReward += enemy.reward;
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '⚔️ Floor ' + game.floor + ' - Victory!',
			description: 'Defeated ' + enemy.name + '!\\n\\n❤️ HP: ' + game.hp + '/' + game.maxHp +
			'\\n💰 +' + enemy.reward + ' (Total: ' + game.totalReward + ')\\n\\n*Continue or leave?*',
			color: embed.colors.SUCCESS,
			footer: { text: 'tower climb | tower rest | tower leave' },
		})]
	});
}
`,
	},
	{
		name: "Hot Take",
		description: "Get controversial discussion topics!",
		type: "command",
		key: "hottake",
		usage_help: "[category]",
		extended_help: "Generate spicy debate topics to discuss with your friends!",
		scopes: ["messages_write"],
		timeout: 3000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');
const embed = require('embed');

const takes = {
	food: [
		"Pineapple on pizza is actually good",
		"Cereal is a soup",
		"Hot dogs are sandwiches",
		"Water is the best drink, no exceptions",
		"Breakfast food is better for dinner",
		"Ketchup on eggs is acceptable",
		"Ranch goes with everything",
		"Burnt food has superior flavor",
	],
	gaming: [
		"Mobile games are real games",
		"Graphics don't matter, gameplay does",
		"Easy mode is valid",
		"Multiplayer games are overrated",
		"Old games were harder, not better",
		"DLC is fine if done right",
		"Battle royales peaked years ago",
		"Console vs PC debates are pointless",
	],
	life: [
		"Mornings are better than nights",
		"Cats are better than dogs",
		"Working from home is superior",
		"Social media does more harm than good",
		"Books are better than movies",
		"Summer is the worst season",
		"Being alone is underrated",
		"Small talk is actually important",
	],
	media: [
		"Remakes are usually unnecessary",
		"The book is always better",
		"Subtitles should always be on",
		"Spoilers don't ruin movies",
		"Critics are out of touch",
		"Prequels are harder to make than sequels",
		"Animation is an art form, not a genre",
		"Reboots can be better than originals",
	],
};

const category = command.suffix.trim().toLowerCase();
const categories = Object.keys(takes);

if (category && !categories.includes(category)) {
	message.reply('❌ Categories: ' + categories.join(', '));
	return;
}

const pool = category ? takes[category] : Object.values(takes).flat();
const take = utils.random.pick(pool);

message.reply({
	embeds: [embed.create({
		title: '🔥 Hot Take',
		description: '**' + take + '**\\n\\nAgree or disagree? 👍 👎',
		color: embed.colors.ERROR,
		footer: { text: category || 'Random | Categories: food, gaming, life, media' },
	})]
});
`,
	},
	{
		name: "Caption Battle",
		description: "Caption contest! Best caption wins.",
		type: "command",
		key: "caption",
		usage_help: "[submit <caption>|vote <number>|status]",
		extended_help: "Submit funny captions and vote for the best one!",
		scopes: ["messages_write", "channels_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const prompts = [
	"When you realize tomorrow is Monday...",
	"That face when the WiFi disconnects...",
	"Me explaining my hobbies to normal people...",
	"POV: You just woke up from a nap...",
	"When the food arrives at the restaurant...",
	"My last brain cell during exams...",
	"When someone says 'we need to talk'...",
	"Me pretending to understand the conversation...",
];

const gameKey = 'caption_' + message.channel.id;
let game = extension.storage.get(gameKey);
const args = command.suffix.trim().split(/\\s+/);
const action = args[0]?.toLowerCase();

if (action === 'start' || action === 'new') {
	const prompt = utils.random.pick(prompts);
	game = { prompt, captions: [], votes: {}, phase: 'submit' };
	extension.storage.write(gameKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '📸 Caption Battle!',
			description: '**Prompt:**\\n*"' + prompt + '"*\\n\\nSubmit your caption with:\\n\`caption submit Your funny caption here\`',
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (!game) {
	message.reply('📸 No active caption battle. Start one with \`caption start\`');
	return;
}

if (action === 'submit' && game.phase === 'submit') {
	const caption = args.slice(1).join(' ');
	if (!caption || caption.length < 3) {
		message.reply('❌ Please provide a caption!');
		return;
	}
	if (caption.length > 150) {
		message.reply('❌ Caption too long! Max 150 characters.');
		return;
	}
	if (game.captions.some(c => c.author === message.author.id)) {
		message.reply('❌ You already submitted a caption!');
		return;
	}
	
	game.captions.push({ text: caption, author: message.author.id, votes: 0 });
	extension.storage.write(gameKey, game);
	
	message.reply('✅ Caption submitted! (' + game.captions.length + ' total)');
	return;
}

if (action === 'voting' && game.phase === 'submit') {
	if (game.captions.length < 2) {
		message.reply('❌ Need at least 2 captions to vote!');
		return;
	}
	game.phase = 'vote';
	extension.storage.write(gameKey, game);
	
	const list = game.captions.map((c, i) => (i + 1) + '. "' + c.text + '"').join('\\n');
	message.reply({
		embeds: [embed.create({
			title: '🗳️ Voting Time!',
			description: '**Prompt:** "' + game.prompt + '"\\n\\n' + list + '\\n\\nVote: \`caption vote <number>\`',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (action === 'vote' && game.phase === 'vote') {
	const num = parseInt(args[1]) - 1;
	if (isNaN(num) || num < 0 || num >= game.captions.length) {
		message.reply('❌ Invalid choice! Pick 1-' + game.captions.length);
		return;
	}
	if (game.captions[num].author === message.author.id) {
		message.reply('❌ You can\\'t vote for yourself!');
		return;
	}
	if (game.votes[message.author.id] !== undefined) {
		message.reply('❌ You already voted!');
		return;
	}
	
	game.votes[message.author.id] = num;
	game.captions[num].votes++;
	extension.storage.write(gameKey, game);
	
	message.reply('✅ Vote recorded!');
	return;
}

if (action === 'end') {
	const winner = game.captions.sort((a, b) => b.votes - a.votes)[0];
	extension.storage.write(gameKey, null);
	
	message.reply({
		embeds: [embed.create({
			title: '🏆 Winner!',
			description: '**"' + winner.text + '"**\\n\\n' + winner.votes + ' votes!\\nBy: ' + utils.discord.userMention(winner.author),
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (action === 'status' || !action) {
	message.reply({
		embeds: [embed.create({
			title: '📸 Caption Battle',
			description: '**Prompt:** "' + game.prompt + '"\\n**Phase:** ' + game.phase + '\\n**Captions:** ' + game.captions.length,
			color: embed.colors.BLUE,
		})]
	});
}
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

	console.log("🔧 Seeding Batch 5 Extensions...\n");

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

	console.log("\n🎉 Batch 5 Complete!");
	process.exit(0);
}

seedExtensions().catch((err) => {
	console.error(err);
	process.exit(1);
});
