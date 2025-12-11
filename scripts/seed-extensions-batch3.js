/**
 * Seed script for Batch 3 extensions
 * Run with: node scripts/seed-extensions-batch3.js
 */

const path = require("path");
const fs = require("fs-nextra");

const extensions = [
	{
		name: "UNO",
		description: "Play UNO against the bot! Match colors or numbers.",
		type: "command",
		key: "uno",
		usage_help: "[play <card>|draw|status]",
		extended_help: "Play UNO! Commands: uno (start), uno play <color> <value>, uno draw, uno status",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const colors = ['🔴', '🟡', '🟢', '🔵'];
const colorNames = ['red', 'yellow', 'green', 'blue'];
const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'];

const stateKey = 'uno_' + message.author.id;
let game = extension.storage.get(stateKey);
const args = command.suffix.trim().toLowerCase().split(/\\s+/);
const action = args[0];

function createCard() {
	return {
		color: utils.random.int(0, 3),
		value: utils.random.pick(values),
	};
}

function cardToString(card) {
	return colors[card.color] + ' ' + card.value;
}

function canPlay(card, topCard) {
	return card.color === topCard.color || card.value === topCard.value;
}

if (!game || action === 'new') {
	const playerHand = Array(7).fill().map(() => createCard());
	const botHand = Array(7).fill().map(() => createCard());
	game = {
		playerHand,
		botHand,
		topCard: createCard(),
		turn: 'player',
	};
	extension.storage.write(stateKey, game);
	
	const handStr = game.playerHand.map((c, i) => (i + 1) + '. ' + cardToString(c)).join('\\n');
	message.reply({
		embeds: [embed.create({
			title: '🎴 UNO - New Game!',
			description: '**Top Card:** ' + cardToString(game.topCard) + '\\n\\n**Your Hand:**\\n' + handStr,
			color: embed.colors.GOLD,
			footer: { text: 'Play: uno play <#> | Draw: uno draw' },
		})]
	});
	return;
}

if (action === 'status' || !action) {
	const handStr = game.playerHand.map((c, i) => (i + 1) + '. ' + cardToString(c)).join('\\n');
	message.reply({
		embeds: [embed.create({
			title: '🎴 UNO Status',
			description: '**Top Card:** ' + cardToString(game.topCard) + '\\n\\n**Your Hand (' + game.playerHand.length + '):**\\n' + handStr + '\\n\\n**Bot Cards:** ' + game.botHand.length,
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (action === 'draw') {
	game.playerHand.push(createCard());
	extension.storage.write(stateKey, game);
	message.reply('📥 Drew a card: ' + cardToString(game.playerHand[game.playerHand.length - 1]));
	return;
}

if (action === 'play') {
	const cardIndex = parseInt(args[1]) - 1;
	if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= game.playerHand.length) {
		message.reply('❌ Invalid card number!');
		return;
	}
	
	const card = game.playerHand[cardIndex];
	if (!canPlay(card, game.topCard)) {
		message.reply('❌ Cannot play ' + cardToString(card) + ' on ' + cardToString(game.topCard));
		return;
	}
	
	game.topCard = card;
	game.playerHand.splice(cardIndex, 1);
	
	if (game.playerHand.length === 0) {
		extension.storage.write(stateKey, null);
		message.reply({
			embeds: [embed.create({
				title: '🎉 UNO - You Win!',
				description: 'Congratulations! You played all your cards!',
				color: embed.colors.SUCCESS,
			})]
		});
		return;
	}
	
	// Bot turn
	const playable = game.botHand.findIndex(c => canPlay(c, game.topCard));
	if (playable !== -1) {
		game.topCard = game.botHand[playable];
		game.botHand.splice(playable, 1);
	} else {
		game.botHand.push(createCard());
	}
	
	if (game.botHand.length === 0) {
		extension.storage.write(stateKey, null);
		message.reply({
			embeds: [embed.create({
				title: '😢 UNO - Bot Wins!',
				description: 'The bot played all its cards first!',
				color: embed.colors.ERROR,
			})]
		});
		return;
	}
	
	extension.storage.write(stateKey, game);
	const handStr = game.playerHand.map((c, i) => (i + 1) + '. ' + cardToString(c)).join('\\n');
	message.reply({
		embeds: [embed.create({
			title: '🎴 UNO',
			description: '**Top Card:** ' + cardToString(game.topCard) + '\\n\\n**Your Hand:**\\n' + handStr + '\\n\\n**Bot Cards:** ' + game.botHand.length,
			color: embed.colors.GOLD,
		})]
	});
}
`,
	},
	{
		name: "Chess",
		description: "Play a simplified chess puzzle!",
		type: "command",
		key: "chess",
		usage_help: "[move]",
		extended_help: "Chess puzzles! Find the best move. Format: chess e2e4",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const puzzles = [
	{
		name: "Scholar's Mate",
		board: '♜♞♝♛♚♝♞♜\\n♟♟♟♟♟♟♟♟\\n........\\n........\\n....♙...\\n........\\n♙♙♙♙.♙♙♙\\n♖♘♗♕♔♗♘♖',
		solution: 'f1c4',
		hint: 'Attack f7 with the bishop',
	},
	{
		name: "Back Rank Mate",
		board: '....♜.♚.\\n........\\n........\\n........\\n........\\n........\\n........\\n♖...♔...', 
		solution: 'a1a8',
		hint: 'Use the rook to deliver checkmate',
	},
	{
		name: "Fork the King and Queen",
		board: '..♚.....\\n........\\n....♛...\\n........\\n........\\n....♘...\\n........\\n....♔...',
		solution: 'e3d5',
		hint: 'The knight can attack two pieces at once',
	},
];

const stateKey = 'chess_' + message.author.id;
let game = extension.storage.get(stateKey);
const move = command.suffix.trim().toLowerCase();

if (!game || move === 'new') {
	const puzzle = utils.random.pick(puzzles);
	game = { puzzle: puzzle, attempts: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '♟️ Chess Puzzle: ' + puzzle.name,
			description: '\`\`\`\\n' + puzzle.board + '\\n\`\`\`\\n\\n**Find the best move!**\\nFormat: \`chess e2e4\`',
			color: embed.colors.BLUE,
			footer: { text: 'Hint: ' + puzzle.hint },
		})]
	});
	return;
}

if (!move) {
	message.reply({
		embeds: [embed.create({
			title: '♟️ Current Puzzle: ' + game.puzzle.name,
			description: '\`\`\`\\n' + game.puzzle.board + '\\n\`\`\`\\n\\nAttempts: ' + game.attempts,
			color: embed.colors.BLUE,
			footer: { text: 'Hint: ' + game.puzzle.hint },
		})]
	});
	return;
}

game.attempts++;

if (move === game.puzzle.solution) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '✅ Correct!',
			description: 'You solved the puzzle in **' + game.attempts + '** ' + utils.format.pluralize(game.attempts, 'attempt') + '!',
			color: embed.colors.SUCCESS,
		})]
	});
} else {
	extension.storage.write(stateKey, game);
	message.reply({
		embeds: [embed.create({
			title: '❌ Not quite...',
			description: 'That\\'s not the best move. Try again!\\nAttempts: ' + game.attempts,
			color: embed.colors.ERROR,
			footer: { text: 'Hint: ' + game.puzzle.hint },
		})]
	});
}
`,
	},
	{
		name: "Story Chain",
		description: "Collaboratively write a story one sentence at a time!",
		type: "command",
		key: "story",
		usage_help: "[add <sentence>|view|new]",
		extended_help: "Build a story together! Each person adds one sentence.",
		scopes: ["messages_write", "channels_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const storyKey = 'story_' + message.channel.id;
let story = extension.storage.get(storyKey);
const args = command.suffix.trim().split(/\\s+/);
const action = args[0]?.toLowerCase();

if (action === 'new') {
	story = { sentences: [], contributors: [], lastAuthor: null };
	extension.storage.write(storyKey, story);
	message.reply({
		embeds: [embed.create({
			title: '📖 New Story Started!',
			description: 'A blank page awaits...\\n\\nAdd the first sentence with:\\n\`story add Once upon a time...\`',
			color: embed.colors.GREEN,
		})]
	});
	return;
}

if (!story) {
	message.reply('📖 No story in progress. Start one with \`story new\`');
	return;
}

if (action === 'view' || !action) {
	if (story.sentences.length === 0) {
		message.reply('📖 The story is empty! Add the first sentence.');
		return;
	}
	
	const storyText = story.sentences.join(' ');
	const contributors = utils.array.unique(story.contributors);
	
	message.reply({
		embeds: [embed.create({
			title: '📖 Story So Far',
			description: storyText,
			color: embed.colors.BLUE,
			footer: { text: story.sentences.length + ' sentences by ' + contributors.length + ' contributors' },
		})]
	});
	return;
}

if (action === 'add') {
	const sentence = args.slice(1).join(' ');
	
	if (!sentence || sentence.length < 5) {
		message.reply('❌ Please provide a sentence (at least 5 characters)');
		return;
	}
	
	if (sentence.length > 200) {
		message.reply('❌ Sentence too long! Max 200 characters.');
		return;
	}
	
	if (story.lastAuthor === message.author.id) {
		message.reply('⏳ Let someone else add to the story first!');
		return;
	}
	
	story.sentences.push(sentence);
	story.contributors.push(message.author.id);
	story.lastAuthor = message.author.id;
	extension.storage.write(storyKey, story);
	
	message.reply({
		embeds: [embed.create({
			title: '✏️ Sentence Added!',
			description: '"' + sentence + '"\\n\\n*- ' + message.author.username + '*',
			color: embed.colors.SUCCESS,
			footer: { text: 'Story now has ' + story.sentences.length + ' sentences' },
		})]
	});
}
`,
	},
	{
		name: "Flashcards",
		description: "Create and study flashcards!",
		type: "command",
		key: "flashcards",
		usage_help: "[add|study|list|delete]",
		extended_help: "Study tool! Create flashcards and quiz yourself.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const deckKey = 'flashcards_' + message.author.id;
let deck = extension.storage.get(deckKey) || { cards: [], studying: null };
const args = command.suffix.trim().split('|').map(s => s.trim());
const action = args[0]?.toLowerCase();

if (action === 'add') {
	const front = args[1];
	const back = args[2];
	
	if (!front || !back) {
		message.reply('❌ Usage: \`flashcards add | front text | back text\`');
		return;
	}
	
	if (deck.cards.length >= 50) {
		message.reply('❌ Deck is full! Max 50 cards.');
		return;
	}
	
	deck.cards.push({ front, back, correct: 0, attempts: 0 });
	extension.storage.write(deckKey, deck);
	
	message.reply({
		embeds: [embed.create({
			title: '📝 Card Added!',
			description: '**Front:** ' + front + '\\n**Back:** ' + back,
			color: embed.colors.SUCCESS,
			footer: { text: 'Deck size: ' + deck.cards.length },
		})]
	});
	return;
}

if (action === 'list') {
	if (deck.cards.length === 0) {
		message.reply('📚 No flashcards yet! Add some with \`flashcards add | front | back\`');
		return;
	}
	
	const list = deck.cards.slice(0, 10).map((c, i) => 
		(i + 1) + '. ' + utils.text.truncate(c.front, 30) + ' → ' + utils.text.truncate(c.back, 30)
	).join('\\n');
	
	message.reply({
		embeds: [embed.create({
			title: '📚 Your Flashcards',
			description: list,
			color: embed.colors.BLUE,
			footer: { text: 'Showing ' + Math.min(10, deck.cards.length) + ' of ' + deck.cards.length },
		})]
	});
	return;
}

if (action === 'study') {
	if (deck.cards.length === 0) {
		message.reply('📚 No flashcards to study! Add some first.');
		return;
	}
	
	const card = utils.random.pick(deck.cards);
	deck.studying = deck.cards.indexOf(card);
	extension.storage.write(deckKey, deck);
	
	message.reply({
		embeds: [embed.create({
			title: '🎓 Study Time!',
			description: '**Question:**\\n' + card.front + '\\n\\n*Think of the answer, then type \`flashcards reveal\`*',
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (action === 'reveal') {
	if (deck.studying === null) {
		message.reply('❓ Not studying! Use \`flashcards study\` first.');
		return;
	}
	
	const card = deck.cards[deck.studying];
	deck.studying = null;
	extension.storage.write(deckKey, deck);
	
	message.reply({
		embeds: [embed.create({
			title: '💡 Answer',
			description: '**Question:** ' + card.front + '\\n\\n**Answer:** ' + card.back,
			color: embed.colors.SUCCESS,
			footer: { text: 'Use: flashcards study for another card' },
		})]
	});
	return;
}

message.reply({
	embeds: [embed.create({
		title: '📚 Flashcards Help',
		description: '**Commands:**\\n' +
			'\`flashcards add | front | back\` - Add a card\\n' +
			'\`flashcards list\` - View your cards\\n' +
			'\`flashcards study\` - Study a random card\\n' +
			'\`flashcards reveal\` - Show the answer',
		color: embed.colors.BLUE,
		footer: { text: 'Your deck: ' + deck.cards.length + ' cards' },
	})]
});
`,
	},
	{
		name: "ASCII Art",
		description: "Generate ASCII text art!",
		type: "command",
		key: "ascii",
		usage_help: "<text>",
		extended_help: "Convert text to ASCII art! Max 10 characters.",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const utils = require('utils');

const text = command.suffix.trim().toUpperCase().slice(0, 10);

if (!text) {
	message.reply('❌ Usage: \`ascii <text>\` (max 10 characters)');
	return;
}

const font = {
	'A': ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
	'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
	'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
	'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
	'E': ['█████', '█    ', '████ ', '█    ', '█████'],
	'F': ['█████', '█    ', '████ ', '█    ', '█    '],
	'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
	'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
	'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
	'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
	'K': ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
	'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
	'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
	'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
	'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
	'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
	'Q': [' ███ ', '█   █', '█ █ █', '█  █ ', ' ██ █'],
	'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
	'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
	'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
	'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
	'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
	'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
	'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
	'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
	'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
	'0': [' ███ ', '█  ██', '█ █ █', '██  █', ' ███ '],
	'1': ['  █  ', ' ██  ', '  █  ', '  █  ', ' ███ '],
	'2': [' ███ ', '█   █', '  ██ ', ' █   ', '█████'],
	'3': ['████ ', '    █', ' ███ ', '    █', '████ '],
	'4': ['█   █', '█   █', '█████', '    █', '    █'],
	'5': ['█████', '█    ', '████ ', '    █', '████ '],
	'6': [' ███ ', '█    ', '████ ', '█   █', ' ███ '],
	'7': ['█████', '   █ ', '  █  ', ' █   ', '█    '],
	'8': [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
	'9': [' ███ ', '█   █', ' ████', '    █', ' ███ '],
	' ': ['     ', '     ', '     ', '     ', '     '],
	'!': ['  █  ', '  █  ', '  █  ', '     ', '  █  '],
	'?': [' ███ ', '█   █', '  ██ ', '     ', '  █  '],
};

let lines = ['', '', '', '', ''];
for (const char of text) {
	const charArt = font[char] || font['?'];
	for (let i = 0; i < 5; i++) {
		lines[i] += charArt[i] + ' ';
	}
}

const result = lines.join('\\n');
message.reply('\`\`\`\\n' + result + '\\n\`\`\`');
`,
	},
	{
		name: "Highlow",
		description: "Guess if the next card is higher or lower!",
		type: "command",
		key: "highlow",
		usage_help: "[high|low]",
		extended_help: "Guess if the next card will be higher or lower. Build a streak!",
		scopes: ["messages_write", "economy_manage", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const economy = require('economy');
const utils = require('utils');
const embed = require('embed');

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠️', '♥️', '♦️', '♣️'];

function cardValue(card) {
	return cards.indexOf(card);
}

function drawCard() {
	return { rank: utils.random.pick(cards), suit: utils.random.pick(suits) };
}

const stateKey = 'highlow_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim().toLowerCase();

if (!game || guess === 'new') {
	const card = drawCard();
	game = { card, streak: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🃏 High/Low',
			description: '**Current Card:** ' + game.card.rank + game.card.suit + '\\n\\nWill the next card be **higher** or **lower**?\\n\\n\`highlow high\` or \`highlow low\`',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (guess !== 'high' && guess !== 'low') {
	message.reply({
		embeds: [embed.create({
			title: '🃏 High/Low',
			description: '**Current Card:** ' + game.card.rank + game.card.suit + '\\nStreak: ' + game.streak + '\\n\\n\`highlow high\` or \`highlow low\`\\n\`highlow cash\` to collect ' + (game.streak * 10) + ' points',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (guess === 'cash' && game.streak > 0) {
	const reward = game.streak * 10;
	economy.addPoints(message.author.id, reward, 'Highlow cashout');
	extension.storage.write(stateKey, null);
	message.reply('💰 Cashed out **' + reward + '** points with a ' + game.streak + ' streak!');
	return;
}

const newCard = drawCard();
const oldValue = cardValue(game.card.rank);
const newValue = cardValue(newCard.rank);

let won = false;
if (guess === 'high' && newValue > oldValue) won = true;
if (guess === 'low' && newValue < oldValue) won = true;
if (newValue === oldValue) won = true; // Tie = win

if (won) {
	game.card = newCard;
	game.streak++;
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '✅ Correct!',
			description: '**New Card:** ' + newCard.rank + newCard.suit + '\\n**Streak:** ' + game.streak + ' 🔥\\n\\nKeep going or \`highlow cash\` for ' + (game.streak * 10) + ' points!',
			color: embed.colors.SUCCESS,
		})]
	});
} else {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '❌ Wrong!',
			description: 'The card was ' + newCard.rank + newCard.suit + '\\n\\nStreak lost: ' + game.streak,
			color: embed.colors.ERROR,
		})]
	});
}
`,
	},
	{
		name: "Anagram",
		description: "Solve anagram puzzles!",
		type: "command",
		key: "anagram",
		usage_help: "[answer]",
		extended_help: "Unscramble the letters to find the hidden word!",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const words = [
	'DISCORD', 'GAMING', 'STREAM', 'FRIEND', 'SERVER',
	'CHANNEL', 'MESSAGE', 'EMOJI', 'REACT', 'VOICE',
	'MUSIC', 'ROBOT', 'DRAGON', 'WIZARD', 'CASTLE',
	'KNIGHT', 'SWORD', 'SHIELD', 'MAGIC', 'QUEST',
	'PIRATE', 'OCEAN', 'ISLAND', 'TREASURE', 'JUNGLE',
	'MONKEY', 'BANANA', 'COFFEE', 'PIZZA', 'BURGER',
];

const stateKey = 'anagram_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim().toUpperCase();

if (!game || guess === 'NEW') {
	const word = utils.random.pick(words);
	const scrambled = utils.random.shuffle(word.split('')).join('');
	game = { word, scrambled, hints: 0 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🔤 Anagram',
			description: 'Unscramble this word:\\n\\n**' + scrambled.split('').join(' ') + '**\\n\\n(' + word.length + ' letters)',
			color: embed.colors.GOLD,
			footer: { text: 'Type: anagram <your guess> | anagram hint' },
		})]
	});
	return;
}

if (guess === 'HINT') {
	if (game.hints >= 2) {
		message.reply('❌ No more hints! You\\'ve used 2 already.');
		return;
	}
	game.hints++;
	const revealed = game.word.slice(0, game.hints);
	extension.storage.write(stateKey, game);
	
	message.reply('💡 Hint: The word starts with **' + revealed + '**...');
	return;
}

if (!guess) {
	message.reply({
		embeds: [embed.create({
			title: '🔤 Current Anagram',
			description: '**' + game.scrambled.split('').join(' ') + '**\\n\\n(' + game.word.length + ' letters)',
			color: embed.colors.BLUE,
		})]
	});
	return;
}

if (guess === game.word) {
	extension.storage.write(stateKey, null);
	const bonus = game.hints === 0 ? ' (+bonus for no hints!)' : '';
	message.reply({
		embeds: [embed.create({
			title: '🎉 Correct!',
			description: 'The word was **' + game.word + '**!' + bonus,
			color: embed.colors.SUCCESS,
		})]
	});
} else {
	message.reply('❌ Not quite! Try again.');
}
`,
	},
	{
		name: "Mastermind",
		description: "Crack the secret color code!",
		type: "command",
		key: "mastermind",
		usage_help: "[colors]",
		extended_help: "Guess the 4-color code! Colors: R(ed), G(reen), B(lue), Y(ellow), P(urple), O(range)",
		scopes: ["messages_write"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const colors = { R: '🔴', G: '🟢', B: '🔵', Y: '🟡', P: '🟣', O: '🟠' };
const colorKeys = Object.keys(colors);

const stateKey = 'mastermind_' + message.author.id;
let game = extension.storage.get(stateKey);
const guess = command.suffix.trim().toUpperCase().replace(/\\s/g, '');

if (!game || guess === 'NEW') {
	const code = Array(4).fill().map(() => utils.random.pick(colorKeys));
	game = { code, guesses: [], maxGuesses: 10 };
	extension.storage.write(stateKey, game);
	
	message.reply({
		embeds: [embed.create({
			title: '🎯 Mastermind',
			description: 'I\\'ve created a secret 4-color code!\\n\\n**Colors:** 🔴R 🟢G 🔵B 🟡Y 🟣P 🟠O\\n\\nGuess with: \`mastermind RGBY\`\\n\\n⚫ = Right color, right spot\\n⚪ = Right color, wrong spot',
			color: embed.colors.PURPLE,
			footer: { text: 'You have 10 guesses' },
		})]
	});
	return;
}

if (guess.length !== 4 || !guess.split('').every(c => colorKeys.includes(c))) {
	message.reply('❌ Enter 4 colors: R, G, B, Y, P, or O (e.g., \`mastermind RGBY\`)');
	return;
}

const guessArr = guess.split('');
let exact = 0, partial = 0;
const codeUsed = [...game.code];
const guessUsed = [...guessArr];

// Check exact matches
for (let i = 0; i < 4; i++) {
	if (guessArr[i] === game.code[i]) {
		exact++;
		codeUsed[i] = null;
		guessUsed[i] = null;
	}
}

// Check partial matches
for (let i = 0; i < 4; i++) {
	if (guessUsed[i]) {
		const idx = codeUsed.indexOf(guessUsed[i]);
		if (idx !== -1) {
			partial++;
			codeUsed[idx] = null;
		}
	}
}

const feedback = '⚫'.repeat(exact) + '⚪'.repeat(partial) + '⬜'.repeat(4 - exact - partial);
const display = guessArr.map(c => colors[c]).join('');

game.guesses.push({ guess: display, feedback });

if (exact === 4) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🎉 You Cracked the Code!',
			description: 'The code was: ' + game.code.map(c => colors[c]).join('') + '\\n\\nSolved in **' + game.guesses.length + '** guesses!',
			color: embed.colors.SUCCESS,
		})]
	});
	return;
}

if (game.guesses.length >= game.maxGuesses) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '😢 Game Over',
			description: 'The code was: ' + game.code.map(c => colors[c]).join(''),
			color: embed.colors.ERROR,
		})]
	});
	return;
}

extension.storage.write(stateKey, game);

const history = game.guesses.slice(-5).map((g, i) => g.guess + ' ' + g.feedback).join('\\n');

message.reply({
	embeds: [embed.create({
		title: '🎯 Mastermind',
		description: '**Recent Guesses:**\\n' + history,
		color: embed.colors.BLUE,
		footer: { text: 'Guesses: ' + game.guesses.length + '/' + game.maxGuesses + ' | ⚫=exact ⚪=partial' },
	})]
});
`,
	},
	{
		name: "Duel",
		description: "Challenge someone to a turn-based duel!",
		type: "command",
		key: "duel",
		usage_help: "[@user|attack|defend|heal]",
		extended_help: "Challenge users to combat! Attack, defend, or heal each turn.",
		scopes: ["messages_write", "members_read"],
		timeout: 5000,
		code: `
const message = require('message');
const command = require('command');
const extension = require('extension');
const utils = require('utils');
const embed = require('embed');

const stateKey = 'duel_' + message.channel.id;
let duel = extension.storage.get(stateKey);
const action = command.suffix.trim().toLowerCase();

function hpBar(hp, max) {
	const filled = Math.round((hp / max) * 10);
	return '🟥'.repeat(filled) + '⬛'.repeat(10 - filled) + ' ' + hp + '/' + max;
}

if (!duel) {
	// Check for mention to start duel
	const mentionMatch = command.suffix.match(/<@!?(\\d+)>/);
	if (!mentionMatch) {
		message.reply('⚔️ Challenge someone! Usage: \`duel @user\`');
		return;
	}
	
	const opponentId = mentionMatch[1];
	if (opponentId === message.author.id) {
		message.reply('❌ You can\\'t duel yourself!');
		return;
	}
	
	duel = {
		players: {
			[message.author.id]: { hp: 100, maxHp: 100, defending: false },
			[opponentId]: { hp: 100, maxHp: 100, defending: false },
		},
		turn: message.author.id,
		opponent: opponentId,
		challenger: message.author.id,
	};
	extension.storage.write(stateKey, duel);
	
	message.reply({
		embeds: [embed.create({
			title: '⚔️ Duel Started!',
			description: utils.discord.userMention(message.author.id) + ' vs ' + utils.discord.userMention(opponentId) + '\\n\\n' +
				'**' + message.author.username + ':** ' + hpBar(100, 100) + '\\n' +
				'**Opponent:** ' + hpBar(100, 100) + '\\n\\n' +
				'It\\'s ' + utils.discord.userMention(message.author.id) + '\\'s turn!\\n\\nActions: \`duel attack\` | \`duel defend\` | \`duel heal\`',
			color: embed.colors.GOLD,
		})]
	});
	return;
}

if (duel.turn !== message.author.id) {
	message.reply('⏳ It\\'s not your turn!');
	return;
}

const player = duel.players[message.author.id];
const opponentId = Object.keys(duel.players).find(id => id !== message.author.id);
const opponent = duel.players[opponentId];

// Reset defending
player.defending = false;

if (action === 'attack') {
	let damage = utils.random.int(15, 25);
	if (opponent.defending) {
		damage = Math.floor(damage * 0.5);
		opponent.defending = false;
	}
	opponent.hp = Math.max(0, opponent.hp - damage);
	message.reply('⚔️ You dealt **' + damage + '** damage!');
} else if (action === 'defend') {
	player.defending = true;
	message.reply('🛡️ You raise your shield! (50% damage reduction next hit)');
} else if (action === 'heal') {
	const heal = utils.random.int(10, 20);
	player.hp = Math.min(player.maxHp, player.hp + heal);
	message.reply('💚 You healed for **' + heal + '** HP!');
} else {
	message.reply('❌ Invalid action! Use: \`duel attack\`, \`duel defend\`, or \`duel heal\`');
	return;
}

// Check for winner
if (opponent.hp <= 0) {
	extension.storage.write(stateKey, null);
	message.reply({
		embeds: [embed.create({
			title: '🏆 Victory!',
			description: utils.discord.userMention(message.author.id) + ' wins the duel!',
			color: embed.colors.SUCCESS,
		})]
	});
	return;
}

// Switch turn
duel.turn = opponentId;
extension.storage.write(stateKey, duel);

message.reply({
	embeds: [embed.create({
		title: '⚔️ Duel',
		description: '**You:** ' + hpBar(player.hp, player.maxHp) + '\\n' +
			'**Opponent:** ' + hpBar(opponent.hp, opponent.maxHp) + '\\n\\n' +
			'It\\'s ' + utils.discord.userMention(opponentId) + '\\'s turn!',
		color: embed.colors.BLUE,
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

	console.log("🔧 Seeding Batch 3 Extensions...\n");

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

	console.log("\n🎉 Batch 3 Complete!");
	process.exit(0);
}

seedExtensions().catch((err) => {
	console.error(err);
	process.exit(1);
});
