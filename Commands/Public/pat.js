module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let target = null;

	if (msg.suffix) {
		target = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
	}

	const gifs = [
		"https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif",
		"https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif",
		"https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif",
		"https://media.giphy.com/media/ye7OTQgwmVuVy/giphy.gif",
		"https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif",
		"https://media.giphy.com/media/Z7x24IHBcmV7W/giphy.gif",
		"https://media.giphy.com/media/osYdfUptPqV0s/giphy.gif",
		"https://media.giphy.com/media/N0CIxcyPLputW/giphy.gif",
		"https://media.giphy.com/media/4owjQaBmYuCze/giphy.gif",
		"https://media.giphy.com/media/xT9DPIBYf0pAviBLzO/giphy.gif",
	];

	const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

	const authorName = client.getName(serverDocument, msg.member);
	const targetName = target ? client.getName(serverDocument, target) : null;

	let description;
	if (target) {
		if (target.id === msg.author.id) {
			description = `**${authorName}** pats themselves... there there 😊`;
		} else if (target.id === client.user.id) {
			description = `**${authorName}** pats me! *happy bot noises* 💖`;
		} else {
			description = `**${authorName}** pats **${targetName}**! Good job! 👋`;
		}
	} else {
		description = `**${authorName}** wants headpats! 👋`;
	}

	return msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			description,
			image: { url: randomGif },
			footer: { text: "👋" },
		}],
	});
};
