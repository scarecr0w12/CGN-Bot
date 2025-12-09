const { PermissionFlagsBits } = require("discord.js");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument, serverQueryDocument }, msg, commandData) => {
	if (!msg.suffix) {
		// Show configuration or current status
		const suggestConfig = serverDocument.config.suggestions || {};
		const channelMention = suggestConfig.channel_id ? `<#${suggestConfig.channel_id}>` : "Not set";
		const isEnabled = suggestConfig.isEnabled !== false;

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "💡 Suggestion System",
				fields: [
					{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Channel", value: channelMention, inline: true },
				],
				footer: { text: `Use "${msg.guild.commandPrefix}${commandData.name} <your suggestion>" to submit` },
			}],
		});
	}

	const args = msg.suffix.split(" ");
	const subcommand = args[0].toLowerCase();

	// Admin subcommands
	if (subcommand === "channel" && client.getUserBotAdmin(msg.guild, serverDocument, msg.member) >= 1) {
		const channel = msg.mentions.channels.first() || msg.guild.channels.cache.get(args[1]);
		if (!channel) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Please mention a valid text channel!",
				}],
			});
		}

		if (!channel.permissionsFor(msg.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "I don't have permission to send messages in that channel!",
				}],
			});
		}

		if (!serverDocument.config.suggestions) {
			serverQueryDocument.set("config.suggestions", {});
		}
		serverQueryDocument.set("config.suggestions.channel_id", channel.id);
		serverQueryDocument.set("config.suggestions.isEnabled", true);

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				description: `💡 Suggestion channel set to ${channel}!`,
			}],
		});
	}

	if (subcommand === "enable" && client.getUserBotAdmin(msg.guild, serverDocument, msg.member) >= 1) {
		if (!serverDocument.config.suggestions || !serverDocument.config.suggestions.channel_id) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Please set a suggestion channel first!",
				}],
			});
		}
		serverQueryDocument.set("config.suggestions.isEnabled", true);
		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				description: "💡 Suggestion system has been **enabled**!",
			}],
		});
	}

	if (subcommand === "disable" && client.getUserBotAdmin(msg.guild, serverDocument, msg.member) >= 1) {
		serverQueryDocument.set("config.suggestions.isEnabled", false);
		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				description: "💡 Suggestion system has been **disabled**!",
			}],
		});
	}

	// Submit a suggestion
	const suggestConfig = serverDocument.config.suggestions || {};
	if (!suggestConfig.isEnabled || !suggestConfig.channel_id) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "The suggestion system is not configured on this server!",
				footer: { text: "Ask an admin to set it up." },
			}],
		});
	}

	const suggestionChannel = msg.guild.channels.cache.get(suggestConfig.channel_id);
	if (!suggestionChannel) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "The suggestion channel no longer exists!",
			}],
		});
	}

	const suggestion = msg.suffix.trim();
	if (suggestion.length < 10) {
		return msg.send({
			embeds: [{
				color: Colors.INVALID,
				description: "Your suggestion must be at least 10 characters long!",
			}],
		});
	}

	if (suggestion.length > 2000) {
		return msg.send({
			embeds: [{
				color: Colors.INVALID,
				description: "Your suggestion is too long! Maximum 2000 characters.",
			}],
		});
	}

	// Get next suggestion ID
	if (!serverDocument.suggestion_count) {
		serverQueryDocument.set("suggestion_count", 0);
	}
	const suggestionId = (serverDocument.suggestion_count || 0) + 1;
	serverQueryDocument.set("suggestion_count", suggestionId);

	try {
		const suggestionMsg = await suggestionChannel.send({
			embeds: [{
				color: Colors.INFO,
				title: `💡 Suggestion #${suggestionId}`,
				description: suggestion,
				author: {
					name: `${msg.author.tag}`,
					iconURL: msg.author.displayAvatarURL(),
				},
				footer: { text: `User ID: ${msg.author.id}` },
				timestamp: new Date().toISOString(),
			}],
		});

		// Add voting reactions
		await suggestionMsg.react("👍");
		await suggestionMsg.react("👎");

		// Delete the original message if we can
		try {
			await msg.delete();
		} catch (_) {
			// Cannot delete
		}

		return msg.author.send({
			embeds: [{
				color: Colors.SUCCESS,
				description: `Your suggestion (#${suggestionId}) has been submitted! 💡`,
				footer: { text: `Server: ${msg.guild.name}` },
			}],
		}).catch(() => {
			// DMs disabled, send in channel
			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `Your suggestion (#${suggestionId}) has been submitted! 💡`,
				}],
			});
		});
	} catch (err) {
		return msg.send({
			embeds: [{
				color: Colors.ERROR,
				description: "Failed to submit your suggestion!",
			}],
		});
	}
};
