const crypto = require("crypto");

// Secure random integer
const secureRandom = max => {
	const randomBytes = crypto.randomBytes(4);
	return randomBytes.readUInt32BE(0) % max;
};

// Fisher-Yates shuffle with cryptographically secure random
const secureShuffle = array => {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const randomIndex = secureRandom(i + 1);
		[result[i], result[randomIndex]] = [result[randomIndex], result[i]];
	}
	return result;
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	const args = msg.suffix?.trim() || "";

	if (!args) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🏆 Team Picker",
				description: "Randomly assign people to teams!",
				fields: [
					{
						name: "Usage",
						value: [
							`\`${commandData.name} <teams> <player1> <player2> ...\``,
							`\`${commandData.name} <teams> | <player1> | <player2> ...\``,
							"",
							"**Examples:**",
							`\`${commandData.name} 2 Alice Bob Carol Dave\` - 2 teams`,
							`\`${commandData.name} 3 | Team Lead | Developer | Designer\` - 3 teams`,
						].join("\n"),
					},
					{
						name: "Special",
						value: `Mention users to use their display names!\n\`${commandData.name} 2 @User1 @User2 @User3\``,
					},
				],
			}],
		});
	}

	// Parse arguments
	let items;
	let numTeams;

	if (args.includes("|")) {
		const parts = args.split("|").map(p => p.trim()).filter(p => p.length > 0);
		if (parts.length < 2) {
			return msg.sendInvalidUsage(commandData, "Need at least a team count and players!");
		}
		numTeams = parseInt(parts[0]);
		items = parts.slice(1);
	} else {
		const parts = args.split(/\s+/);
		if (parts.length < 2) {
			return msg.sendInvalidUsage(commandData, "Need at least a team count and players!");
		}
		numTeams = parseInt(parts[0]);
		items = parts.slice(1);
	}

	// Resolve mentions to display names
	items = items.map(item => {
		const mentionMatch = item.match(/^<@!?(\d+)>$/);
		if (mentionMatch) {
			const member = msg.guild.members.cache.get(mentionMatch[1]);
			return member ? member.displayName : item;
		}
		return item;
	});

	// Validate
	if (isNaN(numTeams) || numTeams < 2) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Invalid Team Count",
				description: "Please specify at least 2 teams.",
			}],
		});
	}

	if (numTeams > 20) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Too Many Teams",
				description: "Maximum 20 teams allowed.",
			}],
		});
	}

	if (items.length < numTeams) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Not Enough Players",
				description: `You need at least ${numTeams} players for ${numTeams} teams.`,
			}],
		});
	}

	if (items.length > 100) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Too Many Players",
				description: "Maximum 100 players allowed.",
			}],
		});
	}

	// Shuffle and distribute
	const shuffled = secureShuffle(items);
	const teams = Array.from({ length: numTeams }, () => []);

	shuffled.forEach((player, index) => {
		teams[index % numTeams].push(player);
	});

	// Team emojis/names
	const teamEmojis = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "⚪", "🟤", "⚫", "🩷", "🩵", "💙", "💚", "💛", "💜", "🧡", "🤍", "🤎", "🖤", "💗"];

	// Build fields
	const fields = teams.map((team, i) => ({
		name: `${teamEmojis[i % teamEmojis.length]} Team ${i + 1} (${team.length})`,
		value: team.length > 0 ? team.join("\n") : "*Empty*",
		inline: true,
	}));

	// Add blank fields to maintain layout for 2 columns
	if (fields.length === 2) {
		fields.push({ name: "\u200B", value: "\u200B", inline: true });
	}

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "🏆 Teams Assigned!",
			description: `**${items.length} players** divided into **${numTeams} teams**`,
			fields,
			footer: { text: "Teams were randomly assigned" },
		}],
	});
};
