const { create: CreateModLog } = require("../../Modules/ModLog");
const ArgParser = require("../../Modules/MessageUtils/Parser");

module.exports = async ({ client, Constants: { Colors }, configJS }, { serverDocument }, msg, commandData) => {
	if (!msg.suffix) {
		return msg.sendInvalidUsage(commandData, "Who do you want me to softban? 🔨");
	}

	let [inputMember, ...reason] = ArgParser.parseQuoteArgs(msg.suffix, msg.suffix.includes("|") ? "|" : " ");
	let days = 1;

	// Check if first part of reason is a number (days to delete)
	if (!isNaN(reason[0]) && parseInt(reason[0]) >= 1 && parseInt(reason[0]) <= 7) {
		days = parseInt(reason.splice(0, 1));
	}

	// Find the member
	const member = await client.memberSearch(inputMember.trim(), msg.guild).catch(() => null);

	if (!member) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "I couldn't find a matching member in this guild... 🧐",
			}],
		});
	}

	reason = reason.join(" ").trim() || "No reason specified";

	// Permission checks
	const { canClientBan, memberAboveAffected } = client.canDoActionOnMember(msg.guild, msg.member, member, "ban");
	
	if (!canClientBan) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "I'm sorry, but I can't do that... 😔",
				description: "I'm missing permissions to ban that user!\nEither they are above me or I don't have the **Ban Members** permission.",
			}],
		});
	}

	if (!memberAboveAffected) {
		return msg.send({
			embeds: [{
				color: Colors.MISSING_PERMS,
				title: "I'm sorry, but I cannot let you do that! 😶",
				description: "You cannot softban someone who's above you!",
			}],
		});
	}

	// Confirmation
	await msg.send({
		embeds: [{
			color: Colors.INPUT,
			title: `Waiting on @__${client.getName(serverDocument, msg.member)}__'s input...`,
			description: `Are you sure you want to softban **@${client.getName(serverDocument, member)}**?\n\nThis will:\n• Ban them to delete ${days} day(s) of messages\n• Immediately unban them\n\nReason:\`\`\`css\n${reason}\`\`\``,
			footer: { text: "Type 'yes' to confirm or anything else to cancel" },
		}],
	});

	const collector = msg.channel.createMessageCollector({
		filter: m => m.author.id === msg.author.id,
		time: 60000,
		max: 1,
	});

	collector.on("collect", async message => {
		try {
			await message.delete().catch(() => null);
		} catch (_) {
			// Ignore delete errors
		}

		if (!configJS.yesStrings.includes(message.content.toLowerCase().trim())) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					description: "Softban canceled! 😓",
				}],
			});
		}

		try {
			// DM the user before banning
			try {
				await member.user.send({
					embeds: [{
						color: Colors.LIGHT_ORANGE,
						description: `You've been softbanned from \`${msg.guild.name}\`! 🔨`,
						fields: [
							{ name: "Reason", value: reason, inline: true },
							{ name: "Moderator", value: `@${msg.author.tag}`, inline: true },
						],
						footer: { text: "A softban means your messages were deleted but you can rejoin." },
						thumbnail: { url: msg.guild.iconURL() },
					}],
				});
			} catch (_) {
				// User has DMs disabled
			}

			// Ban
			await member.ban({
				deleteMessageSeconds: days * 86400,
				reason: `[Softban] ${reason} | By @${msg.author.tag}`,
			});

			// Immediately unban
			await msg.guild.members.unban(member.id, `Softban unban | Originally by @${msg.author.tag}`);

			// Create ModLog entry
			await CreateModLog(msg.guild, "Softban", member, msg.author, reason);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `**@${client.getName(serverDocument, member)}** has been softbanned! 🔨`,
					footer: { text: `Deleted ${days} day(s) of messages` },
				}],
			});
		} catch (err) {
			return msg.send({
				embeds: [{
					color: Colors.ERROR,
					description: "Failed to softban the user!",
					footer: { text: err.message },
				}],
			});
		}
	});

	collector.on("end", (collected, endReason) => {
		if (endReason === "time" && collected.size === 0) {
			msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Softban timed out! 😓",
				}],
			});
		}
	});
};
