const fetch = require("node-fetch");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	// Fetch a random hug gif
	const gifs = [
		"https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
		"https://media.giphy.com/media/3oEdv4hwWTzBhWvaU0/giphy.gif",
		"https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
		"https://media.giphy.com/media/ZQN9jsRWp1M76/giphy.gif",
		"https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif",
		"https://media.giphy.com/media/wnsgren9NtITS/giphy.gif",
		"https://media.giphy.com/media/PHZ7v9tfQu0o0/giphy.gif",
		"https://media.giphy.com/media/IRUb7GTCaPU8E/giphy.gif",
		"https://media.giphy.com/media/EvYHHSntaIl5m/giphy.gif",
		"https://media.giphy.com/media/xUPGcCh4nUHyCkyuti/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** hugs themselves... 🥺`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** hugs me! Thanks! 💕`;
		} else {
			description = `**${authorName}** hugs **${targetName}**! 🤗`;
		}
	} else {
		description = `**${authorName}** wants a hug! 🤗`;
	}

	return msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			description,
			image: { url: randomGif },
			footer: { text: "💕" },
		}],
	});
};
