/**
 * Seed script to add pre-built extensions to the database
 * Run with: node scripts/seed-extensions.js
 */

const path = require("path");
const fs = require("fs-nextra");

// Extension definitions
const extensions = [
	{
		name: "Connect 4",
		description: "Play Connect 4 against another member! Drop pieces into a 7x6 grid and try to get 4 in a row.",
		type: "command",
		key: "connect4",
		usage_help: "[@opponent]",
		extended_help: "Challenge someone to Connect 4! Use reactions to drop pieces. First to get 4 in a row wins!",
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const message = require('message');
const extension = require('extension');

const COLS = 7;
const ROWS = 6;
const EMPTY = '⚫';
const P1 = '🔴';
const P2 = '🟡';
const NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

// Initialize empty board
function createBoard() {
	const board = [];
	for (let r = 0; r < ROWS; r++) {
		board.push(new Array(COLS).fill(EMPTY));
	}
	return board;
}

// Render board as string
function renderBoard(board) {
	let str = NUMBERS.join('') + '\\n';
	for (let r = 0; r < ROWS; r++) {
		str += board[r].join('') + '\\n';
	}
	return str;
}

// Check for winner
function checkWinner(board, piece) {
	// Horizontal
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c <= COLS - 4; c++) {
			if (board[r][c] === piece && board[r][c+1] === piece && 
				board[r][c+2] === piece && board[r][c+3] === piece) return true;
		}
	}
	// Vertical
	for (let c = 0; c < COLS; c++) {
		for (let r = 0; r <= ROWS - 4; r++) {
			if (board[r][c] === piece && board[r+1][c] === piece && 
				board[r+2][c] === piece && board[r+3][c] === piece) return true;
		}
	}
	// Diagonal (down-right)
	for (let r = 0; r <= ROWS - 4; r++) {
		for (let c = 0; c <= COLS - 4; c++) {
			if (board[r][c] === piece && board[r+1][c+1] === piece && 
				board[r+2][c+2] === piece && board[r+3][c+3] === piece) return true;
		}
	}
	// Diagonal (up-right)
	for (let r = 3; r < ROWS; r++) {
		for (let c = 0; c <= COLS - 4; c++) {
			if (board[r][c] === piece && board[r-1][c+1] === piece && 
				board[r-2][c+2] === piece && board[r-3][c+3] === piece) return true;
		}
	}
	return false;
}

const board = createBoard();
const boardStr = renderBoard(board);

message.reply({
	embeds: [{
		title: '🎮 Connect 4',
		description: boardStr + '\\n\\nReact with a number (1-7) to drop your piece!\\n' +
			P1 + ' ' + message.author.username + ' vs ' + P2 + ' Opponent\\n\\n' +
			'*This is a preview - full game requires reaction collectors*',
		color: 0x3498db,
		footer: { text: 'First to get 4 in a row wins!' }
	}]
});
`
	},
	{
		name: "Rock Paper Scissors",
		description: "Play Rock Paper Scissors against the bot or another user!",
		type: "command",
		key: "rps",
		usage_help: "<rock|paper|scissors> [@opponent]",
		extended_help: "Play RPS! Use rock, paper, or scissors. Mention someone to challenge them!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const choices = ['rock', 'paper', 'scissors'];
const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
const suffix = command.suffix.toLowerCase().trim();

// Parse user choice
let userChoice = null;
for (const c of choices) {
	if (suffix.startsWith(c)) {
		userChoice = c;
		break;
	}
}

if (!userChoice) {
	message.reply({
		embeds: [{
			title: '✂️ Rock Paper Scissors',
			description: 'Usage: \`' + command.prefix + command.key + ' <rock|paper|scissors>\`\\n\\n' +
				'🪨 **Rock** beats Scissors\\n' +
				'📄 **Paper** beats Rock\\n' +
				'✂️ **Scissors** beats Paper',
			color: 0x9b59b6
		}]
	});
} else {
	// Bot makes choice
	const botChoice = choices[Math.floor(Math.random() * 3)];
	
	let result, color;
	if (userChoice === botChoice) {
		result = "It's a tie! 🤝";
		color = 0xf39c12;
	} else if (
		(userChoice === 'rock' && botChoice === 'scissors') ||
		(userChoice === 'paper' && botChoice === 'rock') ||
		(userChoice === 'scissors' && botChoice === 'paper')
	) {
		result = 'You win! 🎉';
		color = 0x2ecc71;
	} else {
		result = 'You lose! 😢';
		color = 0xe74c3c;
	}
	
	message.reply({
		embeds: [{
			title: '✂️ Rock Paper Scissors',
			description: 
				'**You:** ' + emojis[userChoice] + ' ' + userChoice + '\\n' +
				'**Bot:** ' + emojis[botChoice] + ' ' + botChoice + '\\n\\n' +
				'**' + result + '**',
			color: color
		}]
	});
}
`
	},
	{
		name: "Truth or Dare",
		description: "Get random truth questions or dare challenges for party games!",
		type: "command",
		key: "tod",
		usage_help: "<truth|dare>",
		extended_help: "Get a random truth question or dare challenge. Great for party games!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const truths = [
	"What's the most embarrassing thing you've ever done?",
	"What's a secret you've never told anyone?",
	"What's the biggest lie you've ever told?",
	"Who was your first crush?",
	"What's your biggest fear?",
	"What's the worst date you've ever been on?",
	"Have you ever cheated on a test?",
	"What's your most embarrassing social media moment?",
	"What's the weirdest dream you've ever had?",
	"What's something you pretend to hate but actually love?",
	"What's the most childish thing you still do?",
	"What's the worst gift you've ever received?",
	"Have you ever blamed something on someone else?",
	"What's your guilty pleasure TV show?",
	"What's the longest you've gone without showering?",
	"What's the most trouble you've been in?",
	"Have you ever had a crush on a friend's partner?",
	"What's the most embarrassing thing in your room?",
	"What's the worst thing you've said to someone?",
	"What's your biggest regret?"
];

const dares = [
	"Do your best impression of another player!",
	"Send a funny selfie in the chat!",
	"Speak in an accent for the next 3 messages!",
	"Share the last photo in your camera roll!",
	"Let someone else send a message from your account!",
	"Change your nickname to something embarrassing for 10 minutes!",
	"Do 10 pushups right now!",
	"Sing the chorus of your favorite song!",
	"Call someone and tell them you love them!",
	"Post an embarrassing story about yourself!",
	"Try to lick your elbow!",
	"Talk without using the letter 'e' for 5 minutes!",
	"Do your best dance move on video!",
	"Speak only in questions for the next 5 minutes!",
	"Make up a short rap about another player!",
	"Hold your breath for 30 seconds!",
	"Tell a joke that makes everyone laugh!",
	"Act like a chicken for 30 seconds!",
	"Say the alphabet backwards!",
	"Do your best celebrity impression!"
];

const suffix = command.suffix.toLowerCase().trim();
const isTruth = suffix === 'truth' || suffix === 't';
const isDare = suffix === 'dare' || suffix === 'd';

if (!isTruth && !isDare) {
	message.reply({
		embeds: [{
			title: '🎭 Truth or Dare',
			description: 'Usage: \`' + command.prefix + command.key + ' <truth|dare>\`\\n\\n' +
				'🤔 **truth** - Get a truth question\\n' +
				'😈 **dare** - Get a dare challenge',
			color: 0xe91e63
		}]
	});
} else if (isTruth) {
	const truth = truths[Math.floor(Math.random() * truths.length)];
	message.reply({
		embeds: [{
			title: '🤔 Truth',
			description: truth,
			color: 0x3498db,
			footer: { text: 'Answer honestly!' }
		}]
	});
} else {
	const dare = dares[Math.floor(Math.random() * dares.length)];
	message.reply({
		embeds: [{
			title: '😈 Dare',
			description: dare,
			color: 0xe74c3c,
			footer: { text: 'No chickening out!' }
		}]
	});
}
`
	},
	{
		name: "Would You Rather",
		description: "Get random 'Would You Rather' questions to spark conversations!",
		type: "command",
		key: "wyr",
		usage_help: "",
		extended_help: "Get a random Would You Rather question. React to vote!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');

const questions = [
	["Be able to fly", "Be able to read minds"],
	["Have unlimited money", "Have unlimited time"],
	["Be famous", "Be powerful"],
	["Live in the past", "Live in the future"],
	["Be a superhero", "Be a supervillain"],
	["Never use social media again", "Never watch TV/movies again"],
	["Have no internet", "Have no AC/heating"],
	["Be the funniest person", "Be the smartest person"],
	["Only eat pizza forever", "Never eat pizza again"],
	["Have super strength", "Have super speed"],
	["Be invisible", "Be able to teleport"],
	["Know how you die", "Know when you die"],
	["Have free WiFi everywhere", "Have free coffee everywhere"],
	["Be a famous musician", "Be a famous actor"],
	["Live without music", "Live without movies"],
	["Be 4 feet tall", "Be 8 feet tall"],
	["Control fire", "Control water"],
	["Speak every language", "Play every instrument"],
	["Have a pause button for life", "Have a rewind button for life"],
	["Be rich but alone", "Be poor but with loved ones"],
	["Always be cold", "Always be hot"],
	["Only text", "Only call"],
	["Have a personal chef", "Have a personal driver"],
	["Live in a treehouse", "Live in a cave"],
	["Be a wizard", "Be a Jedi"]
];

const q = questions[Math.floor(Math.random() * questions.length)];

message.reply({
	embeds: [{
		title: '🤷 Would You Rather...',
		description: '🅰️ **' + q[0] + '**\\n\\nor\\n\\n🅱️ **' + q[1] + '**',
		color: 0x9b59b6,
		footer: { text: 'React with 🅰️ or 🅱️ to vote!' }
	}]
});
`
	},
	{
		name: "Never Have I Ever",
		description: "Get random 'Never Have I Ever' statements for party games!",
		type: "command",
		key: "nhie",
		usage_help: "",
		extended_help: "Get a random Never Have I Ever statement. Great for getting to know people!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');

const statements = [
	"Never have I ever been on TV",
	"Never have I ever gone skydiving",
	"Never have I ever lied to get out of work",
	"Never have I ever met a celebrity",
	"Never have I ever broken a bone",
	"Never have I ever gone skinny dipping",
	"Never have I ever been in a food fight",
	"Never have I ever cried during a movie",
	"Never have I ever sung karaoke",
	"Never have I ever been in a car accident",
	"Never have I ever stayed up for 24 hours",
	"Never have I ever laughed so hard I cried",
	"Never have I ever had a surprise party",
	"Never have I ever been on a blind date",
	"Never have I ever traveled alone",
	"Never have I ever eaten an entire pizza by myself",
	"Never have I ever faked being sick",
	"Never have I ever been in a physical fight",
	"Never have I ever gone viral on social media",
	"Never have I ever walked into a glass door",
	"Never have I ever been in love",
	"Never have I ever ghosted someone",
	"Never have I ever regifted a present",
	"Never have I ever forgotten someone's name right after meeting them",
	"Never have I ever pretended to know a song"
];

const statement = statements[Math.floor(Math.random() * statements.length)];

message.reply({
	embeds: [{
		title: '🙈 Never Have I Ever',
		description: '**' + statement + '**',
		color: 0xf39c12,
		footer: { text: 'React if you HAVE done it!' }
	}]
});
`
	},
	{
		name: "This or That",
		description: "Quick-fire choice questions to learn preferences!",
		type: "command",
		key: "thisorthat",
		usage_help: "",
		extended_help: "Get a random This or That question. Quick choices reveal personality!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');

const questions = [
	["Dogs", "Cats"],
	["Morning", "Night"],
	["Coffee", "Tea"],
	["Summer", "Winter"],
	["Beach", "Mountains"],
	["Books", "Movies"],
	["Sweet", "Savory"],
	["Android", "iPhone"],
	["PC", "Console"],
	["Texting", "Calling"],
	["City", "Countryside"],
	["Rain", "Sun"],
	["Netflix", "YouTube"],
	["Early bird", "Night owl"],
	["Cooking", "Ordering in"],
	["Marvel", "DC"],
	["Pizza", "Burgers"],
	["Chocolate", "Vanilla"],
	["Introvert", "Extrovert"],
	["Adventure", "Relaxation"],
	["Past", "Future"],
	["Fame", "Fortune"],
	["Love", "Career"],
	["Window seat", "Aisle seat"],
	["Hot food", "Cold food"]
];

const q = questions[Math.floor(Math.random() * questions.length)];

message.reply({
	embeds: [{
		title: '⚡ This or That',
		description: '**' + q[0] + '** or **' + q[1] + '**?',
		color: 0x1abc9c,
		footer: { text: 'No "both" or "neither" allowed!' }
	}]
});
`
	},
	{
		name: "8 Ball Advanced",
		description: "Ask the magic 8-ball a question with more variety!",
		type: "command",
		key: "8ball2",
		usage_help: "<question>",
		extended_help: "Ask a yes/no question and receive mystic wisdom from the 8-ball!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const positive = [
	"It is certain.", "It is decidedly so.", "Without a doubt.",
	"Yes definitely.", "You may rely on it.", "As I see it, yes.",
	"Most likely.", "Outlook good.", "Yes.", "Signs point to yes.",
	"Absolutely!", "100%!", "The stars align in your favor.",
	"Fortune smiles upon you.", "All signs point to yes!"
];

