module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	const mentions = msg.suffix ? msg.suffix.match(/<@!?(\d+)>/g) || [] : [];
	let user1, user2;

	if (mentions.length >= 2) {
		user1 = await client.memberSearch(mentions[0], msg.guild).catch(() => null);
		user2 = await client.memberSearch(mentions[1], msg.guild).catch(() => null);
	} else if (mentions.length === 1) {
		user1 = msg.member;
		user2 = await client.memberSearch(mentions[0], msg.guild).catch(() => null);
	} else if (msg.suffix) {
		const parts = msg.suffix.split(/\s+and\s+|\s*,\s*|\s+/i).filter(p => p.trim());
		if (parts.length >= 2) {
			user1 = await client.memberSearch(parts[0], msg.guild).catch(() => null);
			user2 = await client.memberSearch(parts[1], msg.guild).catch(() => null);
		} else if (parts.length === 1) {
			user1 = msg.member;
			user2 = await client.memberSearch(parts[0], msg.guild).catch(() => null);
		}
	}

	if (!user1 || !user2) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Love Calculator 💕",
				description: "I need two people to calculate love!\n\n**Usage:**\n• `lovecalc @user1 @user2`\n• `lovecalc @user` (calculates with you)",
			}],
		});
	}

	// Generate consistent percentage based on user IDs
	const ids = [user1.id, user2.id].sort();
	const seed = parseInt(ids[0].slice(-4), 10) + parseInt(ids[1].slice(-4), 10);
	const percentage = (seed * 7) % 101;

	const name1 = client.getName(serverDocument, user1);
	const name2 = client.getName(serverDocument, user2);

	let rating, color, hearts;
	if (percentage >= 90) {
		rating = "💖 Soulmates! Made for each other!";
		color = 0xFF1493;
		hearts = "💖💖💖💖💖";
	} else if (percentage >= 75) {
		rating = "❤️ Amazing chemistry!";
		color = 0xFF69B4;
		hearts = "❤️❤️❤️❤️";
	} else if (percentage >= 50) {
		rating = "💛 Good potential!";
		color = 0xFFD700;
		hearts = "💛💛💛";
	} else if (percentage >= 25) {
		rating = "💔 It could work... maybe.";
		color = 0xFFA500;
		hearts = "💔💔";
	} else {
		rating = "🖤 Not meant to be...";
		color = 0x808080;
		hearts = "🖤";
	}

	const bar = Array(10).fill("")
		.map((_, i) => i < Math.floor(percentage / 10) ? "❤️" : "🖤")
		.join("");

	return msg.send({
		embeds: [{
			color,
			title: "💕 Love Calculator",
			description: `**${name1}** 💗 **${name2}**\n\n${bar}\n\n**${percentage}%** compatibility\n\n${hearts} ${rating}`,
			footer: { text: "Love is in the air~ 💕" },
		}],
	});
};
