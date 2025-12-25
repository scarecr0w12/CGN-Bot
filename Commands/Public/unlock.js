const { PermissionFlagsBits } = require("discord.js");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	// Check bot permissions - ManageRoles is required to edit permission overwrites
	const botPerms = msg.channel.permissionsFor(msg.guild.members.me);
	if (!botPerms.has(PermissionFlagsBits.ManageRoles)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Missing Permissions",
				description: "I need the **Manage Roles** permission to unlock this channel!",
				footer: { text: "This permission is required to modify channel permission overwrites" },
			}],
		});
	}

	const reason = msg.suffix || "Channel unlocked by moderator";
	const everyoneRole = msg.guild.roles.everyone;

	// Check if already unlocked
	const currentPerms = msg.channel.permissionOverwrites.cache.get(everyoneRole.id);
	if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "🔓 This channel is not locked!",
			}],
		});
	}

	try {
		await msg.channel.permissionOverwrites.edit(everyoneRole, {
			SendMessages: null,
		}, { reason: `${reason} | Unlocked by @${msg.author.tag}` });

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🔓 Channel Unlocked",
				description: "This channel has been unlocked. Everyone can send messages again.",
				fields: [
					{ name: "Reason", value: reason, inline: false },
					{ name: "Unlocked by", value: `<@${msg.author.id}>`, inline: true },
				],
			}],
		});
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "Failed to unlock the channel!",
				footer: { text: err.message },
			}],
		});
	}
};