const neutral = [
	"Reply hazy, try again.", "Ask again later.",
	"Better not tell you now.", "Cannot predict now.",
	"Concentrate and ask again.", "The crystal ball is foggy...",
	"Perhaps...", "The answer is unclear.", "Fate has not decided.",
	"The spirits are undecided."
];

const negative = [
	"Don't count on it.", "My reply is no.", "My sources say no.",
	"Outlook not so good.", "Very doubtful.", "Absolutely not.",
	"The answer is a resounding no.", "Not in a million years.",
	"I wouldn't bet on it.", "The signs say no.",
	"That's a hard no.", "Nope.", "Not gonna happen."
];

const question = command.suffix.trim();

if (!question) {
	message.reply({
		embeds: [{
			title: '🎱 Magic 8-Ball',
			description: 'You must ask a question!\\n\\nUsage: \`' + command.prefix + command.key + ' Will I win the lottery?\`',
			color: 0x2c3e50
		}]
	});
} else {
	const allAnswers = [...positive, ...neutral, ...negative];
	const answer = allAnswers[Math.floor(Math.random() * allAnswers.length)];
	
	let color = 0xf39c12;
	if (positive.includes(answer)) color = 0x2ecc71;
	else if (negative.includes(answer)) color = 0xe74c3c;
	
	message.reply({
		embeds: [{
			title: '🎱 Magic 8-Ball',
			description: '**Q:** ' + question + '\\n\\n**A:** ' + answer,
			color: color,
			footer: { text: 'The 8-ball has spoken!' }
		}]
	});
}
`
	},
	{
		name: "Coin Flip",
		description: "Flip a coin for quick decisions!",
		type: "command",
		key: "flip",
		usage_help: "",
		extended_help: "Flip a coin and get heads or tails. Simple decision maker!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');

const isHeads = Math.random() < 0.5;
const result = isHeads ? 'Heads' : 'Tails';
const emoji = isHeads ? '👑' : '🦅';

message.reply({
	embeds: [{
		title: '🪙 Coin Flip',
		description: emoji + ' **' + result + '!**',
		color: isHeads ? 0xf1c40f : 0x95a5a6,
		footer: { text: 'The coin has spoken!' }
	}]
});
`
	},
	{
		name: "Dice Roll",
		description: "Roll dice with custom sides and quantities!",
		type: "command",
		key: "roll",
		usage_help: "[XdY] (e.g., 2d6, 1d20)",
		extended_help: "Roll dice! Use format XdY where X is number of dice and Y is sides. Default: 1d6",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

let numDice = 1;
let sides = 6;

const input = command.suffix.toLowerCase().trim();
if (input) {
	const match = input.match(/^(\\d+)?d(\\d+)$/);
	if (match) {
		numDice = parseInt(match[1]) || 1;
		sides = parseInt(match[2]) || 6;
	} else if (!isNaN(parseInt(input))) {
		sides = parseInt(input);
	}
}

// Limits
numDice = Math.min(Math.max(numDice, 1), 20);
sides = Math.min(Math.max(sides, 2), 1000);

const rolls = [];
let total = 0;
for (let i = 0; i < numDice; i++) {
	const roll = Math.floor(Math.random() * sides) + 1;
	rolls.push(roll);
	total += roll;
}

const diceEmoji = '🎲';
let description = diceEmoji + ' Rolling **' + numDice + 'd' + sides + '**\\n\\n';

if (numDice === 1) {
	description += '**Result:** ' + rolls[0];
} else {
	description += '**Rolls:** ' + rolls.join(', ') + '\\n';
	description += '**Total:** ' + total;
}

message.reply({
	embeds: [{
		title: '🎲 Dice Roll',
		description: description,
		color: 0x9b59b6,
		footer: { text: 'May luck be on your side!' }
	}]
});
`
	},
	{
		name: "Random Number",
		description: "Generate a random number between two values!",
		type: "command",
		key: "random",
		usage_help: "[min] [max]",
		extended_help: "Generate a random number. Default: 1-100. Specify min and max for custom range.",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

let min = 1;
let max = 100;

const args = command.suffix.trim().split(/\\s+/).filter(a => a);
if (args.length >= 2) {
	min = parseInt(args[0]) || 1;
	max = parseInt(args[1]) || 100;
} else if (args.length === 1) {
	max = parseInt(args[0]) || 100;
}

if (min > max) {
	const temp = min;
	min = max;
	max = temp;
}

const result = Math.floor(Math.random() * (max - min + 1)) + min;

message.reply({
	embeds: [{
		title: '🔢 Random Number',
		description: '**Range:** ' + min + ' - ' + max + '\\n\\n**Result:** ' + result,
		color: 0x3498db
	}]
});
`
	},
	{
		name: "Team Picker",
		description: "Randomly split mentioned users into teams!",
		type: "command",
		key: "teams",
		usage_help: "[number of teams] @user1 @user2 ...",
		extended_help: "Randomly divide mentioned users into teams. Default: 2 teams.",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const mentions = message.mentions;
const args = command.suffix.trim().split(/\\s+/);

let numTeams = 2;
if (args[0] && !isNaN(parseInt(args[0]))) {
	numTeams = parseInt(args[0]);
}

if (mentions.length < 2) {
	message.reply({
		embeds: [{
			title: '👥 Team Picker',
			description: 'Mention at least 2 users to create teams!\\n\\n' +
				'Usage: \`' + command.prefix + command.key + ' [number of teams] @user1 @user2 @user3...\`',
			color: 0xe74c3c
		}]
	});
} else {
	numTeams = Math.min(Math.max(numTeams, 2), mentions.length);
	
	// Shuffle mentions
	const shuffled = [...mentions].sort(() => Math.random() - 0.5);
	
	// Distribute into teams
	const teams = [];
	for (let i = 0; i < numTeams; i++) {
		teams.push([]);
	}
	shuffled.forEach((user, i) => {
		teams[i % numTeams].push(user);
	});
	
	let description = '';
	const teamEmojis = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '🟤'];
	teams.forEach((team, i) => {
		const emoji = teamEmojis[i % teamEmojis.length];
		description += emoji + ' **Team ' + (i + 1) + '**\\n';
		description += team.map(u => '• ' + u.username).join('\\n');
		description += '\\n\\n';
	});
	
	message.reply({
		embeds: [{
			title: '👥 Team Picker',
			description: description,
			color: 0x2ecc71,
			footer: { text: 'Teams randomly generated!' }
		}]
	});
}
`
	},
	{
		name: "Countdown Timer",
		description: "Create a countdown message for events!",
		type: "command", 
		key: "countdown",
		usage_help: "<time> [event name]",
		extended_help: "Create a countdown! Use formats like: 30s, 5m, 2h, 1d. Example: countdown 30m Pizza time!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const args = command.suffix.trim().split(/\\s+/);
const timeArg = args[0] || '';
const eventName = args.slice(1).join(' ') || 'Countdown';

// Parse time
let seconds = 0;
const timeMatch = timeArg.match(/^(\\d+)([smhd])$/i);

if (!timeMatch) {
	message.reply({
		embeds: [{
			title: '⏰ Countdown Timer',
			description: 'Invalid time format!\\n\\n' +
				'Usage: \`' + command.prefix + command.key + ' <time> [event]\`\\n\\n' +
				'**Time formats:**\\n' +
				'• \`30s\` - 30 seconds\\n' +
				'• \`5m\` - 5 minutes\\n' +
				'• \`2h\` - 2 hours\\n' +
				'• \`1d\` - 1 day',
			color: 0xe74c3c
		}]
	});
} else {
	const value = parseInt(timeMatch[1]);
	const unit = timeMatch[2].toLowerCase();
	
	switch (unit) {
		case 's': seconds = value; break;
		case 'm': seconds = value * 60; break;
		case 'h': seconds = value * 3600; break;
		case 'd': seconds = value * 86400; break;
	}
	
	// Calculate end time
	const endTime = new Date(Date.now() + seconds * 1000);
	const endTimestamp = Math.floor(endTime.getTime() / 1000);
	
	message.reply({
		embeds: [{
			title: '⏰ ' + eventName,
			description: '**Ends:** <t:' + endTimestamp + ':R>\\n' +
				'**At:** <t:' + endTimestamp + ':F>',
			color: 0x3498db,
			footer: { text: 'Set by ' + message.author.username }
		}]
	});
}
`
	},
	{
		name: "User Stats",
		description: "View statistics about a user stored by extensions!",
		type: "command",
		key: "userstats",
		usage_help: "[@user]",
		extended_help: "View stats for yourself or mentioned user. Stats are stored per-server.",
		scopes: ["members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const extension = require('extension');

const target = message.mentions[0] || message.author;
const statsKey = 'stats_' + target.id;
let stats = extension.storage.get(statsKey);

if (!stats) {
	stats = { games_played: 0, messages: 0, commands: 0 };
}

message.reply({
	embeds: [{
		title: '📊 User Stats',
		description: '**User:** ' + target.username,
		fields: [
			{ name: '🎮 Games Played', value: String(stats.games_played || 0), inline: true },
			{ name: '💬 Messages', value: String(stats.messages || 0), inline: true },
			{ name: '⚡ Commands', value: String(stats.commands || 0), inline: true }
		],
		color: 0x9b59b6,
		thumbnail: { url: target.avatarURL || '' }
	}]
});
`
	},
	{
		name: "Quote of the Day",
		description: "Get an inspiring or funny quote!",
		type: "command",
		key: "quote",
		usage_help: "",
		extended_help: "Get a random inspirational, funny, or thought-provoking quote!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');

const quotes = [
	{ text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
	{ text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
	{ text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
	{ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
	{ text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
	{ text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
	{ text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
	{ text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
	{ text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
	{ text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
	{ text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
	{ text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
	{ text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
	{ text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
	{ text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
	{ text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
	{ text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
	{ text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
	{ text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
	{ text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" }
];

const quote = quotes[Math.floor(Math.random() * quotes.length)];

message.reply({
	embeds: [{
		description: '*"' + quote.text + '"*\\n\\n— **' + quote.author + '**',
		color: 0x3498db,
		footer: { text: '💭 Quote of the Day' }
	}]
});
`
	},
	{
		name: "Fact Generator",
		description: "Learn random interesting facts!",
		type: "command",
		key: "fact",
		usage_help: "",
		extended_help: "Get a random interesting fact to impress your friends!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');

const facts = [
	"Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible!",
	"A group of flamingos is called a 'flamboyance'.",
	"Octopuses have three hearts and blue blood.",
	"Bananas are berries, but strawberries aren't.",
	"The shortest war in history lasted 38 to 45 minutes between Britain and Zanzibar.",
	"Cows have best friends and get stressed when separated.",
	"A jiffy is an actual unit of time: 1/100th of a second.",
	"The inventor of the Pringles can is buried in one.",
	"Scotland's national animal is the unicorn.",
	"There are more possible chess games than atoms in the observable universe.",
	"Sharks are older than trees.",
	"The moon has moonquakes.",
	"A day on Venus is longer than its year.",
	"Cleopatra lived closer to the moon landing than to the construction of the Great Pyramid.",
	"The human brain uses the same amount of power as a 10-watt light bulb.",
	"Dolphins have names for each other.",
	"Wombat poop is cube-shaped.",
	"The Eiffel Tower can grow 6 inches taller in summer due to heat expansion.",
	"A single cloud can weigh more than 1 million pounds.",
	"The first computer programmer was a woman named Ada Lovelace.",
	"Your nose can remember 50,000 different scents.",
	"Hot water freezes faster than cold water (Mpemba effect).",
	"The longest hiccuping spree lasted 68 years.",
	"A snail can sleep for 3 years.",
	"The fingerprints of koalas are nearly identical to humans."
];

const fact = facts[Math.floor(Math.random() * facts.length)];

message.reply({
	embeds: [{
		title: '💡 Did You Know?',
		description: fact,
		color: 0xf39c12,
		footer: { text: 'Random Fact Generator' }
	}]
});
`
	},
	{
		name: "Mood Tracker",
		description: "Log and track your daily mood!",
		type: "command",
		key: "mood",
		usage_help: "<happy|sad|angry|tired|excited|neutral> [note]",
		extended_help: "Track your mood over time. Add optional notes to remember why!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');

const moods = {
	happy: { emoji: '😊', color: 0x2ecc71, name: 'Happy' },
	sad: { emoji: '😢', color: 0x3498db, name: 'Sad' },
	angry: { emoji: '😠', color: 0xe74c3c, name: 'Angry' },
	tired: { emoji: '😴', color: 0x95a5a6, name: 'Tired' },
	excited: { emoji: '🤩', color: 0xf39c12, name: 'Excited' },
	neutral: { emoji: '😐', color: 0x9b59b6, name: 'Neutral' }
};

const args = command.suffix.trim().split(/\\s+/);
const moodArg = args[0]?.toLowerCase();
const note = args.slice(1).join(' ');

if (!moodArg || !moods[moodArg]) {
	const moodList = Object.entries(moods).map(([k, v]) => v.emoji + ' \`' + k + '\`').join('\\n');
	message.reply({
		embeds: [{
			title: '🎭 Mood Tracker',
			description: 'Log how you\\'re feeling!\\n\\n**Available moods:**\\n' + moodList + '\\n\\n' +
				'Usage: \`' + command.prefix + command.key + ' <mood> [optional note]\`',
			color: 0x9b59b6
		}]
	});
} else {
	const mood = moods[moodArg];
	const timestamp = Math.floor(Date.now() / 1000);
	
	message.reply({
		embeds: [{
			title: mood.emoji + ' Mood Logged',
			description: '**Feeling:** ' + mood.name + '\\n' +
				(note ? '**Note:** ' + note + '\\n' : '') +
				'**When:** <t:' + timestamp + ':R>',
			color: mood.color,
			footer: { text: 'Logged by ' + message.author.username }
		}]
	});
}
`
	},
	// ==================== NEW BATCH ====================
	{
		name: "Akinator",
		description: "Play the famous Akinator guessing game! Think of a character and Akinator will try to guess who it is.",
		type: "command",
		key: "akinator",
		usage_help: "[start]",
		extended_help: "Start an Akinator game where you think of a character (real or fictional) and answer yes/no questions. Akinator will try to guess who you're thinking of!",
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const message = require('message');
const extension = require('extension');

// Akinator-style questions for guessing
const questions = [
	"Is your character real (not fictional)?",
	"Is your character male?",
	"Is your character from a video game?",
	"Is your character from an anime/manga?",
	"Is your character a superhero?",
	"Is your character alive today?",
	"Is your character American?",
	"Is your character a musician?",
	"Is your character an actor/actress?",
	"Is your character from a movie?"
];

const randomQ = questions[Math.floor(Math.random() * questions.length)];

message.reply({
	embeds: [{
		title: '🧞 Akinator',
		description: '**Think of a character...** (real or fictional)\\n\\n' +
			'I will ask you questions to guess who you\\'re thinking of!\\n\\n' +
			'**Question:** ' + randomQ + '\\n\\n' +
			'React with:\\n✅ Yes | ❌ No | 🤷 Don\\'t Know | 👍 Probably Yes | 👎 Probably No',
		color: 0x2ecc71,
		thumbnail: { url: 'https://en.akinator.com/bundles/elokencesite/images/akinator.png' },
		footer: { text: 'Think of your answer and react!' }
	}]
});
`
	},
	{
		name: "Trivia",
		description: "Test your knowledge with trivia questions from various categories!",
		type: "command",
		key: "trivia",
		usage_help: "[category]",
		extended_help: "Play trivia! Categories: general, science, history, geography, entertainment, sports. Answer correctly to earn points!",
		scopes: ["messages_write"],
		timeout: 8000,
		code: `
const message = require('message');
const command = require('command');

const categories = {
	general: [
		{ q: "What is the capital of France?", a: ["paris"], points: 10 },
		{ q: "How many continents are there?", a: ["7", "seven"], points: 10 },
		{ q: "What is the largest planet in our solar system?", a: ["jupiter"], points: 15 },
		{ q: "What year did World War II end?", a: ["1945"], points: 15 },
		{ q: "What is the chemical symbol for gold?", a: ["au"], points: 20 }
	],
	science: [
		{ q: "What is the speed of light in km/s (approximately)?", a: ["300000", "299792"], points: 25 },
		{ q: "What is H2O commonly known as?", a: ["water"], points: 10 },
		{ q: "How many bones are in the adult human body?", a: ["206"], points: 20 },
		{ q: "What planet is known as the Red Planet?", a: ["mars"], points: 10 }
	],
	history: [
		{ q: "Who was the first President of the United States?", a: ["george washington", "washington"], points: 10 },
		{ q: "In what year did the Titanic sink?", a: ["1912"], points: 15 },
		{ q: "Who painted the Mona Lisa?", a: ["leonardo da vinci", "da vinci", "leonardo"], points: 15 }
	]
};

const category = command.arguments[0]?.toLowerCase() || 'general';
const questions = categories[category] || categories.general;
const question = questions[Math.floor(Math.random() * questions.length)];

message.reply({
	embeds: [{
		title: '🧠 Trivia Time!',
		description: '**Category:** ' + (category.charAt(0).toUpperCase() + category.slice(1)) + '\\n\\n' +
			'**Question:** ' + question.q + '\\n\\n' +
			'💰 **Points:** ' + question.points + '\\n\\n' +
			'*Type your answer in chat!*',
		color: 0x9b59b6,
		footer: { text: 'You have 30 seconds to answer!' }
	}]
});
`
	},
	{
		name: "Hangman",
		description: "Play the classic word guessing game! Guess letters to reveal the hidden word.",
		type: "command",
		key: "hangman",
		usage_help: "[start|guess <letter>]",
		extended_help: "Start a game of Hangman! Guess one letter at a time to reveal the hidden word. You have 6 wrong guesses before you lose!",
		scopes: ["messages_write"],
		timeout: 8000,
		code: `
const message = require('message');
const command = require('command');

const words = [
	"javascript", "discord", "programming", "computer", "keyboard",
	"database", "algorithm", "function", "variable", "developer",
	"python", "typescript", "framework", "library", "server",
	"network", "internet", "browser", "website", "application"
];

const hangmanStages = [
	'\`\`\`\\n  +---+\\n  |   |\\n      |\\n      |\\n      |\\n      |\\n=========\`\`\`',
	'\`\`\`\\n  +---+\\n  |   |\\n  O   |\\n      |\\n      |\\n      |\\n=========\`\`\`',
	'\`\`\`\\n  +---+\\n  |   |\\n  O   |\\n  |   |\\n      |\\n      |\\n=========\`\`\`',
	'\`\`\`\\n  +---+\\n  |   |\\n  O   |\\n /|   |\\n      |\\n      |\\n=========\`\`\`',
	'\`\`\`\\n  +---+\\n  |   |\\n  O   |\\n /|\\\\  |\\n      |\\n      |\\n=========\`\`\`',
	'\`\`\`\\n  +---+\\n  |   |\\n  O   |\\n /|\\\\  |\\n /    |\\n      |\\n=========\`\`\`',
	'\`\`\`\\n  +---+\\n  |   |\\n  O   |\\n /|\\\\  |\\n / \\\\  |\\n      |\\n=========\`\`\`'
];

const word = words[Math.floor(Math.random() * words.length)];
const display = word.split('').map(() => '_').join(' ');

message.reply({
	embeds: [{
		title: '📝 Hangman',
		description: hangmanStages[0] + '\\n\\n' +
			'**Word:** \`' + display + '\`\\n\\n' +
			'**Letters guessed:** None yet\\n' +
			'**Remaining guesses:** 6\\n\\n' +
			'*Guess a letter by typing it in chat!*',
		color: 0xe74c3c,
		footer: { text: 'Word has ' + word.length + ' letters' }
	}]
});
`
	},
	{
		name: "Blackjack",
		description: "Play Blackjack (21) against the dealer! Try to get as close to 21 as possible without going over.",
		type: "command",
		key: "blackjack",
		usage_help: "[bet amount]",
		extended_help: "Play a game of Blackjack! Get dealt 2 cards and try to beat the dealer by getting closer to 21 without busting. Face cards = 10, Aces = 1 or 11.",
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const message = require('message');

const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function drawCard() {
	const suit = suits[Math.floor(Math.random() * suits.length)];
	const value = values[Math.floor(Math.random() * values.length)];
	return { suit, value, display: value + suit };
}

function getCardValue(card) {
	if (['J', 'Q', 'K'].includes(card.value)) return 10;
	if (card.value === 'A') return 11;
	return parseInt(card.value);
}

function calculateHand(cards) {
	let total = cards.reduce((sum, card) => sum + getCardValue(card), 0);
	let aces = cards.filter(c => c.value === 'A').length;
	while (total > 21 && aces > 0) {
		total -= 10;
		aces--;
	}
	return total;
}

const playerCards = [drawCard(), drawCard()];
const dealerCards = [drawCard(), drawCard()];
const playerTotal = calculateHand(playerCards);
const dealerShowing = getCardValue(dealerCards[0]);

let status = '';
if (playerTotal === 21) {
	status = '🎉 **BLACKJACK!** You win!';
}

message.reply({
	embeds: [{
		title: '🃏 Blackjack',
		description: '**Your Hand:** ' + playerCards.map(c => c.display).join(' ') + ' (**' + playerTotal + '**)\\n\\n' +
			'**Dealer Shows:** ' + dealerCards[0].display + ' 🎴 (**' + dealerShowing + '**)\\n\\n' +
			(status || 'React: 👊 **Hit** | 🛑 **Stand** | ✌️ **Double Down**'),
		color: playerTotal === 21 ? 0x2ecc71 : 0x3498db,
		footer: { text: 'Get as close to 21 as possible without going over!' }
	}]
});
`
	},
	{
		name: "Slots",
		description: "Try your luck at the slot machine! Match symbols to win big!",
		type: "command",
		key: "slots",
		usage_help: "[bet amount]",
		extended_help: "Spin the slot machine and try to match 3 symbols! Different symbols have different payouts. 🍒🍒🍒 = 3x, 🍋🍋🍋 = 5x, 💎💎💎 = 10x, 7️⃣7️⃣7️⃣ = JACKPOT!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐'];
const weights = [30, 25, 20, 15, 7, 2, 1]; // Rarity weights

function weightedRandom() {
	const total = weights.reduce((a, b) => a + b, 0);
	let random = Math.random() * total;
	for (let i = 0; i < symbols.length; i++) {
		random -= weights[i];
		if (random <= 0) return symbols[i];
	}
	return symbols[0];
}

const reel1 = weightedRandom();
const reel2 = weightedRandom();
const reel3 = weightedRandom();

const payouts = {
	'🍒': 3, '🍋': 5, '🍊': 7, '🍇': 10, '💎': 25, '7️⃣': 100, '⭐': 50
};

let result = '';
let color = 0x95a5a6;

if (reel1 === reel2 && reel2 === reel3) {
	const multiplier = payouts[reel1];
	result = '🎉 **JACKPOT!** Three ' + reel1 + ' = **' + multiplier + 'x** payout!';
	color = reel1 === '7️⃣' ? 0xf1c40f : 0x2ecc71;
} else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
	result = '😊 **Two of a kind!** Small win!';
	color = 0x3498db;
} else {
	result = '😔 No match. Better luck next time!';
	color = 0xe74c3c;
}

message.reply({
	embeds: [{
		title: '🎰 Slot Machine',
		description: '━━━━━━━━━━━━━━━\\n' +
			'▶️ | ' + reel1 + ' | ' + reel2 + ' | ' + reel3 + ' | ◀️\\n' +
			'━━━━━━━━━━━━━━━\\n\\n' + result,
		color: color,
		footer: { text: 'Spin again to try your luck!' }
	}]
});
`
	},
	{
		name: "Daily Reward",
		description: "Claim your daily reward! Build a streak for bonus rewards!",
		type: "command",
		key: "daily",
		usage_help: "",
		extended_help: "Claim your daily reward once every 24 hours. Build a consecutive streak for bonus multipliers! Miss a day and your streak resets.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const extension = require('extension');

const baseReward = 100;
const streakBonus = 25;

// Simulate streak (in real implementation, use extension.storage)
const streak = Math.floor(Math.random() * 30) + 1;
const reward = baseReward + (streak * streakBonus);

const milestones = {
	7: '🎁 Weekly Bonus: +500!',
	30: '🏆 Monthly Bonus: +2000!',
	100: '👑 Century Bonus: +10000!'
};

let bonusText = '';
if (milestones[streak]) {
	bonusText = '\\n\\n' + milestones[streak];
}

message.reply({
	embeds: [{
		title: '📅 Daily Reward Claimed!',
		description: '**Base Reward:** 💰 ' + baseReward + '\\n' +
			'**Streak Bonus:** 🔥 +' + (streak * streakBonus) + '\\n' +
			'**Total:** 💎 ' + reward + bonusText + '\\n\\n' +
			'🔥 **Current Streak:** ' + streak + ' days',
		color: 0xf1c40f,
		thumbnail: { url: 'https://cdn.discordapp.com/emojis/836329015009329212.gif' },
		footer: { text: 'Come back tomorrow to continue your streak!' }
	}]
});
`
	},
	{
		name: "Reminder",
		description: "Set a reminder and get notified when the time comes!",
		type: "command",
		key: "remind",
		usage_help: "<time> <message>",
		extended_help: "Set a reminder! Use formats like '10m', '2h', '1d' for time. Example: !remind 30m Check the oven",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const timeArg = command.arguments[0];
const reminderText = command.arguments.slice(1).join(' ');

if (!timeArg || !reminderText) {
	message.reply({
		embeds: [{
			title: '⏰ Reminder',
			description: '**Usage:** \`' + command.prefix + 'remind <time> <message>\`\\n\\n' +
				'**Time formats:**\\n' +
				'• \`10m\` - 10 minutes\\n' +
				'• \`2h\` - 2 hours\\n' +
				'• \`1d\` - 1 day\\n\\n' +
				'**Example:** \`' + command.prefix + 'remind 30m Check the pizza\`',
			color: 0x3498db
		}]
	});
} else {
	const timeMatch = timeArg.match(/^(\\d+)(m|h|d)$/i);
	if (!timeMatch) {
		message.reply('❌ Invalid time format! Use like: 10m, 2h, 1d');
	} else {
		const amount = parseInt(timeMatch[1]);
		const unit = timeMatch[2].toLowerCase();
		const units = { m: 'minute', h: 'hour', d: 'day' };
		const unitName = units[unit] + (amount > 1 ? 's' : '');
		
		const timestamp = Math.floor(Date.now() / 1000) + (amount * (unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400));
		
		message.reply({
			embeds: [{
				title: '⏰ Reminder Set!',
				description: '**Reminder:** ' + reminderText + '\\n\\n' +
					'**When:** <t:' + timestamp + ':R> (<t:' + timestamp + ':f>)',
				color: 0x2ecc71,
				footer: { text: 'I\\'ll remind you in ' + amount + ' ' + unitName + '!' }
			}]
		});
	}
}
`
	},
	{
		name: "Word Chain",
		description: "Play Word Chain! Each word must start with the last letter of the previous word.",
		type: "keyword",
		keywords: ["wordchain", "wc"],
		usage_help: "",
		extended_help: "Start a Word Chain game! Each player must say a word that starts with the last letter of the previous word. No repeating words!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const exampleWords = ['apple', 'elephant', 'tiger', 'rabbit', 'turtle'];

message.reply({
	embeds: [{
		title: '🔗 Word Chain',
		description: '**How to Play:**\\n' +
			'1. Someone starts with any word\\n' +
			'2. Next person says a word starting with the LAST letter\\n' +
			'3. No repeating words!\\n\\n' +
			'**Example:**\\n' +
			exampleWords.map((w, i) => '• ' + w + (i < exampleWords.length - 1 ? ' → **' + w[w.length-1].toUpperCase() + '**...' : '')).join('\\n') +
			'\\n\\n**Starting word:** 🎯 **DISCORD**\\n\\n' +
			'*Type a word starting with* ***D*** *to continue!*',
		color: 0x9b59b6,
		footer: { text: 'Think fast! You have 30 seconds!' }
	}]
});
`
	},
	{
		name: "Type Race",
		description: "Test your typing speed! Type the given text as fast as you can.",
		type: "command",
		key: "typerace",
		usage_help: "",
		extended_help: "Start a typing race! A random sentence will appear and you must type it exactly as shown. Fastest typer wins!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const sentences = [
	"The quick brown fox jumps over the lazy dog.",
	"Pack my box with five dozen liquor jugs.",
	"How vexingly quick daft zebras jump!",
	"The five boxing wizards jump quickly.",
	"Sphinx of black quartz, judge my vow.",
	"Two driven jocks help fax my big quiz.",
	"Programming is the art of telling a computer what to do.",
	"Discord is a great platform for communities.",
	"Practice makes perfect when it comes to typing.",
	"Speed and accuracy are both important in typing."
];

const sentence = sentences[Math.floor(Math.random() * sentences.length)];
const wordCount = sentence.split(' ').length;

message.reply({
	embeds: [{
		title: '⌨️ Type Race!',
		description: '**Type this sentence as fast as you can:**\\n\\n' +
			'\`\`\`' + sentence + '\`\`\`\\n' +
			'📝 **Words:** ' + wordCount + '\\n' +
			'📏 **Characters:** ' + sentence.length + '\\n\\n' +
			'*The timer starts NOW! Type the sentence exactly as shown.*',
		color: 0xe74c3c,
		footer: { text: 'First to type it correctly wins!' }
	}]
});
`
	},
	{
		name: "Reaction Test",
		description: "Test your reaction speed! Click the button as fast as you can when it appears.",
		type: "command",
		key: "reaction",
		usage_help: "",
		extended_help: "Test how fast your reactions are! Wait for the signal, then react as quickly as possible. Your reaction time will be measured in milliseconds.",
		scopes: ["messages_write"],
		timeout: 8000,
		code: `
const message = require('message');

const waitTime = Math.floor(Math.random() * 4000) + 2000; // 2-6 seconds

message.reply({
	embeds: [{
		title: '⚡ Reaction Test',
		description: '**Get Ready...**\\n\\n' +
			'🔴 Wait for it...\\n\\n' +
			'When you see 🟢 **GO!**, react with ⚡ as fast as you can!\\n\\n' +
			'*The signal will appear in a few seconds...*',
		color: 0xe74c3c,
		footer: { text: 'Don\\'t react too early!' }
	}]
}).then(() => {
	// In a real implementation, this would update after waitTime
	message.channel.send({
		embeds: [{
			title: '⚡ Reaction Test',
			description: '🟢 **GO GO GO!**\\n\\n' +
				'React with ⚡ NOW!',
			color: 0x2ecc71
		}]
	});
});
`
	},
	{
		name: "Scramble",
		description: "Unscramble the word as fast as you can!",
		type: "command",
		key: "scramble",
		usage_help: "",
		extended_help: "A word will be scrambled and you have to figure out what it is! Be the first to type the correct word to win!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const words = [
	{ word: "PROGRAMMING", hint: "Writing code" },
	{ word: "JAVASCRIPT", hint: "Popular web language" },
	{ word: "DISCORD", hint: "Chat platform" },
	{ word: "COMPUTER", hint: "Electronic device" },
	{ word: "KEYBOARD", hint: "Input device" },
	{ word: "DEVELOPER", hint: "Code writer" },
	{ word: "DATABASE", hint: "Data storage" },
	{ word: "INTERNET", hint: "Global network" },
	{ word: "SOFTWARE", hint: "Computer programs" },
	{ word: "ALGORITHM", hint: "Step-by-step procedure" }
];

function scramble(word) {
	const arr = word.split('');
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr.join('');
}

const chosen = words[Math.floor(Math.random() * words.length)];
let scrambled = scramble(chosen.word);

// Make sure it's actually scrambled
while (scrambled === chosen.word) {
	scrambled = scramble(chosen.word);
}

message.reply({
	embeds: [{
		title: '🔀 Word Scramble',
		description: '**Unscramble this word:**\\n\\n' +
			'📝 \`' + scrambled + '\`\\n\\n' +
			'💡 **Hint:** ' + chosen.hint + '\\n\\n' +
			'*Type your answer in chat!*',
		color: 0x3498db,
		footer: { text: 'First correct answer wins!' }
	}]
});
`
	},
	{
		name: "Riddle",
		description: "Solve a riddle! Test your brain with tricky riddles.",
		type: "command",
		key: "riddle",
		usage_help: "",
		extended_help: "Get a random riddle to solve! Think carefully and type your answer. Some riddles are tricky!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const riddles = [
	{ q: "What has keys but no locks?", a: "keyboard" },
	{ q: "What has hands but can't clap?", a: "clock" },
	{ q: "What has a head and a tail but no body?", a: "coin" },
	{ q: "What gets wetter the more it dries?", a: "towel" },
	{ q: "What can you catch but not throw?", a: "cold" },
	{ q: "What has many teeth but can't bite?", a: "comb" },
	{ q: "What runs but never walks?", a: "water" },
	{ q: "What has words but never speaks?", a: "book" },
	{ q: "What has a ring but no finger?", a: "phone" },
	{ q: "I have cities, but no houses. I have mountains, but no trees. What am I?", a: "map" }
];

const riddle = riddles[Math.floor(Math.random() * riddles.length)];

message.reply({
	embeds: [{
		title: '🤔 Riddle Me This...',
		description: '**' + riddle.q + '**\\n\\n' +
			'*Think carefully and type your answer!*',
		color: 0x9b59b6,
		footer: { text: 'Hint: The answer is a single word' }
	}]
});
`
	},
	{
		name: "Todo List",
		description: "Manage your personal todo list! Add, complete, and remove tasks.",
		type: "command",
		key: "todo",
		usage_help: "[add/done/remove/list] [task]",
		extended_help: "Manage your personal todo list! Use: todo add <task>, todo done <number>, todo remove <number>, todo list",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const action = command.arguments[0]?.toLowerCase();
const taskText = command.arguments.slice(1).join(' ');

// Example todos (in real implementation, use extension.storage)
const todos = [
	{ id: 1, task: "Learn Discord.js", done: true },
	{ id: 2, task: "Build a cool bot", done: false },
	{ id: 3, task: "Add more features", done: false }
];

if (!action || action === 'list') {
	const todoList = todos.map((t, i) => 
		(t.done ? '✅' : '⬜') + ' \`' + (i + 1) + '.\` ' + (t.done ? '~~' + t.task + '~~' : t.task)
	).join('\\n');
	
	message.reply({
		embeds: [{
			title: '📋 Your Todo List',
			description: todoList || '*No tasks yet! Add one with* \`todo add <task>\`',
			color: 0x3498db,
			footer: { text: todos.filter(t => !t.done).length + ' tasks remaining' }
		}]
	});
} else if (action === 'add' && taskText) {
	message.reply({
		embeds: [{
			title: '✅ Task Added',
			description: '**Task:** ' + taskText,
			color: 0x2ecc71
		}]
	});
} else {
	message.reply({
		embeds: [{
			title: '📋 Todo Commands',
			description: '• \`todo list\` - View your tasks\\n' +
				'• \`todo add <task>\` - Add a new task\\n' +
				'• \`todo done <number>\` - Mark task as done\\n' +
				'• \`todo remove <number>\` - Remove a task',
			color: 0x3498db
		}]
	});
}
`
	},
	{
		name: "Balance",
		description: "Check your wallet and bank balance!",
		type: "command",
		key: "balance",
		usage_help: "[@user]",
		extended_help: "Check your current balance including wallet cash and bank savings. Mention someone to check their balance!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const targetUser = message.mentions?.users?.first() || message.author;

// Simulated balance (in real implementation, use database)
const wallet = Math.floor(Math.random() * 10000);
const bank = Math.floor(Math.random() * 50000);
const total = wallet + bank;

message.reply({
	embeds: [{
		author: {
			name: targetUser.username + '\\'s Balance',
			icon_url: targetUser.displayAvatarURL()
		},
		description: '💵 **Wallet:** ' + wallet.toLocaleString() + ' coins\\n' +
			'🏦 **Bank:** ' + bank.toLocaleString() + ' coins\\n' +
			'━━━━━━━━━━━━━━━\\n' +
			'💰 **Total:** ' + total.toLocaleString() + ' coins',
		color: 0xf1c40f,
		footer: { text: 'Use !daily to earn more coins!' }
	}]
});
`
	},
	{
		name: "Work",
		description: "Work a job to earn some coins! Different jobs pay different amounts.",
		type: "command",
		key: "work",
		usage_help: "",
		extended_help: "Work a random job to earn coins! Jobs have different payouts. You can work once every hour.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const jobs = [
	{ title: "Software Developer", pay: [200, 500], emoji: "💻" },
	{ title: "Chef", pay: [100, 300], emoji: "👨‍🍳" },
	{ title: "Teacher", pay: [150, 350], emoji: "👨‍🏫" },
	{ title: "Doctor", pay: [300, 600], emoji: "👨‍⚕️" },
	{ title: "Artist", pay: [50, 400], emoji: "🎨" },
	{ title: "Musician", pay: [75, 450], emoji: "🎵" },
	{ title: "Streamer", pay: [100, 500], emoji: "📺" },
	{ title: "YouTuber", pay: [50, 600], emoji: "🎬" }
];

const job = jobs[Math.floor(Math.random() * jobs.length)];
const earned = Math.floor(Math.random() * (job.pay[1] - job.pay[0])) + job.pay[0];

const messages = [
	"You worked hard as a " + job.title + "!",
	"Great job at your " + job.title + " shift!",
	"Another day, another dollar as a " + job.title + "!",
	"You finished your work as a " + job.title + "!"
];

message.reply({
	embeds: [{
		title: job.emoji + ' Work Complete!',
		description: messages[Math.floor(Math.random() * messages.length)] + '\\n\\n' +
			'💰 **Earned:** ' + earned.toLocaleString() + ' coins',
		color: 0x2ecc71,
		footer: { text: 'You can work again in 1 hour' }
	}]
});
`
	},
	{
		name: "Leaderboard",
		description: "View the server leaderboard for XP, coins, or other stats!",
		type: "command",
		key: "leaderboard",
		usage_help: "[xp|coins|voice]",
		extended_help: "View the top members of the server! Choose between XP, coins, or voice time leaderboards.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const type = command.arguments[0]?.toLowerCase() || 'xp';

// Simulated leaderboard data
const users = [
	{ name: "Player1", xp: 15420, coins: 52300, voice: "24h 32m" },
	{ name: "Player2", xp: 12350, coins: 48100, voice: "20h 15m" },
	{ name: "Player3", xp: 10200, coins: 35600, voice: "18h 45m" },
	{ name: "Player4", xp: 8900, coins: 29400, voice: "15h 20m" },
	{ name: "Player5", xp: 7500, coins: 22100, voice: "12h 10m" },
	{ name: "Player6", xp: 6200, coins: 18500, voice: "10h 5m" },
	{ name: "Player7", xp: 5100, coins: 15200, voice: "8h 30m" },
	{ name: "Player8", xp: 4300, coins: 12800, voice: "6h 45m" },
	{ name: "Player9", xp: 3600, coins: 9400, voice: "5h 20m" },
	{ name: "Player10", xp: 2900, coins: 6100, voice: "3h 55m" }
];

const medals = ['🥇', '🥈', '🥉'];
const typeEmoji = { xp: '✨', coins: '💰', voice: '🎤' };
const typeName = { xp: 'XP', coins: 'Coins', voice: 'Voice Time' };

const leaderboard = users.map((u, i) => {
	const medal = i < 3 ? medals[i] : '\`' + (i + 1) + '.\`';
	const value = type === 'xp' ? u.xp.toLocaleString() : type === 'coins' ? u.coins.toLocaleString() : u.voice;
	return medal + ' **' + u.name + '** - ' + value;
}).join('\\n');

message.reply({
	embeds: [{
		title: typeEmoji[type] + ' ' + typeName[type] + ' Leaderboard',
		description: leaderboard,
		color: 0xf1c40f,
		footer: { text: 'Your rank: #42' }
	}]
});
`
	},
	// ==================== BATCH 3 - ECONOMY & PETS ====================
	{
		name: "Pet",
		description: "Adopt and care for a virtual pet! Feed, play, and watch it grow.",
		type: "command",
		key: "pet",
		usage_help: "[adopt|feed|play|stats|rename]",
		extended_help: "Adopt a virtual pet and take care of it! Feed it, play with it, and watch it level up. Neglect it and it might run away!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');

const petTypes = [
	{ name: 'Dog', emoji: '🐕', trait: 'Loyal' },
	{ name: 'Cat', emoji: '🐈', trait: 'Independent' },
	{ name: 'Dragon', emoji: '🐉', trait: 'Fierce' },
	{ name: 'Bunny', emoji: '🐰', trait: 'Cuddly' },
	{ name: 'Fox', emoji: '🦊', trait: 'Clever' },
	{ name: 'Penguin', emoji: '🐧', trait: 'Cool' },
	{ name: 'Owl', emoji: '🦉', trait: 'Wise' },
	{ name: 'Unicorn', emoji: '🦄', trait: 'Magical' }
];

const action = command.arguments[0]?.toLowerCase();

if (!action || action === 'stats') {
	// Show pet stats (simulated - would use extension.storage in real implementation)
	const pet = petTypes[Math.floor(Math.random() * petTypes.length)];
	const level = Math.floor(Math.random() * 20) + 1;
	const hunger = Math.floor(Math.random() * 100);
	const happiness = Math.floor(Math.random() * 100);
	const xp = Math.floor(Math.random() * 1000);
	
	const hungerBar = '█'.repeat(Math.floor(hunger/10)) + '░'.repeat(10 - Math.floor(hunger/10));
	const happyBar = '█'.repeat(Math.floor(happiness/10)) + '░'.repeat(10 - Math.floor(happiness/10));
	
	message.reply({
		embeds: [{
			title: pet.emoji + ' ' + message.author.username + '\\'s Pet',
			description: '**Name:** ' + pet.name + '\\n' +
				'**Type:** ' + pet.emoji + ' ' + pet.name + '\\n' +
				'**Trait:** ' + pet.trait + '\\n' +
				'**Level:** ' + level + ' (' + xp + ' XP)\\n\\n' +
				'🍖 **Hunger:** [' + hungerBar + '] ' + hunger + '%\\n' +
				'💖 **Happiness:** [' + happyBar + '] ' + happiness + '%',
			color: 0x2ecc71,
			footer: { text: 'Use !pet feed or !pet play to care for your pet!' }
		}]
	});
} else if (action === 'adopt') {
	const pet = petTypes[Math.floor(Math.random() * petTypes.length)];
	message.reply({
		embeds: [{
			title: '🎉 New Pet Adopted!',
			description: 'You adopted a **' + pet.emoji + ' ' + pet.name + '**!\\n\\n' +
				'**Trait:** ' + pet.trait + '\\n\\n' +
				'Take good care of your new friend!',
			color: 0x2ecc71,
			footer: { text: 'Use !pet stats to check on your pet' }
		}]
	});
} else if (action === 'feed') {
	message.reply({
		embeds: [{
			title: '🍖 Pet Fed!',
			description: 'Your pet happily munches on the food!\\n\\n' +
				'+20 Hunger restored\\n+5 XP earned',
			color: 0xf39c12
		}]
	});
} else if (action === 'play') {
	message.reply({
		embeds: [{
			title: '🎾 Playtime!',
			description: 'You played with your pet!\\n\\n' +
				'+25 Happiness\\n+10 XP earned\\n-5 Hunger',
			color: 0x3498db
		}]
	});
} else {
	message.reply({
		embeds: [{
			title: '🐾 Pet Commands',
			description: '• \`pet adopt\` - Adopt a new pet\\n' +
				'• \`pet stats\` - View your pet\\n' +
				'• \`pet feed\` - Feed your pet\\n' +
				'• \`pet play\` - Play with your pet\\n' +
				'• \`pet rename <name>\` - Rename your pet',
			color: 0x3498db
		}]
	});
}
`
	},
	{
		name: "Fish",
		description: "Go fishing and catch various fish! Sell them for points.",
		type: "command",
		key: "fish",
		usage_help: "",
		extended_help: "Cast your line and try to catch fish! Different fish are worth different amounts of points. Rare catches can be very valuable!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const catches = [
	{ name: 'Old Boot', emoji: '👢', rarity: 'Junk', points: 0, chance: 15 },
	{ name: 'Seaweed', emoji: '🌿', rarity: 'Junk', points: 1, chance: 10 },
	{ name: 'Sardine', emoji: '🐟', rarity: 'Common', points: 5, chance: 25 },
	{ name: 'Cod', emoji: '🐟', rarity: 'Common', points: 10, chance: 20 },
	{ name: 'Salmon', emoji: '🐟', rarity: 'Uncommon', points: 25, chance: 12 },
	{ name: 'Tuna', emoji: '🐟', rarity: 'Uncommon', points: 40, chance: 8 },
	{ name: 'Swordfish', emoji: '🗡️', rarity: 'Rare', points: 75, chance: 5 },
	{ name: 'Octopus', emoji: '🐙', rarity: 'Rare', points: 100, chance: 3 },
	{ name: 'Golden Fish', emoji: '✨', rarity: 'Legendary', points: 500, chance: 1.5 },
	{ name: 'Treasure Chest', emoji: '💎', rarity: 'Legendary', points: 1000, chance: 0.5 }
];

