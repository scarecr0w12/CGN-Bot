module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	const target = msg.suffix ?
		await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null) :
		null;

	// Mild, playful insults - nothing actually mean
	const insults = [
		"You're not the dumbest person in the world, but you better hope they don't die.",
		"I'd agree with you, but then we'd both be wrong.",
		"You're like a cloud. When you disappear, it's a beautiful day.",
		"If I wanted to kill myself, I'd climb your ego and jump to your IQ.",
		"You're proof that evolution can go in reverse.",
		"I'm not saying I hate you, but I would unplug your life support to charge my phone.",
		"You bring everyone so much joy... when you leave.",
		"If you were a spice, you'd be flour.",
		"You're like a software update. Whenever I see you, I think 'not now'.",
		"I'm jealous of people who haven't met you.",
		"You're not stupid; you just have bad luck thinking.",
		"Light travels faster than sound. That's why you seemed bright until you spoke.",
		"You're the human equivalent of a participation trophy.",
		"If brains were dynamite, you wouldn't have enough to blow your nose.",
		"You're about as useful as a screen door on a submarine.",
		"Somewhere out there is a tree producing oxygen for you. I think you owe it an apology.",
		"You're not the brightest crayon in the box, are you?",
		"If you were any more dense, you'd collapse into a black hole.",
		"You're the reason we have warning labels on everything.",
		"I'd explain it to you, but I left my crayons at home.",
	];

	const insult = insults[Math.floor(Math.random() * insults.length)];
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${client.getName(serverDocument, msg.member)}**, ${insult.charAt(0).toLowerCase()}${insult.slice(1)}`;
		} else if (target.id === client.user.id) {
			description = `Nice try, **${client.getName(serverDocument, msg.member)}**, but I don't insult myself. Here's one for you instead:\n\n${insult}`;
		} else {
			description = `**${targetName}**, ${insult.charAt(0).toLowerCase()}${insult.slice(1)}`;
		}
	} else {
		description = insult;
	}

	return msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🔥 Roasted",
			description,
			footer: { text: "Just kidding! ...mostly 😏" },
		}],
	});
};
