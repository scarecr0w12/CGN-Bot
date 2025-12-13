const WORK_COOLDOWN = 30 * 60 * 1000; // 30 minutes
const BASE_EARNINGS = { min: 50, max: 200 };

const JOBS = [
	{ name: "Developer", emoji: "💻", messages: ["You fixed some bugs and earned", "You deployed a new feature and received", "You reviewed code and got paid"] },
	{ name: "Chef", emoji: "👨‍🍳", messages: ["You prepared a delicious meal and earned", "You catered an event and received", "You created a new recipe and got"] },
	{ name: "Artist", emoji: "🎨", messages: ["You sold a painting and earned", "You completed a commission and received", "You taught an art class and got paid"] },
	{ name: "Musician", emoji: "🎸", messages: ["You performed at a concert and earned", "You recorded a track and received", "You gave music lessons and got"] },
	{ name: "Writer", emoji: "✍️", messages: ["You finished an article and earned", "You published a story and received", "You edited a manuscript and got paid"] },
	{ name: "Streamer", emoji: "📺", messages: ["You had a great stream and earned", "You got donations totaling", "Your subscribers tipped you"] },
	{ name: "Driver", emoji: "🚗", messages: ["You completed deliveries and earned", "You drove passengers around and received", "You finished a long haul and got paid"] },
	{ name: "Doctor", emoji: "👨‍⚕️", messages: ["You treated patients and earned", "You performed a procedure and received", "You consulted on a case and got"] },
	{ name: "Teacher", emoji: "👩‍🏫", messages: ["You tutored students and earned", "You graded papers and received", "You taught a class and got paid"] },
	{ name: "Builder", emoji: "👷", messages: ["You completed a construction job and earned", "You renovated a house and received", "You fixed some plumbing and got paid"] },
];

const BONUS_EVENTS = [
	{ chance: 0.05, multiplier: 3, message: "🌟 **BONUS!** Your boss was impressed and tripled your pay!" },
	{ chance: 0.10, multiplier: 2, message: "✨ **TIP!** A grateful customer doubled your earnings!" },
	{ chance: 0.08, multiplier: 1.5, message: "💫 **OVERTIME!** You worked extra hours for 50% more!" },
];

module.exports = async ({ Constants: { Colors } }, { userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000 });
	}

	// Check cooldown
	const lastWork = userDocument.economy?.work_last_time;
	if (lastWork) {
		const timeSince = Date.now() - new Date(lastWork).getTime();
		if (timeSince < WORK_COOLDOWN) {
			const remaining = WORK_COOLDOWN - timeSince;
			const minutes = Math.floor(remaining / (60 * 1000));
			const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "⏰ You're tired!",
					description: `You need to rest before working again.\n\nTry again in **${minutes}m ${seconds}s**`,
				}],
			});
		}
	}

	// Pick a random job
	const job = JOBS[Math.floor(Math.random() * JOBS.length)];
	const jobMessage = job.messages[Math.floor(Math.random() * job.messages.length)];

	// Calculate earnings
	let earnings = Math.floor(Math.random() * (BASE_EARNINGS.max - BASE_EARNINGS.min + 1)) + BASE_EARNINGS.min;
	let bonusMessage = null;

	// Check for bonus events
	for (const bonus of BONUS_EVENTS) {
		if (Math.random() < bonus.chance) {
			earnings = Math.floor(earnings * bonus.multiplier);
			bonusMessage = bonus.message;
			break;
		}
	}

	// Update user data
	userQueryDocument.set("economy.work_last_time", new Date());
	userQueryDocument.inc("economy.wallet", earnings);
	userQueryDocument.inc("economy.total_earned", earnings);

	const newWallet = (userDocument.economy?.wallet || 0) + earnings;

	const description = `${job.emoji} **${job.name}**\n\n${jobMessage} **${earnings.toLocaleString()}** coins!${bonusMessage ? `\n\n${bonusMessage}` : ""}`;

	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			title: "💼 Work Complete!",
			description,
			fields: [
				{
					name: "💵 Wallet",
					value: `${newWallet.toLocaleString()} coins`,
					inline: true,
				},
			],
			footer: {
				text: `You can work again in 30 minutes`,
			},
		}],
	});
};
