const { PermissionFlagsBits } = require("discord.js");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument, serverQueryDocument }, msg, commandData) => {
	if (!msg.suffix) {
		// Show current starboard configuration
		const starboardConfig = serverDocument.config.starboard || {};
		const channelMention = starboardConfig.channel_id ? `<#${starboardConfig.channel_id}>` : "Not set";
		const threshold = starboardConfig.threshold || 3;
		const emoji = starboardConfig.emoji || "⭐";
		const isEnabled = starboardConfig.isEnabled !== false;

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "⭐ Starboard Configuration",
				fields: [
					{ name: "Status", value: isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
					{ name: "Channel", value: channelMention, inline: true },
					{ name: "Threshold", value: `${threshold} reactions`, inline: true },
					{ name: "Emoji", value: emoji, inline: true },
				],
				footer: { text: `Use "${msg.guild.commandPrefix}${commandData.name} help" for setup commands` },
			}],
		});
	}

	const args = msg.suffix.toLowerCase().split(" ");
	const subcommand = args[0];

	switch (subcommand) {
		case "help": {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "⭐ Starboard Help",
					description: "Starboard highlights popular messages when they receive enough star reactions.",
					fields: [
						{ name: "Setup Channel", value: `\`${msg.guild.commandPrefix}${commandData.name} channel #channel\``, inline: false },
						{ name: "Set Threshold", value: `\`${msg.guild.commandPrefix}${commandData.name} threshold <number>\``, inline: false },
						{ name: "Set Emoji", value: `\`${msg.guild.commandPrefix}${commandData.name} emoji <emoji>\``, inline: false },
						{ name: "Enable/Disable", value: `\`${msg.guild.commandPrefix}${commandData.name} enable\` or \`disable\``, inline: false },
					],
				}],
			});
		}

		case "channel": {
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

			if (!serverDocument.config.starboard) {
				serverQueryDocument.set("config.starboard", {});
			}
			serverQueryDocument.set("config.starboard.channel_id", channel.id);
			serverQueryDocument.set("config.starboard.isEnabled", true);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `⭐ Starboard channel set to ${channel}!`,
				}],
			});
		}

		case "threshold": {
			const threshold = parseInt(args[1]);
			if (isNaN(threshold) || threshold < 1 || threshold > 100) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "Please provide a valid threshold between 1 and 100!",
					}],
				});
			}

			if (!serverDocument.config.starboard) {
				serverQueryDocument.set("config.starboard", {});
			}
			serverQueryDocument.set("config.starboard.threshold", threshold);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `⭐ Starboard threshold set to **${threshold}** reactions!`,
				}],
			});
		}

		case "emoji": {
			const emoji = args[1] || "⭐";
			if (!serverDocument.config.starboard) {
				serverQueryDocument.set("config.starboard", {});
			}
			serverQueryDocument.set("config.starboard.emoji", emoji);

			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: `Starboard emoji set to ${emoji}!`,
				}],
			});
		}

		case "enable": {
			if (!serverDocument.config.starboard || !serverDocument.config.starboard.channel_id) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "Please set a starboard channel first!",
					}],
				});
			}

			serverQueryDocument.set("config.starboard.isEnabled", true);
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "⭐ Starboard has been **enabled**!",
				}],
			});
		}

		case "disable": {
			serverQueryDocument.set("config.starboard.isEnabled", false);
			return msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					description: "⭐ Starboard has been **disabled**!",
				}],
			});
		}

		default: {
			return msg.send({
				embeds: [{
					color: Colors.INVALID,
					description: `Unknown subcommand. Use \`${msg.guild.commandPrefix}${commandData.name} help\` for usage.`,
				}],
			});
		}
	}
};
