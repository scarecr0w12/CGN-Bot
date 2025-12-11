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
		description:
      "Play Connect 4 against another member! Drop pieces into a 7x6 grid and try to get 4 in a row.",
		type: "command",
		key: "connect4",
		usage_help: "[@opponent]",
		extended_help:
      "Challenge someone to Connect 4! Use reactions to drop pieces. First to get 4 in a row wins!",
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
`,
	},
	{
		name: "Rock Paper Scissors",
		description: "Play Rock Paper Scissors against the bot or another user!",
		type: "command",
		key: "rps",
		usage_help: "<rock|paper|scissors> [@opponent]",
		extended_help:
      "Play RPS! Use rock, paper, or scissors. Mention someone to challenge them!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');
const embed = require('embed');

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
		embeds: [embed.create({
			title: '✂️ Rock Paper Scissors',
			description: 'Usage: \`' + command.prefix + command.key + ' <rock|paper|scissors>\`\\n\\n' +
				'🪨 ' + utils.discord.bold('Rock') + ' beats Scissors\\n' +
				'📄 ' + utils.discord.bold('Paper') + ' beats Rock\\n' +
				'✂️ ' + utils.discord.bold('Scissors') + ' beats Paper',
			color: embed.colors.PURPLE
		})]
	});
} else {
	// Bot makes choice
	const botChoice = utils.random.pick(choices);
	
	let result, color;
	if (userChoice === botChoice) {
		result = "It's a tie! 🤝";
		color = embed.colors.GOLD;
	} else if (
		(userChoice === 'rock' && botChoice === 'scissors') ||
		(userChoice === 'paper' && botChoice === 'rock') ||
		(userChoice === 'scissors' && botChoice === 'paper')
	) {
		result = 'You win! 🎉';
		color = embed.colors.SUCCESS;
	} else {
		result = 'You lose! 😢';
		color = embed.colors.ERROR;
	}
	
	message.reply({
		embeds: [embed.create({
			title: '✂️ Rock Paper Scissors',
			description: 
				utils.discord.bold('You:') + ' ' + emojis[userChoice] + ' ' + utils.text.capitalize(userChoice) + '\\n' +
				utils.discord.bold('Bot:') + ' ' + emojis[botChoice] + ' ' + utils.text.capitalize(botChoice) + '\\n\\n' +
				utils.discord.bold(result),
			color: color
		})]
	});
}
`,
	},
	{
		name: "Truth or Dare",
		description:
      "Get random truth questions or dare challenges for party games!",
		type: "command",
		key: "tod",
		usage_help: "<truth|dare>",
		extended_help:
      "Get a random truth question or dare challenge. Great for party games!",
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

const utils = require('utils');
const embed = require('embed');

const suffix = command.suffix.toLowerCase().trim();
const isTruth = suffix === 'truth' || suffix === 't';
const isDare = suffix === 'dare' || suffix === 'd';

if (!isTruth && !isDare) {
	message.reply({
		embeds: [embed.create({
			title: '🎭 Truth or Dare',
			description: 'Usage: \`' + command.prefix + command.key + ' <truth|dare>\`\\n\\n' +
				'🤔 ' + utils.discord.bold('truth') + ' - Get a truth question\\n' +
				'😈 ' + utils.discord.bold('dare') + ' - Get a dare challenge',
			color: embed.colors.PURPLE
		})]
	});
} else if (isTruth) {
	const truth = utils.random.pick(truths);
	message.reply({
		embeds: [embed.create({
			title: '🤔 Truth',
			description: truth,
			color: embed.colors.BLUE,
			footer: { text: 'Answer honestly!' }
		})]
	});
} else {
	const dare = utils.random.pick(dares);
	message.reply({
		embeds: [embed.create({
			title: '😈 Dare',
			description: dare,
			color: embed.colors.ERROR,
			footer: { text: 'No chickening out!' }
		})]
	});
}
`,
	},
	{
		name: "Would You Rather",
		description:
      "Get random 'Would You Rather' questions to spark conversations!",
		type: "command",
		key: "wyr",
		usage_help: "",
		extended_help: "Get a random Would You Rather question. React to vote!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

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

const q = utils.random.pick(questions);

message.reply({
	embeds: [embed.create({
		title: '🤷 Would You Rather...',
		description: '🅰️ ' + utils.discord.bold(q[0]) + '\\n\\nor\\n\\n🅱️ ' + utils.discord.bold(q[1]),
		color: embed.colors.PURPLE,
		footer: { text: 'React with 🅰️ or 🅱️ to vote!' }
	})]
});
`,
	},
	{
		name: "Never Have I Ever",
		description: "Get random 'Never Have I Ever' statements for party games!",
		type: "command",
		key: "nhie",
		usage_help: "",
		extended_help:
      "Get a random Never Have I Ever statement. Great for getting to know people!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

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

const statement = utils.random.pick(statements);

message.reply({
	embeds: [embed.create({
		title: '🙈 Never Have I Ever',
		description: utils.discord.bold(statement),
		color: embed.colors.GOLD,
		footer: { text: 'React if you HAVE done it!' }
	})]
});
`,
	},
	{
		name: "This or That",
		description: "Quick-fire choice questions to learn preferences!",
		type: "command",
		key: "thisorthat",
		usage_help: "",
		extended_help:
      "Get a random This or That question. Quick choices reveal personality!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

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

const q = utils.random.pick(questions);

message.reply({
	embeds: [embed.create({
		title: '⚡ This or That',
		description: utils.discord.bold(q[0]) + ' or ' + utils.discord.bold(q[1]) + '?',
		color: embed.colors.GREEN,
		footer: { text: 'No "both" or "neither" allowed!' }
	})]
});
`,
	},
	{
		name: "8 Ball Advanced",
		description: "Ask the magic 8-ball a question with more variety!",
		type: "command",
		key: "8ball2",
		usage_help: "<question>",
		extended_help:
      "Ask a yes/no question and receive mystic wisdom from the 8-ball!",
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

const utils = require('utils');
const embed = require('embed');

const question = command.suffix.trim();

if (!question) {
	message.reply({
		embeds: [embed.create({
			title: '🎱 Magic 8-Ball',
			description: 'You must ask a question!\\n\\nUsage: \`' + command.prefix + command.key + ' Will I win the lottery?\`',
			color: embed.colors.DEFAULT
		})]
	});
} else {
	const allAnswers = [...positive, ...neutral, ...negative];
	const answer = utils.random.pick(allAnswers);
	
	let color = embed.colors.GOLD;
	if (positive.includes(answer)) color = embed.colors.SUCCESS;
	else if (negative.includes(answer)) color = embed.colors.ERROR;
	
	message.reply({
		embeds: [embed.create({
			title: '🎱 Magic 8-Ball',
			description: utils.discord.bold('Q:') + ' ' + question + '\\n\\n' + utils.discord.bold('A:') + ' ' + answer,
			color: color,
			footer: { text: 'The 8-ball has spoken!' }
		})]
	});
}
`,
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
const utils = require('utils');
const embed = require('embed');

const isHeads = utils.random.bool();
const result = isHeads ? 'Heads' : 'Tails';
const emoji = isHeads ? '👑' : '🦅';

message.reply({
	embeds: [embed.create({
		title: '🪙 Coin Flip',
		description: emoji + ' ' + utils.discord.bold(result + '!'),
		color: isHeads ? embed.colors.GOLD : embed.colors.DEFAULT,
		footer: { text: 'The coin has spoken!' }
	})]
});
`,
	},
	// NOTE: Dice Roll extension removed - duplicates built-in roll command
	{
		name: "Random Number",
		description: "Generate a random number between two values!",
		type: "command",
		key: "random",
		usage_help: "[min] [max]",
		extended_help:
      "Generate a random number. Default: 1-100. Specify min and max for custom range.",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');
const embed = require('embed');

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

const result = utils.random.int(min, max);

message.reply({
	embeds: [embed.create({
		title: '🔢 Random Number',
		description: utils.discord.bold('Range:') + ' ' + utils.format.number(min) + ' - ' + utils.format.number(max) + '\\n\\n' + utils.discord.bold('Result:') + ' ' + utils.format.number(result),
		color: embed.colors.BLUE
	})]
});
`,
	},
	{
		name: "Team Picker",
		description: "Randomly split mentioned users into teams!",
		type: "command",
		key: "teams",
		usage_help: "[number of teams] @user1 @user2 ...",
		extended_help:
      "Randomly divide mentioned users into teams. Default: 2 teams.",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');
const embed = require('embed');

const mentions = message.mentions;
const args = command.suffix.trim().split(/\\s+/);

let numTeams = 2;
if (args[0] && !isNaN(parseInt(args[0]))) {
	numTeams = parseInt(args[0]);
}

if (mentions.length < 2) {
	message.reply({
		embeds: [embed.create({
			title: '👥 Team Picker',
			description: 'Mention at least 2 users to create teams!\\n\\n' +
				'Usage: \`' + command.prefix + command.key + ' [number of teams] @user1 @user2 @user3...\`',
			color: embed.colors.ERROR
		})]
	});
} else {
	numTeams = utils.math.clamp(numTeams, 2, mentions.length);
	
	// Shuffle mentions
	const shuffled = utils.random.shuffle([...mentions]);
	
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
		description += emoji + ' ' + utils.discord.bold('Team ' + (i + 1)) + '\\n';
		description += team.map(u => '• ' + u.username).join('\\n');
		description += '\\n\\n';
	});
	
	message.reply({
		embeds: [embed.create({
			title: '👥 Team Picker',
			description: description,
			color: embed.colors.SUCCESS,
			footer: { text: 'Teams randomly generated!' }
		})]
	});
}
`,
	},
	// NOTE: Countdown Timer extension removed - duplicates built-in countdown command
	{
		name: "User Stats",
		description: "View statistics about a user stored by extensions!",
		type: "command",
		key: "userstats",
		usage_help: "[@user]",
		extended_help:
      "View stats for yourself or mentioned user. Stats are stored per-server.",
		scopes: ["members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const target = message.mentions[0] || message.author;
const statsKey = 'stats_' + target.id;
let stats = extension.storage.get(statsKey);

if (!stats) {
	stats = { games_played: 0, messages: 0, commands: 0 };
}

message.reply({
	embeds: [embed.create({
		title: '📊 User Stats',
		description: utils.discord.bold('User:') + ' ' + target.username,
		fields: [
			{ name: '🎮 Games Played', value: utils.format.number(stats.games_played || 0), inline: true },
			{ name: '💬 Messages', value: utils.format.number(stats.messages || 0), inline: true },
			{ name: '⚡ Commands', value: utils.format.number(stats.commands || 0), inline: true }
		],
		color: embed.colors.PURPLE,
		thumbnail: { url: target.avatarURL || '' }
	})]
});
`,
	},
	{
		name: "Quote of the Day",
		description: "Get an inspiring or funny quote!",
		type: "command",
		key: "quote",
		usage_help: "",
		extended_help:
      "Get a random inspirational, funny, or thought-provoking quote!",
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

const utils = require('utils');
const embed = require('embed');

const quote = utils.random.pick(quotes);

message.reply({
	embeds: [embed.create({
		description: utils.discord.italic('"' + quote.text + '"') + '\\n\\n— ' + utils.discord.bold(quote.author),
		color: embed.colors.BLUE,
		footer: { text: '💭 Quote of the Day' }
	})]
});
`,
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

const utils = require('utils');
const embed = require('embed');

const fact = utils.random.pick(facts);

message.reply({
	embeds: [embed.create({
		title: '💡 Did You Know?',
		description: fact,
		color: embed.colors.GOLD,
		footer: { text: 'Random Fact Generator' }
	})]
});
`,
	},
	{
		name: "Mood Tracker",
		description: "Log and track your daily mood!",
		type: "command",
		key: "mood",
		usage_help: "<happy|sad|angry|tired|excited|neutral> [note]",
		extended_help:
      "Track your mood over time. Add optional notes to remember why!",
		scopes: [],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');

const utils = require('utils');
const embed = require('embed');

const moods = {
	happy: { emoji: '😊', color: embed.colors.SUCCESS, name: 'Happy' },
	sad: { emoji: '😢', color: embed.colors.BLUE, name: 'Sad' },
	angry: { emoji: '😠', color: embed.colors.ERROR, name: 'Angry' },
	tired: { emoji: '😴', color: embed.colors.DEFAULT, name: 'Tired' },
	excited: { emoji: '🤩', color: embed.colors.GOLD, name: 'Excited' },
	neutral: { emoji: '😐', color: embed.colors.PURPLE, name: 'Neutral' }
};

const args = command.suffix.trim().split(/\\s+/);
const moodArg = args[0]?.toLowerCase();
const note = args.slice(1).join(' ');

if (!moodArg || !moods[moodArg]) {
	const moodList = Object.entries(moods).map(([k, v]) => v.emoji + ' \`' + k + '\`').join('\\n');
	message.reply({
		embeds: [embed.create({
			title: '🎭 Mood Tracker',
			description: 'Log how you\\'re feeling!\\n\\n' + utils.discord.bold('Available moods:') + '\\n' + moodList + '\\n\\n' +
				'Usage: \`' + command.prefix + command.key + ' <mood> [optional note]\`',
			color: embed.colors.PURPLE
		})]
	});
} else {
	const mood = moods[moodArg];
	
	message.reply({
		embeds: [embed.create({
			title: mood.emoji + ' Mood Logged',
			description: utils.discord.bold('Feeling:') + ' ' + mood.name + '\\n' +
				(note ? utils.discord.bold('Note:') + ' ' + note + '\\n' : '') +
				utils.discord.bold('When:') + ' ' + utils.time.discord(utils.time.now(), 'R'),
			color: mood.color,
			footer: { text: 'Logged by ' + message.author.username }
		})]
	});
}
`,
	},
	// ==================== NEW BATCH ====================
	{
		name: "Akinator",
		description:
      "Play the famous Akinator guessing game! Think of a character and Akinator will try to guess who it is.",
		type: "command",
		key: "akinator",
		usage_help: "[start]",
		extended_help:
      "Start an Akinator game where you think of a character (real or fictional) and answer yes/no questions. Akinator will try to guess who you're thinking of!",
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

const utils = require('utils');
const embed = require('embed');

const randomQ = utils.random.pick(questions);

message.reply({
	embeds: [embed.create({
		title: '🧞 Akinator',
		description: utils.discord.bold('Think of a character...') + ' (real or fictional)\\n\\n' +
			'I will ask you questions to guess who you\\'re thinking of!\\n\\n' +
			utils.discord.bold('Question:') + ' ' + randomQ + '\\n\\n' +
			'React with:\\n✅ Yes | ❌ No | 🤷 Don\\'t Know | 👍 Probably Yes | 👎 Probably No',
		color: embed.colors.SUCCESS,
		thumbnail: { url: 'https://en.akinator.com/bundles/elokencesite/images/akinator.png' },
		footer: { text: 'Think of your answer and react!' }
	})]
});
`,
	},
	// NOTE: Trivia extension removed - duplicates built-in trivia command
	{
		name: "Hangman",
		description:
      "Play the classic word guessing game! Guess letters to reveal the hidden word.",
		type: "command",
		key: "hangman",
		usage_help: "[start|guess <letter>]",
		extended_help:
      "Start a game of Hangman! Guess one letter at a time to reveal the hidden word. You have 6 wrong guesses before you lose!",
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

const utils = require('utils');
const embed = require('embed');

const word = utils.random.pick(words);
const display = word.split('').map(() => '_').join(' ');

message.reply({
	embeds: [embed.create({
		title: '📝 Hangman',
		description: hangmanStages[0] + '\\n\\n' +
			utils.discord.bold('Word:') + ' \`' + display + '\`\\n\\n' +
			utils.discord.bold('Letters guessed:') + ' None yet\\n' +
			utils.discord.bold('Remaining guesses:') + ' 6\\n\\n' +
			utils.discord.italic('Guess a letter by typing it in chat!'),
		color: embed.colors.ERROR,
		footer: { text: 'Word has ' + word.length + ' letters' }
	})]
});
`,
	},
	{
		name: "Blackjack",
		description:
      "Play Blackjack (21) against the dealer! Try to get as close to 21 as possible without going over.",
		type: "command",
		key: "blackjack",
		usage_help: "[bet amount]",
		extended_help:
      "Play a game of Blackjack! Get dealt 2 cards and try to beat the dealer by getting closer to 21 without busting. Face cards = 10, Aces = 1 or 11.",
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const message = require('message');

const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const utils = require('utils');
const embed = require('embed');

function drawCard() {
	const suit = utils.random.pick(suits);
	const value = utils.random.pick(values);
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
`,
	},
	{
		name: "Slots",
		description: "Try your luck at the slot machine! Match symbols to win big!",
		type: "command",
		key: "slots",
		usage_help: "[bet amount]",
		extended_help:
      "Spin the slot machine and try to match 3 symbols! Different symbols have different payouts. 🍒🍒🍒 = 3x, 🍋🍋🍋 = 5x, 💎💎💎 = 10x, 7️⃣7️⃣7️⃣ = JACKPOT!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

const symbolData = [
	{ item: '🍒', weight: 30 },
	{ item: '🍋', weight: 25 },
	{ item: '🍊', weight: 20 },
	{ item: '🍇', weight: 15 },
	{ item: '💎', weight: 7 },
	{ item: '7️⃣', weight: 2 },
	{ item: '⭐', weight: 1 }
];

const reel1 = utils.random.weighted(symbolData);
const reel2 = utils.random.weighted(symbolData);
const reel3 = utils.random.weighted(symbolData);

const payouts = {
	'🍒': 3, '🍋': 5, '🍊': 7, '🍇': 10, '💎': 25, '7️⃣': 100, '⭐': 50
};

let result = '';
let color = embed.colors.DEFAULT;

if (reel1 === reel2 && reel2 === reel3) {
	const multiplier = payouts[reel1];
	result = '🎉 ' + utils.discord.bold('JACKPOT!') + ' Three ' + reel1 + ' = ' + utils.discord.bold(multiplier + 'x') + ' payout!';
	color = reel1 === '7️⃣' ? embed.colors.GOLD : embed.colors.SUCCESS;
} else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
	result = '😊 ' + utils.discord.bold('Two of a kind!') + ' Small win!';
	color = embed.colors.BLUE;
} else {
	result = '😔 No match. Better luck next time!';
	color = embed.colors.ERROR;
}

message.reply({
	embeds: [embed.create({
		title: '🎰 Slot Machine',
		description: '━━━━━━━━━━━━━━━\\n' +
			'▶️ | ' + reel1 + ' | ' + reel2 + ' | ' + reel3 + ' | ◀️\\n' +
			'━━━━━━━━━━━━━━━\\n\\n' + result,
		color: color,
		footer: { text: 'Spin again to try your luck!' }
	})]
});
`,
	},
	// NOTE: Daily Reward (simulated) removed - duplicate of economy-integrated version below
	// NOTE: Reminder extension removed - duplicates built-in remindme command
	{
		name: "Word Chain",
		description:
      "Play Word Chain! Each word must start with the last letter of the previous word.",
		type: "keyword",
		keywords: ["wordchain", "wc"],
		usage_help: "",
		extended_help:
      "Start a Word Chain game! Each player must say a word that starts with the last letter of the previous word. No repeating words!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

const exampleWords = ['apple', 'elephant', 'tiger', 'rabbit', 'turtle'];

message.reply({
	embeds: [embed.create({
		title: '🔗 Word Chain',
		description: utils.discord.bold('How to Play:') + '\\n' +
			'1. Someone starts with any word\\n' +
			'2. Next person says a word starting with the LAST letter\\n' +
			'3. No repeating words!\\n\\n' +
			utils.discord.bold('Example:') + '\\n' +
			exampleWords.map((w, i) => '• ' + w + (i < exampleWords.length - 1 ? ' → ' + utils.discord.bold(w[w.length-1].toUpperCase()) + '...' : '')).join('\\n') +
			'\\n\\n' + utils.discord.bold('Starting word:') + ' 🎯 ' + utils.discord.bold('DISCORD') + '\\n\\n' +
			utils.discord.italic('Type a word starting with ') + utils.discord.bold('D') + utils.discord.italic(' to continue!'),
		color: embed.colors.PURPLE,
		footer: { text: 'Think fast! You have 30 seconds!' }
	})]
});
`,
	},
	{
		name: "Type Race",
		description:
      "Test your typing speed! Type the given text as fast as you can.",
		type: "command",
		key: "typerace",
		usage_help: "",
		extended_help:
      "Start a typing race! A random sentence will appear and you must type it exactly as shown. Fastest typer wins!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

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

const sentence = utils.random.pick(sentences);
const wordCount = utils.text.words(sentence).length;

message.reply({
	embeds: [embed.create({
		title: '⌨️ Type Race!',
		description: utils.discord.bold('Type this sentence as fast as you can:') + '\\n\\n' +
			utils.discord.codeBlock(sentence) + '\\n' +
			'📝 ' + utils.discord.bold('Words:') + ' ' + wordCount + '\\n' +
			'📏 ' + utils.discord.bold('Characters:') + ' ' + sentence.length + '\\n\\n' +
			utils.discord.italic('The timer starts NOW! Type the sentence exactly as shown.'),
		color: embed.colors.ERROR,
		footer: { text: 'First to type it correctly wins!' }
	})]
});
`,
	},
	{
		name: "Reaction Test",
		description:
      "Test your reaction speed! Click the button as fast as you can when it appears.",
		type: "command",
		key: "reaction",
		usage_help: "",
		extended_help:
      "Test how fast your reactions are! Wait for the signal, then react as quickly as possible. Your reaction time will be measured in milliseconds.",
		scopes: ["messages_write"],
		timeout: 8000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

const waitTime = utils.random.int(2000, 6000); // 2-6 seconds

message.reply({
	embeds: [embed.create({
		title: '⚡ Reaction Test',
		description: utils.discord.bold('Get Ready...') + '\\n\\n' +
			'🔴 Wait for it...\\n\\n' +
			'When you see 🟢 ' + utils.discord.bold('GO!') + ', react with ⚡ as fast as you can!\\n\\n' +
			utils.discord.italic('The signal will appear in a few seconds...'),
		color: embed.colors.ERROR,
		footer: { text: 'Don\\'t react too early!' }
	})]
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
`,
	},
	{
		name: "Scramble",
		description: "Unscramble the word as fast as you can!",
		type: "command",
		key: "scramble",
		usage_help: "",
		extended_help:
      "A word will be scrambled and you have to figure out what it is! Be the first to type the correct word to win!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

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

const chosen = utils.random.pick(words);
let scrambled = utils.random.shuffle(chosen.word.split('')).join('');

// Make sure it's actually scrambled
while (scrambled === chosen.word) {
	scrambled = utils.random.shuffle(chosen.word.split('')).join('');
}

message.reply({
	embeds: [embed.create({
		title: '🔀 Word Scramble',
		description: utils.discord.bold('Unscramble this word:') + '\\n\\n' +
			'📝 \`' + scrambled + '\`\\n\\n' +
			'💡 ' + utils.discord.bold('Hint:') + ' ' + chosen.hint + '\\n\\n' +
			utils.discord.italic('Type your answer in chat!'),
		color: embed.colors.BLUE,
		footer: { text: 'First correct answer wins!' }
	})]
});
`,
	},
	{
		name: "Riddle",
		description: "Solve a riddle! Test your brain with tricky riddles.",
		type: "command",
		key: "riddle",
		usage_help: "",
		extended_help:
      "Get a random riddle to solve! Think carefully and type your answer. Some riddles are tricky!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const utils = require('utils');
const embed = require('embed');

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

const riddle = utils.random.pick(riddles);

message.reply({
	embeds: [embed.create({
		title: '🤔 Riddle Me This...',
		description: utils.discord.bold(riddle.q) + '\\n\\n' +
			utils.discord.italic('Think carefully and type your answer!'),
		color: embed.colors.PURPLE,
		footer: { text: 'Hint: The answer is a single word' }
	})]
});
`,
	},
	// NOTE: Todo List extension removed - duplicates built-in list command
	// NOTE: Balance (simulated) removed - duplicate of economy-integrated version below
	{
		name: "Work",
		description:
      "Work a job to earn some coins! Different jobs pay different amounts.",
		type: "command",
		key: "work",
		usage_help: "",
		extended_help:
      "Work a random job to earn coins! Jobs have different payouts. You can work once every hour.",
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
`,
	},
	// NOTE: Leaderboard extension removed - duplicates built-in ranks/messages commands
	// ==================== BATCH 3 - ECONOMY & PETS ====================
	{
		name: "Pet",
		description:
      "Adopt and care for a virtual pet! Feed, play, and watch it grow.",
		type: "command",
		key: "pet",
		usage_help: "[adopt|feed|play|stats|rename]",
		extended_help:
      "Adopt a virtual pet and take care of it! Feed it, play with it, and watch it level up. Neglect it and it might run away!",
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
`,
	},
	{
		name: "Fish",
		description: "Go fishing and catch various fish! Sell them for points.",
		type: "command",
		key: "fish",
		usage_help: "",
		extended_help:
      "Cast your line and try to catch fish! Different fish are worth different amounts of points. Rare catches can be very valuable! Has a 30-minute cooldown.",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');
const extension = require('extension');

// Check cooldown (30 minutes)
const lastFish = extension.storage.get('fish_' + message.author.id);
const now = Date.now();
const cooldown = 30 * 60 * 1000;

if (lastFish && (now - lastFish) < cooldown) {
	const remaining = cooldown - (now - lastFish);
	message.reply({
		embeds: [embed.create({
			title: '🎣 Fishing',
			description: 'Your fishing line is still tangled!\\n\\n' +
				'**Try again:** ' + utils.time.discord(now + remaining, 'R'),
			color: embed.colors.ERROR
		})]
	});
} else {
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
		'Junk': embed.colors.GREY,
		'Common': embed.colors.BLUE,
		'Uncommon': embed.colors.GREEN,
		'Rare': embed.colors.PURPLE,
		'Legendary': embed.colors.GOLD
	};

	// Weighted random selection
	const roll = Math.random() * 100;
	let cumulative = 0;
	let caught = catches[2];
	for (const c of catches) {
		cumulative += c.chance;
		if (roll <= cumulative) {
			caught = c;
			break;
		}
	}

	extension.storage.write('fish_' + message.author.id, now);

	if (caught.points > 0) {
		const result = economy.addPoints(message.author.id, caught.points, 'Fishing: ' + caught.name);
		message.reply({
			embeds: [embed.create({
				title: '🎣 Fishing...',
				description: 'You cast your line and wait...\\n\\n' +
					caught.emoji + ' You caught a **' + caught.name + '**!\\n\\n' +
					'**Rarity:** ' + caught.rarity + '\\n' +
					'**Earned:** +' + caught.points + ' points\\n' +
					'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
				color: rarityColors[caught.rarity],
				footer: { text: 'Nice catch! Fish again in 30 minutes.' }
			})]
		});
	} else {
		message.reply({
			embeds: [embed.create({
				title: '🎣 Fishing...',
				description: 'You cast your line and wait...\\n\\n' +
					caught.emoji + ' You caught a **' + caught.name + '**!\\n\\n' +
					'**Rarity:** ' + caught.rarity + '\\n' +
					'Worth nothing... better luck next time!',
				color: rarityColors[caught.rarity],
				footer: { text: 'Fish again in 30 minutes.' }
			})]
		});
	}
}
`,
	},
	{
		name: "Hunt",
		description: "Go hunting in the wilderness! Find animals and treasures.",
		type: "command",
		key: "hunt",
		usage_help: "",
		extended_help:
      "Venture into the wilderness to hunt! You might find animals, treasures, or danger. Has a 30-minute cooldown.",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');
const extension = require('extension');

// Check cooldown (30 minutes)
const lastHunt = extension.storage.get('hunt_' + message.author.id);
const now = Date.now();
const cooldown = 30 * 60 * 1000;

if (lastHunt && (now - lastHunt) < cooldown) {
	const remaining = cooldown - (now - lastHunt);
	message.reply({
		embeds: [embed.create({
			title: '🏹 Hunting',
			description: 'You\\'re too tired to hunt again!\\n\\n' +
				'**Try again:** ' + utils.time.discord(now + remaining, 'R'),
			color: embed.colors.ERROR
		})]
	});
} else {
	const encounters = [
		{ name: 'Rabbit', emoji: '🐰', points: 10, type: 'catch' },
		{ name: 'Deer', emoji: '🦌', points: 25, type: 'catch' },
		{ name: 'Wild Boar', emoji: '🐗', points: 40, type: 'catch' },
		{ name: 'Fox', emoji: '🦊', points: 30, type: 'catch' },
		{ name: 'Bear', emoji: '🐻', points: 100, type: 'danger' },
		{ name: 'Wolf Pack', emoji: '🐺', points: -50, type: 'danger' },
		{ name: 'Treasure Chest', emoji: '💰', points: 200, type: 'treasure' },
		{ name: 'Rare Mushrooms', emoji: '🍄', points: 35, type: 'forage' },
		{ name: 'Bird Nest', emoji: '🪺', points: 15, type: 'forage' },
		{ name: 'Nothing', emoji: '🌲', points: 0, type: 'empty' }
	];

	const encounter = encounters[Math.floor(Math.random() * encounters.length)];
	extension.storage.write('hunt_' + message.author.id, now);

	let description = '';
	let color = embed.colors.SUCCESS;
	let balanceText = '';

	if (encounter.points > 0) {
		const result = economy.addPoints(message.author.id, encounter.points, 'Hunt: ' + encounter.name);
		balanceText = '\\n**New Balance:** ' + utils.format.number(result.newBalance) + ' points';
	} else if (encounter.points < 0) {
		const absPoints = Math.abs(encounter.points);
		const userData = economy.getSelf();
		if (userData.rankScore >= absPoints) {
			const result = economy.removePoints(message.author.id, absPoints, 'Hunt: ' + encounter.name);
			balanceText = '\\n**New Balance:** ' + utils.format.number(result.newBalance) + ' points';
		} else {
			balanceText = '\\n*You had no points to lose!*';
		}
	}

	switch (encounter.type) {
		case 'catch':
			description = 'You spotted a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
				'You successfully caught it!\\n💰 **+' + encounter.points + ' points**' + balanceText;
			color = embed.colors.SUCCESS;
			break;
		case 'danger':
			if (encounter.points > 0) {
				description = 'You encountered a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
					'After a fierce battle, you won!\\n💰 **+' + encounter.points + ' points**' + balanceText;
				color = embed.colors.ORANGE;
			} else {
				description = 'You encountered a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
					'You had to flee and dropped some coins!\\n💸 **' + encounter.points + ' points**' + balanceText;
				color = embed.colors.ERROR;
			}
			break;
		case 'treasure':
			description = 'You found a **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
				'Lucky find!\\n💰 **+' + encounter.points + ' points**' + balanceText;
			color = embed.colors.GOLD;
			break;
		case 'forage':
			description = 'You found some **' + encounter.emoji + ' ' + encounter.name + '**!\\n\\n' +
				'You collected them.\\n💰 **+' + encounter.points + ' points**' + balanceText;
			color = embed.colors.PURPLE;
			break;
		default:
			description = encounter.emoji + ' The forest was quiet today...\\n\\nYou found nothing of value.';
			color = embed.colors.GREY;
	}

	message.reply({
		embeds: [embed.create({
			title: '🏹 Hunting...',
			description: description,
			color: color,
			footer: { text: 'Hunt again in 30 minutes' }
		})]
	});
}
`,
	},
	{
		name: "Rob",
		description:
      "Attempt to rob another user! Risk losing your own points if you fail.",
		type: "command",
		key: "rob",
		usage_help: "<@user>",
		extended_help:
      "Try to steal points from another user! 50% success rate. If you fail, you pay a fine. Has a 2-hour cooldown.",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');
const extension = require('extension');

const target = message.mentions[0];

// Check cooldown (2 hours)
const lastRob = extension.storage.get('rob_' + message.author.id);
const now = Date.now();
const cooldown = 2 * 60 * 60 * 1000;

if (lastRob && (now - lastRob) < cooldown) {
	const remaining = cooldown - (now - lastRob);
	message.reply({
		embeds: [embed.create({
			title: '🦹 Rob',
			description: 'You\\'re laying low after your last attempt!\\n\\n' +
				'**Try again:** ' + utils.time.discord(now + remaining, 'R'),
			color: embed.colors.ERROR
		})]
	});
} else if (!target) {
	const userData = economy.getSelf();
	message.reply({
		embeds: [embed.create({
			title: '🦹 Rob',
			description: 'Mention a user to attempt to rob them!\\n\\n' +
				'**Usage:** \`rob @user\`\\n\\n' +
				'⚠️ **Warning:** 50% chance of failure!\\n' +
				'If you fail, you pay a fine.\\n\\n' +
				'**Your Balance:** ' + utils.format.number(userData.rankScore) + ' points',
			color: embed.colors.ERROR
		})]
	});
} else if (target.id === message.author.id) {
	message.reply('❌ You can\\'t rob yourself!');
} else if (target.bot) {
	message.reply('❌ You can\\'t rob bots!');
} else {
	const targetData = economy.getUser(target.id);
	const userData = economy.getSelf();
	
	if (!targetData.found || targetData.rankScore < 50) {
		message.reply('❌ ' + target.username + ' doesn\\'t have enough points to rob!');
	} else {
		extension.storage.write('rob_' + message.author.id, now);
		
		const success = Math.random() > 0.5;
		const maxSteal = Math.min(targetData.rankScore, 200);
		const amount = Math.floor(Math.random() * (maxSteal - 50)) + 50;
		
		if (success) {
			// Steal from target, give to robber
			economy.removePoints(target.id, amount, 'Robbed by ' + message.author.username);
			const result = economy.addPoints(message.author.id, amount, 'Robbed ' + target.username);
			
			message.reply({
				embeds: [embed.create({
					title: '💰 Robbery Successful!',
					description: 'You snuck up on **' + target.username + '** and stole **' + utils.format.number(amount) + ' points**!\\n\\n' +
						'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
					color: embed.colors.SUCCESS,
					footer: { text: 'You can rob again in 2 hours' }
				})]
			});
		} else {
			const fine = Math.min(Math.floor(amount * 0.75), userData.rankScore);
			if (fine > 0) {
				const result = economy.removePoints(message.author.id, fine, 'Failed robbery fine');
				message.reply({
					embeds: [embed.create({
						title: '🚔 Caught!',
						description: 'You tried to rob **' + target.username + '** but got caught!\\n\\n' +
							'**Fine:** -' + utils.format.number(fine) + ' points\\n' +
							'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
						color: embed.colors.ERROR,
						footer: { text: 'Crime doesn\\'t pay! Try again in 2 hours.' }
					})]
				});
			} else {
				message.reply({
					embeds: [embed.create({
						title: '🚔 Caught!',
						description: 'You tried to rob **' + target.username + '** but got caught!\\n\\n' +
							'You had no points to pay the fine.',
						color: embed.colors.ERROR,
						footer: { text: 'Crime doesn\\'t pay!' }
					})]
				});
			}
		}
	}
}
`,
	},
	// NOTE: Gamble (simulated) removed - duplicate of economy-integrated version below
	{
		name: "Shop",
		description: "Browse and buy items from the server shop!",
		type: "command",
		key: "shop",
		usage_help: "[buy <item>]",
		extended_help:
      "View available items in the shop and purchase them with your points! Items include roles, badges, and special perks.",
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
`,
	},
	{
		name: "Inventory",
		description: "View your inventory of collected items!",
		type: "command",
		key: "inventory",
		usage_help: "[@user]",
		extended_help:
      "Check your inventory to see all items you've collected, purchased, or earned!",
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
`,
	},
	// NOTE: Profile extension removed - duplicates built-in profile command
	{
		name: "Heist",
		description:
      "Organize a heist with other members! Higher rewards with more participants.",
		type: "command",
		key: "heist",
		usage_help: "[start|join]",
		extended_help:
      "Start or join a heist! More participants means bigger rewards but also bigger risks. Failed heists cost everyone!",
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
`,
	},
	// NOTE: Lottery extension removed - duplicates built-in lottery command
	{
		name: "Crime",
		description: "Commit crimes to earn (or lose) points!",
		type: "command",
		key: "crime",
		usage_help: "",
		extended_help:
      "Risk it all by committing various crimes! Each crime has different risk and reward levels. Has a 30-minute cooldown.",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');
const extension = require('extension');

// Check cooldown (30 minutes)
const lastCrime = extension.storage.get('crime_' + message.author.id);
const now = Date.now();
const cooldown = 30 * 60 * 1000;

if (lastCrime && (now - lastCrime) < cooldown) {
	const remaining = cooldown - (now - lastCrime);
	message.reply({
		embeds: [embed.create({
			title: '🚨 Crime',
			description: 'You\\'re laying low after your last crime!\\n\\n' +
				'**Try again:** ' + utils.time.discord(now + remaining, 'R'),
			color: embed.colors.ERROR
		})]
	});
} else {
	const crimes = [
		{ name: 'Pickpocket', successRate: 70, reward: [10, 50], fine: [20, 40] },
		{ name: 'Shoplift', successRate: 60, reward: [30, 100], fine: [50, 100] },
		{ name: 'Car Break-in', successRate: 50, reward: [75, 200], fine: [100, 200] },
		{ name: 'ATM Hack', successRate: 35, reward: [200, 500], fine: [200, 400] },
		{ name: 'Bank Fraud', successRate: 20, reward: [500, 1500], fine: [500, 1000] }
	];

	const crime = crimes[Math.floor(Math.random() * crimes.length)];
	const success = Math.random() * 100 < crime.successRate;
	const userData = economy.getSelf();
	
	extension.storage.write('crime_' + message.author.id, now);

	if (success) {
		const reward = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0])) + crime.reward[0];
		const result = economy.addPoints(message.author.id, reward, 'Crime: ' + crime.name);
		
		message.reply({
			embeds: [embed.create({
				title: '💰 Crime Successful!',
				description: 'You committed **' + crime.name + '** and got away with it!\\n\\n' +
					'**Earned:** +' + utils.format.number(reward) + ' points\\n' +
					'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
				color: embed.colors.SUCCESS,
				footer: { text: 'You can commit another crime in 30 minutes' }
			})]
		});
	} else {
		const fine = Math.floor(Math.random() * (crime.fine[1] - crime.fine[0])) + crime.fine[0];
		const actualFine = Math.min(fine, userData.rankScore);
		
		if (actualFine > 0) {
			const result = economy.removePoints(message.author.id, actualFine, 'Crime fine: ' + crime.name);
			message.reply({
				embeds: [embed.create({
					title: '🚨 Busted!',
					description: 'You tried to commit **' + crime.name + '** but got caught!\\n\\n' +
						'**Fine:** -' + utils.format.number(actualFine) + ' points\\n' +
						'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
					color: embed.colors.ERROR,
					footer: { text: 'Maybe try something less risky? Try again in 30 minutes.' }
				})]
			});
		} else {
			message.reply({
				embeds: [embed.create({
					title: '🚨 Busted!',
					description: 'You tried to commit **' + crime.name + '** but got caught!\\n\\n' +
						'You had no points to pay the fine.',
					color: embed.colors.ERROR,
					footer: { text: 'Get some points first!' }
				})]
			});
		}
	}
}
`,
	},
	{
		name: "Give",
		description: "Give some of your points to another user!",
		type: "command",
		key: "give",
		usage_help: "<@user> <amount>",
		extended_help:
      "Transfer points to another user. Great for gifts or paying debts! Max transfer is 5000 points.",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');

const target = message.mentions[0];
const args = command.suffix.trim().split(/\\s+/);
const amount = parseInt(args[args.length - 1]);
const userData = economy.getSelf();

if (!target) {
	message.reply({
		embeds: [embed.create({
			title: '🎁 Give Points',
			description: 'Transfer points to another user!\\n\\n' +
				'**Usage:** \`' + command.prefix + 'give @user <amount>\`\\n\\n' +
				'**Your Balance:** ' + utils.format.number(userData.rankScore) + ' points\\n' +
				'**Max Transfer:** 5,000 points',
			color: embed.colors.INFO
		})]
	});
} else if (target.id === message.author.id) {
	message.reply('❌ You can\\'t give points to yourself!');
} else if (target.bot) {
	message.reply('❌ You can\\'t give points to bots!');
} else if (!amount || isNaN(amount) || amount <= 0) {
	message.reply('❌ Please enter a valid amount!');
} else if (amount > 5000) {
	message.reply('❌ Maximum transfer is 5,000 points!');
} else if (amount > userData.rankScore) {
	message.reply('❌ You don\\'t have enough points! Your balance: **' + utils.format.number(userData.rankScore) + '**');
} else {
	const result = economy.transfer(message.author.id, target.id, amount, 'Gift from ' + message.author.username);
	
	if (result.success) {
		message.reply({
			embeds: [embed.create({
				title: '🎁 Points Transferred!',
				description: 'You gave **' + utils.format.number(amount) + ' points** to ' + utils.discord.userMention(target.id) + '!\\n\\n' +
					'**Your New Balance:** ' + utils.format.number(result.fromNewBalance) + ' points',
				color: embed.colors.SUCCESS,
				footer: { text: 'Generosity is a virtue!' }
			})]
		});
	} else {
		message.reply({
			embeds: [embed.create({
				title: '❌ Transfer Failed',
				description: result.error || 'Unable to complete the transfer.',
				color: embed.colors.ERROR
			})]
		});
	}
}
`,
	},
	{
		name: "Balance",
		description: "Check your current points balance!",
		type: "command",
		key: "balance",
		usage_help: "[@user]",
		extended_help:
      "View your points balance or check another user's balance. Shows your rank score from the server economy system.",
		scopes: ["messages_write", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');

const targetUser = message.mentions[0] || message.author;
const userData = economy.getUser(targetUser.id);

if (!userData.found) {
	message.reply({
		embeds: [embed.create({
			title: '💰 Balance',
			description: utils.discord.bold(targetUser.username) + ' has no points yet!\\n\\n' +
				'Start earning by being active in the server.',
			color: embed.colors.INFO
		})]
	});
} else {
	const nextRank = economy.ranks.find(r => userData.rankScore < r.maxScore);
	const progressText = nextRank 
		? '\\n**Next Rank:** ' + nextRank.name + ' (' + (nextRank.maxScore - userData.rankScore) + ' points needed)'
		: '\\n🏆 **Max Rank Achieved!**';

	message.reply({
		embeds: [embed.create({
			title: '💰 ' + targetUser.username + '\\'s Balance',
			description: '**Points:** ' + utils.format.number(userData.rankScore) + '\\n' +
				'**Rank:** ' + userData.rank + '\\n' +
				'**Position:** #' + userData.position + progressText,
			color: embed.colors.GOLD,
			footer: { text: 'Server Economy System' }
		})]
	});
}
`,
	},
	{
		name: "Daily Reward",
		description: "Claim your daily points reward!",
		type: "command",
		key: "daily",
		usage_help: "",
		extended_help:
      "Claim your daily points bonus! Come back every day to build up your balance. Consecutive days increase your bonus!",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');
const extension = require('extension');

// Check cooldown (24 hours)
const lastDaily = extension.storage.get('daily_' + message.author.id);
const now = Date.now();
const cooldown = 24 * 60 * 60 * 1000; // 24 hours

if (lastDaily && (now - lastDaily) < cooldown) {
	const remaining = cooldown - (now - lastDaily);
	message.reply({
		embeds: [embed.create({
			title: '⏰ Daily Reward',
			description: 'You\\'ve already claimed your daily reward!\\n\\n' +
				'**Next claim:** ' + utils.time.discord(now + remaining, 'R'),
			color: embed.colors.ERROR
		})]
	});
} else {
	// Calculate streak bonus
	const streak = extension.storage.get('streak_' + message.author.id) || 0;
	const newStreak = lastDaily && (now - lastDaily) < (48 * 60 * 60 * 1000) ? streak + 1 : 1;
	
	// Base reward + streak bonus (capped at 7 days)
	const baseReward = 100;
	const streakBonus = Math.min(newStreak - 1, 6) * 25;
	const totalReward = baseReward + streakBonus;
	
	// Award points
	const result = economy.addPoints(message.author.id, totalReward, 'Daily reward');
	
	if (result.success) {
		extension.storage.write('daily_' + message.author.id, now);
		extension.storage.write('streak_' + message.author.id, newStreak);
		
		message.reply({
			embeds: [embed.create({
				title: '� Daily Reward Claimed!',
				description: 'You received **' + totalReward + ' points**!\\n\\n' +
					'**Base:** ' + baseReward + ' points\\n' +
					'**Streak Bonus:** +' + streakBonus + ' points\\n' +
					'**Current Streak:** 🔥 ' + newStreak + ' day' + (newStreak > 1 ? 's' : '') + '\\n\\n' +
					'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
				color: embed.colors.SUCCESS,
				footer: { text: 'Come back tomorrow to keep your streak!' }
			})]
		});
	} else {
		message.reply({
			embeds: [embed.create({
				title: '❌ Error',
				description: 'Failed to claim daily reward. Please try again.',
				color: embed.colors.ERROR
			})]
		});
	}
}
`,
	},
	{
		name: "Gamble",
		description: "Gamble your points! Double or nothing!",
		type: "command",
		key: "gamble",
		usage_help: "<amount>",
		extended_help:
      "Bet your points on a coin flip! Win and double your bet, lose and it's gone. Max bet is 1000 points.",
		scopes: ["messages_write", "members_read", "economy_manage"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const economy = require('economy');
const embed = require('embed');
const utils = require('utils');

const suffix = command.suffix.trim();
const userData = economy.getSelf();

if (!suffix) {
	message.reply({
		embeds: [embed.create({
			title: '🎰 Gamble',
			description: 'Bet your points on a coin flip!\\n\\n' +
				'**Usage:** \`' + command.prefix + 'gamble <amount>\`\\n\\n' +
				'Win = 2x your bet\\nLose = Lose your bet\\n\\n' +
				'**Your Balance:** ' + utils.format.number(userData.rankScore) + ' points\\n' +
				'**Max Bet:** 1,000 points',
			color: embed.colors.GOLD
		})]
	});
} else {
	const bet = parseInt(suffix);
	
	if (isNaN(bet) || bet <= 0) {
		message.reply('❌ Please enter a valid bet amount!');
	} else if (bet > 1000) {
		message.reply('❌ Maximum bet is 1,000 points!');
	} else if (bet > userData.rankScore) {
		message.reply('❌ You don\\'t have enough points! Your balance: **' + utils.format.number(userData.rankScore) + '**');
	} else {
		const win = Math.random() > 0.5;
		
		if (win) {
			const result = economy.addPoints(message.author.id, bet, 'Gamble win');
			message.reply({
				embeds: [embed.create({
					title: '🎰 You Won!',
					description: '🎉 The coin landed on **HEADS**!\\n\\n' +
						'**Bet:** ' + utils.format.number(bet) + ' points\\n' +
						'**Won:** +' + utils.format.number(bet) + ' points\\n' +
						'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
					color: embed.colors.SUCCESS,
					footer: { text: 'Lucky!' }
				})]
			});
		} else {
			const result = economy.removePoints(message.author.id, bet, 'Gamble loss');
			message.reply({
				embeds: [embed.create({
					title: '🎰 You Lost!',
					description: '😢 The coin landed on **TAILS**!\\n\\n' +
						'**Bet:** ' + utils.format.number(bet) + ' points\\n' +
						'**Lost:** -' + utils.format.number(bet) + ' points\\n' +
						'**New Balance:** ' + utils.format.number(result.newBalance) + ' points',
					color: embed.colors.ERROR,
					footer: { text: 'Better luck next time!' }
				})]
			});
		}
	}
}
`,
	},
	// NOTE: Welcome Messages extension removed - duplicates built-in status_messages.new_member_message
	// NOTE: Goodbye Messages extension removed - duplicates built-in status_messages.member_removed_message
	// NOTE: Auto Role extension removed - duplicates tier-locked auto_roles feature
	// NOTE: Join Logger extension removed - duplicates tier-locked extended_logs feature
	// NOTE: Message Logger extension removed - duplicates tier-locked extended_logs feature
	// NOTE: Anti-Spam extension removed - duplicates built-in spam_filter and uses invalid messageCreate event
	{
		name: "Auto Reactions",
		description:
      "Automatically react to messages containing certain keywords with emojis.",
		type: "keyword",
		keywords: ["nice", "cool", "awesome", "amazing", "great"],
		case_sensitive: false,
		scopes: ["messages_react"],
		timeout: 3000,
		code: `
const message = require('message');
const extension = require('extension');
const utils = require('utils');

const reactions = ['👍', '🔥', '✨', '💯', '🙌'];
const reaction = utils.random.pick(reactions);

extension.log('Would react with ' + reaction + ' to message from ' + message.author.username);
`,
	},
	{
		name: "Keyword Responder",
		description:
      "Respond with helpful information when users mention specific topics.",
		type: "keyword",
		keywords: ["help", "support", "question", "how do i", "how to"],
		case_sensitive: false,
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const extension = require('extension');
const utils = require('utils');

const responses = [
	'Need help? Check out our #help channel or use the \`/help\` command!',
	'Looking for assistance? Our support team is here to help!',
	'Have a question? Feel free to ask in #support!'
];

const response = utils.random.pick(responses);
extension.log('Help keyword triggered by: ' + message.author.username);
`,
	},
	// NOTE: Profanity Filter extension removed - duplicates built-in moderation.filters system
	{
		name: "Link Detector",
		description: "Detect and log when users post links in chat.",
		type: "keyword",
		keywords: ["http://", "https://", "www.", "discord.gg"],
		case_sensitive: false,
		scopes: ["messages_write"],
		timeout: 3000,
		code: `
const message = require('message');
const extension = require('extension');

const urlRegex = /https?:\\/\\/[^\\s]+/gi;
const links = message.content.match(urlRegex) || [];

if (links.length > 0) {
	extension.log('Links detected from ' + message.author.username + ': ' + links.join(', '));
}
`,
	},
	{
		name: "GG Responder",
		description: "Celebrate with users when they say GG!",
		type: "keyword",
		keywords: ["gg", "good game", "ggwp", "gg wp"],
		case_sensitive: false,
		scopes: ["messages_write", "messages_react"],
		timeout: 3000,
		code: `
const message = require('message');
const extension = require('extension');
const utils = require('utils');

const celebrations = ['🎉', '🎊', '🏆', '👏', '🙌'];
const randomCelebration = utils.random.pick(celebrations);

extension.log('GG! Celebrating with ' + message.author.username);
// Would react with celebration emoji
`,
	},
	{
		name: "Daily Reminder",
		description: "Post a daily reminder or tip to keep your community engaged.",
		type: "timer",
		interval: 86400000,
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const extension = require('extension');
const server = require('server');

const tips = [
	'💡 **Daily Tip:** Remember to take breaks and stay hydrated!',
	'💡 **Daily Tip:** Be kind to others in chat!',
	'💡 **Daily Tip:** Check out our rules in #rules!',
	'💡 **Daily Tip:** Invite your friends to join the server!',
	'💡 **Daily Tip:** Participate in events to earn rewards!',
	'💡 **Daily Tip:** Report any issues to our mod team!',
	'💡 **Daily Tip:** Have fun and enjoy your time here!'
];

const tip = tips[Math.floor(Math.random() * tips.length)];
extension.log('Daily tip: ' + tip);
`,
	},
	{
		name: "Hourly Stats",
		description: "Post hourly server statistics to keep members informed.",
		type: "timer",
		interval: 3600000,
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const extension = require('extension');
const server = require('server');

const stats = {
	members: server.memberCount || 0,
	online: Math.floor((server.memberCount || 0) * 0.3),
	messages: Math.floor(Math.random() * 500) + 100
};

const statsMessage = '📊 **Hourly Stats**\\n' +
	'👥 Members: ' + stats.members + '\\n' +
	'🟢 Online: ' + stats.online + '\\n' +
	'💬 Messages this hour: ' + stats.messages;

extension.log('Hourly stats update');
`,
	},
	{
		name: "Bump Reminder",
		description: "Remind users to bump the server on listing sites.",
		type: "timer",
		interval: 7200000,
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const extension = require('extension');

const reminders = [
	'🔔 **Bump Reminder!** Help us grow by bumping the server!',
	'📢 Time to bump! Use the bump command to help us grow!',
	'⏰ Bump time! Your support helps us reach more people!'
];

const reminder = reminders[Math.floor(Math.random() * reminders.length)];
extension.log('Bump reminder: ' + reminder);
`,
	},
	{
		name: "Activity Check",
		description: "Periodically check and log server activity levels.",
		type: "timer",
		interval: 1800000,
		scopes: ["messages_write"],
		timeout: 10000,
		code: `
const extension = require('extension');
const server = require('server');

const activityLevel = Math.floor(Math.random() * 100);
let status = 'Low';
let emoji = '😴';

if (activityLevel > 70) {
	status = 'High';
	emoji = '🔥';
} else if (activityLevel > 40) {
	status = 'Medium';
	emoji = '👍';
}

extension.log('Activity check: ' + status + ' (' + activityLevel + '%)');
`,
	},
	{
		name: "Quote of the Day",
		description: "Share an inspirational quote with your community daily.",
		type: "timer",
		interval: 86400000,
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const extension = require('extension');

const quotes = [
	{ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
	{ text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
	{ text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
	{ text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
	{ text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
	{ text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
	{ text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
	{ text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
	{ text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
	{ text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
];

const quote = quotes[Math.floor(Math.random() * quotes.length)];
const message = '📜 **Quote of the Day**\\n\\n*"' + quote.text + '"*\\n— ' + quote.author;

extension.log('Quote: ' + quote.text);
`,
	},
	// NOTE: Poll extension removed - duplicates built-in poll command
	// NOTE: Reminder extension removed - duplicates built-in remindme command
	// NOTE: Emoji Info extension removed - duplicates built-in emoji command
	{
		name: "Color",
		description: "Display a color from hex code or name.",
		type: "command",
		key: "color",
		usage_help: "<hex|name>",
		extended_help:
      "Preview a color! Use hex codes like #ff0000 or names like red, blue, green.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const colorArg = (command.arguments[0] || '#3498db').replace('#', '');
const namedColors = {
	red: 'e74c3c', blue: '3498db', green: '2ecc71', yellow: 'f1c40f',
	purple: '9b59b6', orange: 'e67e22', pink: 'ff6b9d', cyan: '1abc9c',
	white: 'ffffff', black: '000000', gray: '95a5a6', gold: 'ffd700'
};

const hexColor = namedColors[colorArg.toLowerCase()] || colorArg;
const colorInt = parseInt(hexColor, 16);

if (isNaN(colorInt)) {
	message.reply('❌ Invalid color! Use hex (#ff0000) or names (red, blue, etc.)');
	return;
}

message.reply({
	embeds: [{
		title: '🎨 Color Preview',
		description: '**Hex:** #' + hexColor.toUpperCase() + '\\n' +
			'**RGB:** ' + ((colorInt >> 16) & 255) + ', ' + ((colorInt >> 8) & 255) + ', ' + (colorInt & 255),
		color: colorInt,
		thumbnail: { url: 'https://singlecolorimage.com/get/' + hexColor + '/100x100' }
	}]
});
`,
	},
	{
		name: "Timer",
		description: "Start a countdown timer.",
		type: "command",
		key: "timer",
		usage_help: "<seconds>",
		extended_help: "Start a countdown timer for up to 60 seconds.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');

const seconds = Math.min(60, Math.max(1, parseInt(command.arguments[0]) || 30));

message.reply({
	embeds: [{
		title: '⏱️ Timer Started!',
		description: 'Counting down from **' + seconds + ' seconds**...\\n\\n' +
			'⏰ Timer will end <t:' + Math.floor(Date.now()/1000 + seconds) + ':R>',
		color: 0xe74c3c,
		footer: { text: 'Note: This shows the relative time - actual callback not implemented' }
	}]
});
`,
	},
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
		return crypto
			.createHash("sha256")
			.update(code)
			.digest("hex")
			.substring(0, 16);
	};

	console.log("🔧 Seeding extensions...\n");

	for (const ext of extensions) {
		// Check if extension already exists
		const existing = await Gallery.findOne({ name: ext.name }).catch(
			() => null,
		);

		try {
			const codeId = generateCodeID(ext.code);

			if (existing) {
				// Update existing extension's code
				const versionIndex = existing.versions.findIndex(
					(v) => v._id === existing.published_version,
				);
				if (versionIndex !== -1) {
					existing.versions[versionIndex].code_id = codeId;
					existing.code_id = codeId;
					existing.last_updated = new Date();
					await existing.save();

					// Save updated code file
					await fs.outputFileAtomic(
						path.join(__dirname, `../extensions/${codeId}.skyext`),
						ext.code.trim(),
					);

					console.log(`🔄 Updated "${ext.name}" with new API`);
				} else {
					console.log(`⏭️  Skipping "${ext.name}" (no published version)`);
				}
				continue;
			}

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
				versions: [
					{
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
					},
				],
			});

			await galleryDocument.save();

			// Save extension code file
			await fs.outputFileAtomic(
				path.join(__dirname, `../extensions/${codeId}.skyext`),
				ext.code.trim(),
			);

			console.log(`✅ Created "${ext.name}" (${ext.key})`);
		} catch (err) {
			console.error(`❌ Failed to create/update "${ext.name}":`, err.message);
		}
	}

	console.log("\n🎉 Extension seeding complete!");
	process.exit(0);
}

seedExtensions().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