const rarityColors = {
	'Junk': 0x95a5a6,
	'Common': 0x3498db,
	'Uncommon': 0x2ecc71,
	'Rare': 0x9b59b6,
	'Legendary': 0xf1c40f
};

// Weighted random selection
function getCatch() {
	const roll = Math.random() * 100;
	let cumulative = 0;
	for (const c of catches) {
		cumulative += c.chance;
		if (roll <= cumulative) return c;
	}
	return catches[2]; // Default to sardine
}

const caught = getCatch();

message.reply({
	embeds: [{
		title: '🎣 Fishing...',
		description: 'You cast your line and wait...\\n\\n' +
			caught.emoji + ' You caught a **' + caught.name + '**!\\n\\n' +
			'**Rarity:** ' + caught.rarity + '\\n' +
			'**Worth:** ' + caught.points + ' points',
		color: rarityColors[caught.rarity],
		footer: { text: caught.points > 0 ? 'Nice catch!' : 'Better luck next time!' }
	}]
});
`
	},
	{
		name: "Hunt",
		description: "Go hunting in the wilderness! Find animals and treasures.",
		type: "command",
		key: "hunt",
		usage_help: "",
		extended_help: "Venture into the wilderness to hunt! You might find animals, treasures, or danger. Higher risk means higher rewards!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const encounters = [
	{ name: 'Rabbit', emoji: '🐰', points: 10, type: 'catch' },
	{ name: 'Deer', emoji: '🦌', points: 25, type: 'catch' },
	{ name: 'Wild Boar', emoji: '🐗', points: 40, type: 'catch' },
	{ name: 'Fox', emoji: '🦊', points: 30, type: 'catch' },
	{ name: 'Bear', emoji: '🐻', points: 100, type: 'danger' },
	{ name: 'Wolf Pack', emoji: '🐺', points: -50, type: 'danger' },
	{ name: 'Treasure Chest', emoji: '💰', points: 200, type: 'treasure' },
	{ name: 'Rare Mushrooms', emoji: '🍄', points: 35, type: 'forage' },
	{ name: 'Bird\\'s Nest', emoji: '🪺', points: 15, type: 'forage' },
	{ name: 'Nothing', emoji: '🌲', points: 0, type: 'empty' }
];

const encounter = encounters[Math.floor(Math.random() * encounters.length)];

let description = '';
let color = 0x2ecc71;

switch (encounter.type) {
	case 'catch':
		description = 'You spotted a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
			'You successfully caught it!\\n💰 **+' + encounter.points + ' points**';
		color = 0x2ecc71;
		break;
	case 'danger':
		if (encounter.points > 0) {
			description = 'You encountered a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
				'After a fierce battle, you won!\\n💰 **+' + encounter.points + ' points**';
			color = 0xf39c12;
		} else {
			description = 'You encountered a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
				'You had to flee and dropped some coins!\\n💸 **' + encounter.points + ' points**';
			color = 0xe74c3c;
		}
		break;
	case 'treasure':
		description = 'You found a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
			'Lucky find!\\n💰 **+' + encounter.points + ' points**';
		color = 0xf1c40f;
		break;
	case 'forage':
		description = 'You found some **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
			'You collected them.\\n💰 **+' + encounter.points + ' points**';
		color = 0x9b59b6;
		break;
	default:
		description = encounter.emoji + ' The forest was quiet today...\\n\\nYou found nothing of value.';
		color = 0x95a5a6;
}

message.reply({
	embeds: [{
		title: '🏹 Hunting...',
		description: description,
		color: color,
		footer: { text: 'Hunt again in 30 minutes' }
	}]
});
`
	},
	{
		name: "Rob",
		description: "Attempt to rob another user! Risk losing your own points if you fail.",
		type: "command",
		key: "rob",
		usage_help: "[@user]",
		extended_help: "Try to steal points from another user! Success rate depends on various factors. If you fail, you might lose points or get caught!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const target = message.mentions?.users?.first();

if (!target) {
	message.reply({
		embeds: [{
			title: '🦹 Rob',
			description: 'Mention a user to attempt to rob them!\\n\\n' +
				'**Usage:** \`rob @user\`\\n\\n' +
				'⚠️ **Warning:** If you fail, you might lose points!',
			color: 0xe74c3c
		}]
	});
} else if (target.id === message.author.id) {
	message.reply('❌ You can\\'t rob yourself!');
} else if (target.bot) {
	message.reply('❌ You can\\'t rob bots!');
} else {
	const success = Math.random() > 0.5;
	const amount = Math.floor(Math.random() * 200) + 50;
	
	if (success) {
		message.reply({
			embeds: [{
				title: '💰 Robbery Successful!',
				description: 'You snuck up on **' + target.username + '** and stole **' + amount + ' points**!\\n\\n' +
					'Don\\'t get caught!',
				color: 0x2ecc71,
				footer: { text: 'You can rob again in 2 hours' }
			}]
		});
	} else {
		const fine = Math.floor(amount * 0.75);
		message.reply({
			embeds: [{
				title: '🚔 Caught!',
				description: 'You tried to rob **' + target.username + '** but got caught!\\n\\n' +
					'You paid a fine of **' + fine + ' points**.',
				color: 0xe74c3c,
				footer: { text: 'Crime doesn\\'t pay!' }
			}]
		});
	}
}
`
	},
	{
		name: "Gamble",
		description: "Gamble your points! Double or nothing!",
		type: "command",
		key: "gamble",
		usage_help: "<amount|all>",
		extended_help: "Bet your points on a coin flip! Win and double your bet, lose and it's gone. Use 'all' to bet everything!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const betArg = command.arguments[0];

if (!betArg) {
	message.reply({
		embeds: [{
			title: '🎲 Gamble',
			description: 'Bet your points on a coin flip!\\n\\n' +
				'**Usage:** \`gamble <amount>\` or \`gamble all\`\\n\\n' +
				'Win = 2x your bet\\nLose = Lose your bet',
			color: 0xf1c40f
		}]
	});
} else {
	const bet = betArg.toLowerCase() === 'all' ? 1000 : parseInt(betArg);
	
	if (isNaN(bet) || bet <= 0) {
		message.reply('❌ Please enter a valid bet amount!');
	} else {
		const win = Math.random() > 0.5;
		const result = win ? bet : -bet;
		
		message.reply({
			embeds: [{
				title: '🎲 ' + (win ? 'You Won!' : 'You Lost!'),
				description: (win ? '🎉' : '😢') + ' The coin landed on **' + (win ? 'HEADS' : 'TAILS') + '**!\\n\\n' +
					'**Bet:** ' + bet + ' points\\n' +
					'**Result:** ' + (win ? '+' : '') + result + ' points',
				color: win ? 0x2ecc71 : 0xe74c3c,
				footer: { text: win ? 'Lucky!' : 'Better luck next time!' }
			}]
		});
	}
}
`
	},
	{
		name: "Shop",
		description: "Browse and buy items from the server shop!",
		type: "command",
		key: "shop",
		usage_help: "[buy <item>]",
		extended_help: "View available items in the shop and purchase them with your points! Items include roles, badges, and special perks.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const shopItems = [
	{ id: 1, name: 'Custom Role Color', price: 5000, emoji: '🎨', desc: 'Change your role color' },
	{ id: 2, name: 'Nickname Change', price: 1000, emoji: '📝', desc: 'Change your nickname' },
	{ id: 3, name: 'VIP Badge', price: 10000, emoji: '⭐', desc: 'Exclusive VIP badge' },
	{ id: 4, name: 'XP Boost (1h)', price: 2500, emoji: '⚡', desc: '2x XP for 1 hour' },
	{ id: 5, name: 'Lottery Ticket', price: 500, emoji: '🎟️', desc: 'Enter the lottery' },
	{ id: 6, name: 'Pet Food', price: 100, emoji: '🍖', desc: 'Feed your pet' },
	{ id: 7, name: 'Fishing Rod Upgrade', price: 3000, emoji: '🎣', desc: 'Better catch rates' },
	{ id: 8, name: 'Mystery Box', price: 2000, emoji: '📦', desc: 'Random reward!' }
];

const action = command.arguments[0]?.toLowerCase();

if (action === 'buy') {
	const itemName = command.arguments.slice(1).join(' ').toLowerCase();
	const item = shopItems.find(i => i.name.toLowerCase().includes(itemName));
	
	if (!item) {
		message.reply('❌ Item not found! Use \`shop\` to see available items.');
	} else {
		message.reply({
			embeds: [{
				title: '🛒 Purchase',
				description: 'You purchased **' + item.emoji + ' ' + item.name + '**!\\n\\n' +
					'**Cost:** ' + item.price.toLocaleString() + ' points',
				color: 0x2ecc71,
				footer: { text: 'Thank you for your purchase!' }
			}]
		});
	}
} else {
	const shopList = shopItems.map(item => 
		item.emoji + ' **' + item.name + '** - ' + item.price.toLocaleString() + ' pts\\n└ *' + item.desc + '*'
	).join('\\n\\n');
	
	message.reply({
		embeds: [{
			title: '🏪 Server Shop',
			description: shopList + '\\n\\n*Use* \`shop buy <item>\` *to purchase*',
			color: 0x3498db,
			footer: { text: 'Your balance: Check with /points' }
		}]
	});
}
`
	},
	{
		name: "Inventory",
		description: "View your inventory of collected items!",
		type: "command",
		key: "inventory",
		usage_help: "[@user]",
		extended_help: "Check your inventory to see all items you've collected, purchased, or earned!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const targetUser = message.mentions?.users?.first() || message.author;

// Simulated inventory
const inventory = [
	{ name: 'Fishing Rod', emoji: '🎣', quantity: 1, type: 'Tool' },
	{ name: 'Pet Food', emoji: '🍖', quantity: 5, type: 'Consumable' },
	{ name: 'Lottery Tickets', emoji: '🎟️', quantity: 3, type: 'Item' },
	{ name: 'XP Boost', emoji: '⚡', quantity: 2, type: 'Boost' },
	{ name: 'Golden Badge', emoji: '🏅', quantity: 1, type: 'Collectible' }
];

const invList = inventory.map(item => 
	item.emoji + ' **' + item.name + '** x' + item.quantity + ' *(' + item.type + ')*'
).join('\\n');

message.reply({
	embeds: [{
		author: {
			name: targetUser.username + '\\'s Inventory',
			icon_url: targetUser.displayAvatarURL()
		},
		description: invList || '*Inventory is empty*',
		color: 0x9b59b6,
		footer: { text: 'Total items: ' + inventory.reduce((a, b) => a + b.quantity, 0) }
	}]
});
`
	},
	{
		name: "Profile",
		description: "View your detailed profile with stats and achievements!",
		type: "command",
		key: "profile",
		usage_help: "[@user]",
		extended_help: "Display your full profile including level, points, achievements, and other stats!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const targetUser = message.mentions?.users?.first() || message.author;

// Simulated profile data
const level = Math.floor(Math.random() * 50) + 1;
const xp = Math.floor(Math.random() * 5000);
const xpNeeded = level * 500;
const points = Math.floor(Math.random() * 50000);
const messages = Math.floor(Math.random() * 10000);
const voiceHours = Math.floor(Math.random() * 100);
const joinDate = '<t:1609459200:D>';

const xpProgress = Math.floor((xp / xpNeeded) * 10);
const xpBar = '█'.repeat(xpProgress) + '░'.repeat(10 - xpProgress);

const badges = ['🏆', '⭐', '🎮', '💎', '🔥'].slice(0, Math.floor(Math.random() * 5) + 1);

message.reply({
	embeds: [{
		author: {
			name: targetUser.username + '\\'s Profile',
			icon_url: targetUser.displayAvatarURL()
		},
		thumbnail: { url: targetUser.displayAvatarURL({ size: 256 }) },
		fields: [
			{ name: '📊 Level', value: level.toString(), inline: true },
			{ name: '⭐ Points', value: points.toLocaleString(), inline: true },
			{ name: '💬 Messages', value: messages.toLocaleString(), inline: true },
			{ name: '🎤 Voice', value: voiceHours + 'h', inline: true },
			{ name: '📅 Joined', value: joinDate, inline: true },
			{ name: '🏅 Badges', value: badges.join(' ') || 'None', inline: true },
			{ name: 'XP Progress', value: '[' + xpBar + '] ' + xp + '/' + xpNeeded, inline: false }
		],
		color: 0x3498db,
		footer: { text: 'Rank #' + (Math.floor(Math.random() * 100) + 1) + ' in server' }
	}]
});
`
	},
	{
		name: "Heist",
		description: "Organize a heist with other members! Higher rewards with more participants.",
		type: "command",
		key: "heist",
		usage_help: "[start|join]",
		extended_help: "Start or join a heist! More participants means bigger rewards but also bigger risks. Failed heists cost everyone!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const action = command.arguments[0]?.toLowerCase();

const targets = [
	{ name: 'Corner Store', difficulty: 'Easy', reward: [500, 1500] },
	{ name: 'Local Bank', difficulty: 'Medium', reward: [2000, 5000] },
	{ name: 'Casino Vault', difficulty: 'Hard', reward: [5000, 15000] },
	{ name: 'Federal Reserve', difficulty: 'Extreme', reward: [20000, 50000] }
];

if (action === 'start') {
	const target = targets[Math.floor(Math.random() * targets.length)];
	message.reply({
		embeds: [{
			title: '🏦 Heist Started!',
			description: '**Target:** ' + target.name + '\\n' +
				'**Difficulty:** ' + target.difficulty + '\\n' +
				'**Potential Reward:** ' + target.reward[0].toLocaleString() + ' - ' + target.reward[1].toLocaleString() + ' points\\n\\n' +
				'React with 💰 to join the heist!\\n' +
				'Heist begins in 60 seconds...',
			color: 0xe74c3c,
			footer: { text: 'More crew = higher success rate!' }
		}]
	});
} else if (action === 'join') {
	message.reply({
		embeds: [{
			title: '✅ Joined Heist!',
			description: 'You\\'ve joined the heist crew!\\n\\n' +
				'Wait for the heist to begin...',
			color: 0x2ecc71
		}]
	});
} else {
	message.reply({
		embeds: [{
			title: '🏦 Heist',
			description: '**Commands:**\\n' +
				'• \`heist start\` - Start a new heist\\n' +
				'• \`heist join\` - Join an active heist\\n\\n' +
				'**How it works:**\\n' +
				'1. Someone starts a heist\\n' +
				'2. Others join within 60 seconds\\n' +
				'3. Success rate increases with more members\\n' +
				'4. Rewards are split among participants',
			color: 0xe74c3c
		}]
	});
}
`
	},
	{
		name: "Lottery",
		description: "Enter the server lottery for a chance to win big!",
		type: "command",
		key: "lottery",
		usage_help: "[enter|check]",
		extended_help: "Buy lottery tickets and enter the draw! The jackpot grows with each ticket purchased. Drawings happen daily!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const action = command.arguments[0]?.toLowerCase();

const jackpot = Math.floor(Math.random() * 100000) + 10000;
const ticketPrice = 500;
const participants = Math.floor(Math.random() * 50) + 10;

if (action === 'enter') {
	message.reply({
		embeds: [{
			title: '🎟️ Lottery Ticket Purchased!',
			description: 'You bought a lottery ticket!\\n\\n' +
				'**Cost:** ' + ticketPrice + ' points\\n' +
				'**Current Jackpot:** 💰 ' + jackpot.toLocaleString() + ' points\\n\\n' +
				'Good luck! Drawing happens at midnight.',
			color: 0xf1c40f
		}]
	});
} else if (action === 'check') {
	message.reply({
		embeds: [{
			title: '🎟️ Lottery Status',
			description: '**Current Jackpot:** 💰 ' + jackpot.toLocaleString() + ' points\\n' +
				'**Participants:** ' + participants + ' entries\\n' +
				'**Ticket Price:** ' + ticketPrice + ' points\\n' +
				'**Drawing:** <t:' + (Math.floor(Date.now()/1000) + 3600) + ':R>',
			color: 0xf1c40f
		}]
	});
} else {
	message.reply({
		embeds: [{
			title: '🎟️ Server Lottery',
			description: '**Current Jackpot:** 💰 ' + jackpot.toLocaleString() + ' points\\n\\n' +
				'**Commands:**\\n' +
				'• \`lottery enter\` - Buy a ticket (' + ticketPrice + ' pts)\\n' +
				'• \`lottery check\` - View current lottery\\n\\n' +
				'Drawing happens daily at midnight!',
			color: 0xf1c40f
		}]
	});
}
`
	},
	{
		name: "Crime",
		description: "Commit petty crimes for quick cash! Risk vs reward.",
		type: "command",
		key: "crime",
		usage_help: "",
		extended_help: "Commit various crimes for quick points. Higher risk crimes have higher rewards but also higher chance of getting caught!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');

const crimes = [
	{ name: 'Pickpocket', successRate: 70, reward: [10, 50], fine: [20, 40] },
	{ name: 'Shoplift', successRate: 60, reward: [30, 100], fine: [50, 100] },
	{ name: 'Car Break-in', successRate: 50, reward: [75, 200], fine: [100, 200] },
	{ name: 'ATM Hack', successRate: 35, reward: [200, 500], fine: [200, 400] },
	{ name: 'Bank Fraud', successRate: 20, reward: [500, 1500], fine: [500, 1000] }
];

const crime = crimes[Math.floor(Math.random() * crimes.length)];
const success = Math.random() * 100 < crime.successRate;

if (success) {
	const reward = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0])) + crime.reward[0];
	message.reply({
		embeds: [{
			title: '💰 Crime Successful!',
			description: 'You committed **' + crime.name + '** and got away with it!\\n\\n' +
				'**Earned:** +' + reward + ' points',
			color: 0x2ecc71,
			footer: { text: 'You can commit another crime in 30 minutes' }
		}]
	});
} else {
	const fine = Math.floor(Math.random() * (crime.fine[1] - crime.fine[0])) + crime.fine[0];
	message.reply({
		embeds: [{
			title: '🚨 Busted!',
			description: 'You tried to commit **' + crime.name + '** but got caught!\\n\\n' +
				'**Fine:** -' + fine + ' points',
			color: 0xe74c3c,
			footer: { text: 'Maybe try something less risky?' }
		}]
	});
}
`
	},
	{
		name: "Give",
		description: "Give some of your points to another user!",
		type: "command",
		key: "give",
		usage_help: "<@user> <amount>",
		extended_help: "Transfer points to another user. Great for gifts or paying debts!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const target = message.mentions?.users?.first();
const amount = parseInt(command.arguments[1]);

if (!target) {
	message.reply({
		embeds: [{
			title: '🎁 Give Points',
			description: 'Transfer points to another user!\\n\\n' +
				'**Usage:** \`give @user <amount>\`\\n\\n' +
				'Example: \`give @friend 500\`',
			color: 0x3498db
		}]
	});
} else if (target.id === message.author.id) {
	message.reply('❌ You can\\'t give points to yourself!');
} else if (target.bot) {
	message.reply('❌ You can\\'t give points to bots!');
} else if (!amount || isNaN(amount) || amount <= 0) {
	message.reply('❌ Please enter a valid amount!');
} else {
	message.reply({
		embeds: [{
			title: '🎁 Points Transferred!',
			description: 'You gave **' + amount.toLocaleString() + ' points** to ' + target + '!',
			color: 0x2ecc71,
			footer: { text: 'Generosity is a virtue!' }
		}]
	});
}
`
	},
	{
		name: "Deposit",
		description: "Deposit points into your bank for safekeeping!",
		type: "command",
		key: "deposit",
		usage_help: "<amount|all>",
		extended_help: "Store points in your bank to keep them safe from robbers! Bank points can't be stolen but earn interest.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const amountArg = command.arguments[0];

if (!amountArg) {
	message.reply({
		embeds: [{
			title: '🏦 Deposit',
			description: 'Store your points safely in the bank!\\n\\n' +
				'**Usage:** \`deposit <amount>\` or \`deposit all\`\\n\\n' +
				'Bank points earn 1% daily interest!',
			color: 0x3498db
		}]
	});
} else {
	const amount = amountArg.toLowerCase() === 'all' ? 5000 : parseInt(amountArg);
	
	if (isNaN(amount) || amount <= 0) {
		message.reply('❌ Please enter a valid amount!');
	} else {
		message.reply({
			embeds: [{
				title: '🏦 Deposited!',
				description: 'You deposited **' + amount.toLocaleString() + ' points** into your bank!\\n\\n' +
					'Your bank balance is now earning interest.',
				color: 0x2ecc71
			}]
		});
	}
}
`
	},
	{
		name: "Withdraw",
		description: "Withdraw points from your bank!",
		type: "command",
		key: "withdraw",
		usage_help: "<amount|all>",
		extended_help: "Take points out of your bank and into your wallet. Remember, wallet points can be stolen!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const amountArg = command.arguments[0];

if (!amountArg) {
	message.reply({
		embeds: [{
			title: '🏦 Withdraw',
			description: 'Take points out of your bank!\\n\\n' +
				'**Usage:** \`withdraw <amount>\` or \`withdraw all\`\\n\\n' +
				'⚠️ Wallet points can be stolen by robbers!',
			color: 0x3498db
		}]
	});
} else {
	const amount = amountArg.toLowerCase() === 'all' ? 5000 : parseInt(amountArg);
	
	if (isNaN(amount) || amount <= 0) {
		message.reply('❌ Please enter a valid amount!');
	} else {
		message.reply({
			embeds: [{
				title: '🏦 Withdrawn!',
				description: 'You withdrew **' + amount.toLocaleString() + ' points** from your bank!\\n\\n' +
					'Points are now in your wallet.',
				color: 0x2ecc71
			}]
		});
	}
}
`
	},
	{
		name: "Dice Duel",
		description: "Challenge someone to a dice duel! Highest roll wins the pot.",
		type: "command",
		key: "diceduel",
		usage_help: "<@user> <bet>",
		extended_help: "Challenge another user to a dice duel! Both players bet the same amount, roll dice, and the highest roll wins everything!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const target = message.mentions?.users?.first();
const bet = parseInt(command.arguments[1]);

if (!target || !bet) {
	message.reply({
		embeds: [{
			title: '🎲 Dice Duel',
			description: 'Challenge someone to a dice battle!\\n\\n' +
				'**Usage:** \`diceduel @user <bet>\`\\n\\n' +
				'Both players roll dice. Highest wins!',
			color: 0xf39c12
		}]
	});
} else if (target.id === message.author.id) {
	message.reply('❌ You can\\'t duel yourself!');
} else if (target.bot) {
	message.reply('❌ You can\\'t duel bots!');
} else {
	const roll1 = Math.floor(Math.random() * 6) + 1;
	const roll2 = Math.floor(Math.random() * 6) + 1;
	const winner = roll1 > roll2 ? message.author : (roll2 > roll1 ? target : null);
	
	let result = '';
	let color = 0xf39c12;
	
	if (winner) {
		result = '🏆 **' + winner.username + '** wins **' + (bet * 2).toLocaleString() + ' points**!';
		color = winner.id === message.author.id ? 0x2ecc71 : 0xe74c3c;
	} else {
		result = '🤝 **It\\'s a tie!** Bets are returned.';
	}
	
	message.reply({
		embeds: [{
			title: '🎲 Dice Duel Results',
			description: '**' + message.author.username + '** rolled: 🎲 **' + roll1 + '**\\n' +
				'**' + target.username + '** rolled: 🎲 **' + roll2 + '**\\n\\n' +
				result,
			color: color
		}]
	});
}
`
	}
];

async function seedExtensions () {
	// Load environment and database
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
	const generateCodeID = (code) => {
		const crypto = require("crypto");
		return crypto.createHash("sha256").update(code).digest("hex").substring(0, 16);
	};

	console.log("🔧 Seeding extensions...\n");

	for (const ext of extensions) {
		// Check if extension already exists
		const existing = await Gallery.findOne({ name: ext.name }).catch(() => null);
		if (existing) {
			console.log(`⏭️  Skipping "${ext.name}" (already exists)`);
			continue;
		}

		try {
			const codeId = generateCodeID(ext.code);

			// Create new extension document with initial data
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
					key: ext.key || null,
					keywords: ext.keywords || [],
					case_sensitive: false,
					interval: ext.interval || null,
					usage_help: ext.usage_help || null,
					extended_help: ext.extended_help || null,
					event: ext.event || null,
					timeout: ext.timeout || 5000,
					scopes: ext.scopes || [],
					code_id: codeId,
				}],
			});

			await galleryDocument.save();

			// Save extension code file
			await fs.outputFileAtomic(
				path.join(__dirname, `../extensions/${codeId}.skyext`),
				ext.code.trim()
			);

			console.log(`✅ Created "${ext.name}" (${ext.key})`);
		} catch (err) {
			console.error(`❌ Failed to create "${ext.name}":`, err.message);
		}
	}

	console.log("\n🎉 Extension seeding complete!");
	process.exit(0);
}

seedExtensions().catch(err => {
	console.error("Fatal error:", err);
	process.exit(1);
});
