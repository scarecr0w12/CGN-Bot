const fetch = require("node-fetch");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	const category = msg.suffix?.toLowerCase().trim();

	const localFacts = {
		general: [
			"Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
			"A group of flamingos is called a 'flamboyance'.",
			"Octopuses have three hearts and blue blood.",
			"The shortest war in history lasted 38-45 minutes between Britain and Zanzibar in 1896.",
			"A jiffy is an actual unit of time: 1/100th of a second.",
			"The moon is slowly drifting away from Earth at about 3.8 cm per year.",
			"There are more possible iterations of a game of chess than there are atoms in the known universe.",
			"Bananas are berries, but strawberries aren't.",
			"The first oranges weren't orange - they were green.",
			"A day on Venus is longer than a year on Venus.",
		],
		animals: [
			"Cows have best friends and get stressed when separated.",
			"A snail can sleep for three years.",
			"Elephants are the only animals that can't jump.",
			"A group of porcupines is called a prickle.",
			"Dolphins sleep with one eye open.",
			"Koalas sleep up to 22 hours a day.",
			"A shrimp's heart is in its head.",
			"Butterflies taste with their feet.",
			"Cats can't taste sweetness.",
			"Sea otters hold hands while sleeping so they don't drift apart.",
		],
		space: [
			"There's a planet made of diamonds called 55 Cancri e.",
			"One day on Mercury is 59 Earth days long.",
			"The footprints on the Moon will be there for 100 million years.",
			"There's a giant cloud of alcohol in space that could make 400 trillion trillion pints of beer.",
			"Neutron stars are so dense that a teaspoon would weigh about 6 billion tons.",
			"The Sun makes up 99.86% of the mass in our solar system.",
			"Saturn would float if you could find a bathtub big enough.",
			"There are more trees on Earth than stars in the Milky Way.",
			"A year on Mars is 687 Earth days.",
			"You could fit all the planets in our solar system between Earth and the Moon.",
		],
		science: [
			"Hot water freezes faster than cold water (Mpemba effect).",
			"Glass is actually a liquid that flows very slowly.",
			"Your body contains about 0.2mg of gold.",
			"Lightning strikes the Earth about 8 million times a day.",
			"Water can boil and freeze at the same time (triple point).",
			"Humans share 60% of their DNA with bananas.",
			"Sound travels about 4 times faster in water than in air.",
			"The average cloud weighs about 1.1 million pounds.",
			"You can't hum while holding your nose closed.",
			"The human brain uses about 20% of the body's total energy.",
		],
	};

	let facts;
	let factCategory = "Random";

	if (category && localFacts[category]) {
		facts = localFacts[category];
		factCategory = category.charAt(0).toUpperCase() + category.slice(1);
	} else {
		const allFacts = Object.values(localFacts).flat();
		facts = allFacts;
	}

	const fact = facts[Math.floor(Math.random() * facts.length)];

	const categories = Object.keys(localFacts).map(c => `\`${c}\``).join(", ");

	return msg.send({
		embeds: [{
			color: Colors.INFO,
			title: `📚 ${factCategory} Fact`,
			description: fact,
			footer: { text: `Categories: ${categories}` },
		}],
	});
};
