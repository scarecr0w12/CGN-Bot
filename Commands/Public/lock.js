const { PermissionFlagsBits } = require("discord.js");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	// Check bot permissions
	if (!msg.channel.permissionsFor(msg.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Missing Permissions",
				description: "I need the **Manage Channels** permission to lock this channel!",
			}],
		});
	}

	const reason = msg.suffix || "Channel locked by moderator";
	const everyoneRole = msg.guild.roles.everyone;

	// Check if already locked
	const currentPerms = msg.channel.permissionOverwrites.cache.get(everyoneRole.id);
	if (currentPerms && currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				description: "🔒 This channel is already locked!",
				footer: { text: `Use "${msg.guild.commandPrefix}unlock" to unlock it` },
			}],
		});
	}

	try {
		await msg.channel.permissionOverwrites.edit(everyoneRole, {
			SendMessages: false,
		}, { reason: `${reason} | Locked by @${msg.author.tag}` });

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🔒 Channel Locked",
				description: "This channel has been locked. Only moderators can send messages.",
				fields: [
					{ name: "Reason", value: reason, inline: false },
					{ name: "Locked by", value: `<@${msg.author.id}>`, inline: true },
				],
				footer: { text: `Use "${msg.guild.commandPrefix}unlock" to unlock` },
			}],
		});
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "Failed to lock the channel!",
				footer: { text: err.message },
			}],
		});
	}
};
