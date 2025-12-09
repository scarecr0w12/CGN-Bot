module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	const gifs = [
		"https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif",
		"https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif",
		"https://media.giphy.com/media/RXGNsyRb1hDJm/giphy.gif",
		"https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif",
		"https://media.giphy.com/media/tXWfj6dUjs0Zy/giphy.gif",
		"https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif",
		"https://media.giphy.com/media/xUO4t2gkWBxDi/giphy.gif",
		"https://media.giphy.com/media/l3YSimA8CV1k11QRy/giphy.gif",
		"https://media.giphy.com/media/WLXO8OZmq0JK8/giphy.gif",
		"https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** slaps themselves... why though? 🤔`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** tries to slap me! Nice try! 😏`;
		} else {
			description = `**${authorName}** slaps **${targetName}**! 👋💥`;
		}
	} else {
		description = `**${authorName}** slaps the air menacingly! 👋`;
	}

	return msg.send({
		embeds: [{
			color: Colors.LIGHT_ORANGE,
			description,
			image: { url: randomGif },
			footer: { text: "💥" },
		}],
	});
};
