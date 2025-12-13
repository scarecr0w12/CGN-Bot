module.exports = async ({ Constants: { Colors }, client }, { serverDocument }, msg, commandData) => {
	const type = msg.suffix ? msg.suffix.toLowerCase() : "networth";
	const validTypes = ["coins", "wallet", "networth", "net", "daily", "streak"];

	if (!validTypes.includes(type) && type !== "") {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🏆 Economy Leaderboard",
				description: "View the richest users on this server!",
				fields: [
					{
						name: "Available Types",
						value: "`networth` - Total coins (wallet + bank)\n`wallet` - Wallet balance only\n`daily` - Highest daily streaks",
						inline: false,
					},
				],
				footer: {
					text: `Usage: ${msg.guild.commandPrefix}${commandData.name} [type]`,
				},
			}],
		});
	}

	// Get member IDs from the guild
	const memberIds = [...msg.guild.members.cache.keys()];

	// Fetch user documents for guild members
	const userDocuments = await Users.find({ _id: { $in: memberIds } }).exec();

	if (!userDocuments || userDocuments.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "No economy data found for this server!",
			}],
		});
	}

	let sortedUsers;
	let title;
	let valueFormatter;

	if (type === "wallet" || type === "coins") {
		title = "💵 Wallet Leaderboard";
		sortedUsers = userDocuments
			.filter(u => (u.economy?.wallet || 0) > 0)
			.sort((a, b) => (b.economy?.wallet || 0) - (a.economy?.wallet || 0))
			.slice(0, 10);
		valueFormatter = u => `${(u.economy?.wallet || 0).toLocaleString()} coins`;
	} else if (type === "daily" || type === "streak") {
		title = "🔥 Daily Streak Leaderboard";
		sortedUsers = userDocuments
			.filter(u => (u.economy?.daily_streak || 0) > 0)
			.sort((a, b) => (b.economy?.daily_streak || 0) - (a.economy?.daily_streak || 0))
			.slice(0, 10);
		valueFormatter = u => `${u.economy?.daily_streak || 0} day streak`;
	} else {
		title = "💰 Net Worth Leaderboard";
		sortedUsers = userDocuments
			.filter(u => ((u.economy?.wallet || 0) + (u.economy?.bank || 0)) > 0)
			.sort((a, b) => {
				const aTotal = (a.economy?.wallet || 0) + (a.economy?.bank || 0);
				const bTotal = (b.economy?.wallet || 0) + (b.economy?.bank || 0);
				return bTotal - aTotal;
			})
			.slice(0, 10);
		valueFormatter = u => {
			const total = (u.economy?.wallet || 0) + (u.economy?.bank || 0);
			return `${total.toLocaleString()} coins`;
		};
	}

	if (sortedUsers.length === 0) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "No one has any economy data yet!",
			}],
		});
	}

	const medals = ["🥇", "🥈", "🥉"];
	const lines = sortedUsers.map((user, index) => {
		const member = msg.guild.members.cache.get(user._id);
		const displayName = member ? client.getName(serverDocument, member) : `Unknown User`;
		const medal = medals[index] || `**${index + 1}.**`;
		return `${medal} **@${displayName}** - ${valueFormatter(user)}`;
	});

	// Find requester's position
	let allSorted;
	if (type === "daily" || type === "streak") {
		allSorted = userDocuments.sort((a, b) => (b.economy?.daily_streak || 0) - (a.economy?.daily_streak || 0));
	} else if (type === "wallet" || type === "coins") {
		allSorted = userDocuments.sort((a, b) => (b.economy?.wallet || 0) - (a.economy?.wallet || 0));
	} else {
		allSorted = userDocuments.sort((a, b) => {
			const aTotal = (a.economy?.wallet || 0) + (a.economy?.bank || 0);
			const bTotal = (b.economy?.wallet || 0) + (b.economy?.bank || 0);
			return bTotal - aTotal;
		});
	}

	const userPosition = allSorted.findIndex(u => u._id === msg.author.id) + 1;

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title,
			description: lines.join("\n"),
			footer: {
				text: userPosition > 0 ? `Your position: #${userPosition}` : "You're not on the leaderboard yet!",
			},
		}],
	});
};
