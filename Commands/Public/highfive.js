module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	const gifs = [
		"https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif",
		"https://media.giphy.com/media/IxTGbn21IkPqU/giphy.gif",
		"https://media.giphy.com/media/l0MYv4hSotnqt68SI/giphy.gif",
		"https://media.giphy.com/media/HX3lSnGXZnaWk/giphy.gif",
		"https://media.giphy.com/media/DohrJX1h2W5RC/giphy.gif",
		"https://media.giphy.com/media/OcZp0maz6ALok/giphy.gif",
		"https://media.giphy.com/media/MhHn6ckQdMjTi/giphy.gif",
		"https://media.giphy.com/media/3o6ZtpWvwnhf34Oj0A/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** high-fives themselves! ✋`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** high-fives me! ✋🤖`;
		} else {
			description = `**${authorName}** high-fives **${targetName}**! ✋`;
		}
	} else {
		description = `**${authorName}** is looking for a high-five! ✋`;
	}

	return msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			description,
			image: { url: randomGif },
			footer: { text: "✋" },
		}],
	});
};
