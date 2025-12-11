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
	}
];

async function seedExtensions() {
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
