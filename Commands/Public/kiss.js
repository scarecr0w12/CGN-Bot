module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	const gifs = [
		"https://media.giphy.com/media/ZRSGxtgy6Lv2w/giphy.gif",
		"https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif",
		"https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif",
		"https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif",
		"https://media.giphy.com/media/nyGFcsP0kAobm/giphy.gif",
		"https://media.giphy.com/media/hnNyVPIXgLdle/giphy.gif",
		"https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif",
		"https://media.giphy.com/media/11k3oaUjSlFR4I/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** blows a kiss to themselves in the mirror! 💋`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** kisses me! 😳💕`;
		} else {
			description = `**${authorName}** kisses **${targetName}**! 💋`;
		}
	} else {
		description = `**${authorName}** is blowing kisses! 💋`;
	}

	return msg.send({
		embeds: [{
			color: 0xFF69B4,
			description,
			image: { url: randomGif },
			footer: { text: "💋" },
		}],
	});
};
