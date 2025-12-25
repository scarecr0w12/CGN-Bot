module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	const target = msg.suffix ?
		await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null) :
		msg.member;

	if (!target) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Who should I compliment? 💖",
				description: "I couldn't find that user!",
			}],
		});
	}

	const compliments = [
		"You're more helpful than you realize.",
		"You have the best laugh.",
		"You're a great listener.",
		"You light up the room.",
		"You have impeccable manners.",
		"You're like a ray of sunshine on a cloudy day.",
		"You bring out the best in other people.",
		"You're more fun than bubble wrap.",
		"You're someone's reason to smile.",
		"You're even more beautiful on the inside than you are on the outside.",
		"You have the courage of your convictions.",
		"Your perspective is refreshing.",
		"You should be proud of yourself.",
		"You're a gift to those around you.",
		"You're a smart cookie.",
		"You're making a difference.",
		"You deserve a hug right now.",
		"You're really something special.",
		"You're wonderful.",
		"Colors seem brighter when you're around.",
		"You're one of a kind!",
		"You have a great sense of humor.",
		"Being around you is like a happy little vacation.",
		"You're better than a triple-scoop ice cream cone. With sprinkles.",
		"You're like a breath of fresh air.",
		"Everything would be better if more people were like you.",
		"You're inspiring.",
		"You're amazing just the way you are.",
		"On a scale from 1 to 10, you're an 11.",
		"You're the friend everyone deserves.",
	];

	const compliment = compliments[Math.floor(Math.random() * compliments.length)];
	const targetName = client.getName(serverDocument, target);
	const isSelf = target.id === msg.author.id;

	return msg.send({
		embeds: [{
			color: 0xFF69B4,
			title: "💖 Compliment",
			description: isSelf ?
				`Hey **${targetName}**, ${compliment.charAt(0).toLowerCase()}${compliment.slice(1)}` :
				`**${targetName}**, ${compliment.charAt(0).toLowerCase()}${compliment.slice(1)}`,
			footer: { text: isSelf ? "Self-love is important! 💕" : `Sent with love from ${client.getName(serverDocument, msg.member)} 💕` },
		}],
	});
};
