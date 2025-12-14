module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	const gifs = [
		"https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
		"https://media.giphy.com/media/wnsgren9NtITS/giphy.gif",
		"https://media.giphy.com/media/PHZ7v9tfQu0o0/giphy.gif",
		"https://media.giphy.com/media/EvYHHSntaIl5m/giphy.gif",
		"https://media.giphy.com/media/lXiRoPt9Rkzt7yLYY/giphy.gif",
		"https://media.giphy.com/media/GMJGdxAZPmfuM/giphy.gif",
		"https://media.giphy.com/media/l0MYyoYPvz22wTXkQ/giphy.gif",
		"https://media.giphy.com/media/je8O5HeXPt5Sg/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** cuddles with a pillow... 🥺`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** cuddles with me! So cozy! 🥰`;
		} else {
			description = `**${authorName}** cuddles with **${targetName}**! 🥰`;
		}
	} else {
		description = `**${authorName}** wants cuddles! 🥺`;
	}

	return msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			description,
			image: { url: randomGif },
			footer: { text: "🥰" },
		}],
	});
};
