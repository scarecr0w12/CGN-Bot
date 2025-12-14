module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Rate something! ⭐",
				description: "Tell me what to rate!\n\n**Usage:** `rate <thing>`\n**Example:** `rate pizza`",
			}],
		});
	}

	const thing = msg.suffix.trim();

	// Generate consistent rating based on the thing being rated
	const seed = thing.toLowerCase().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const rating = seed % 11;

	const emojis = ["😢", "😞", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🔥", "💯"];
	const emoji = emojis[rating];

	const comments = {
		0: "Yikes... that's rough.",
		1: "Not great, not terrible... okay it's terrible.",
		2: "Could be better. Much better.",
		3: "Meh, pretty mediocre.",
		4: "It's... okay I guess.",
		5: "Right in the middle! Average!",
		6: "Not bad at all!",
		7: "Pretty good actually!",
		8: "That's great!",
		9: "Amazing! Almost perfect!",
		10: "PERFECT! Absolutely flawless!",
	};

	const stars = "⭐".repeat(Math.ceil(rating / 2)) + "☆".repeat(5 - Math.ceil(rating / 2));

	return msg.send({
		embeds: [{
			color: rating >= 7 ? Colors.SUCCESS : rating >= 4 ? Colors.INFO : Colors.SOFT_ERR,
			title: `${emoji} Rating: ${thing}`,
			description: `**${rating}/10** ${stars}\n\n${comments[rating]}`,
			footer: { text: `Rated by ${client.getName(serverDocument, msg.member)}` },
		}],
	});
};
