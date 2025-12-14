module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	const gifs = [
		"https://media.giphy.com/media/WvVzZ9mCyMjsc/giphy.gif",
		"https://media.giphy.com/media/pWd3gD577gOqs/giphy.gif",
		"https://media.giphy.com/media/ovbDDmY4Kphtu/giphy.gif",
		"https://media.giphy.com/media/xUOrwihszfWZgSIHJK/giphy.gif",
		"https://media.giphy.com/media/1dLHSFrEj2a2s/giphy.gif",
		"https://media.giphy.com/media/LXTQN2kRbaqAw/giphy.gif",
		"https://media.giphy.com/media/MhHn6ckQdMjTi/giphy.gif",
		"https://media.giphy.com/media/GgbCiS1rMjGFy/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** pokes themselves... 🤔`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** pokes me! Hey! 👉`;
		} else {
			description = `**${authorName}** pokes **${targetName}**! 👉`;
		}
	} else {
		description = `**${authorName}** wants to poke someone! 👉`;
	}

	return msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			description,
			image: { url: randomGif },
			footer: { text: "👉" },
		}],
	});
};
