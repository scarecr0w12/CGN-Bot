/**
 * Rule34 Command - NSFW image search (disabled by default)
 */
module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	// Check if channel is NSFW
	if (!msg.channel.nsfw) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "This command can only be used in NSFW channels.",
			}],
		});
	}

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: `Please provide a search query. Usage: \`${commandData.name} <query>\``,
			}],
		});
	}

	msg.send({
		embeds: [{
			color: Colors.INFO,
			description: "This command is currently disabled. Please enable it in the dashboard if needed.",
		}],
	});
};
