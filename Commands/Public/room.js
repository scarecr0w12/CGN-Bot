const ArgParser = require("../../Modules/MessageUtils/Parser");
const moment = require("moment");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const TierManager = require("../../Modules/TierManager");

module.exports = async ({ Constants: { Colors, Text }, client }, { serverDocument, serverQueryDocument }, msg, commandData) => {
	const roomDocument = serverDocument.config.room_data.id(msg.channel.id);
	if (roomDocument) {
		const question = await msg.send({
			embeds: [{
				color: Colors.PROMPT,
				description: `This room was created ${moment(roomDocument.created_timestamp).fromNow()}. Would you like to delete it?`,
			}],
			footer: {
				text: "You have 1 minute to respond.",
			},
		});
		let response = (await msg.channel.awaitMessages({ filter: res => res.author.id === msg.author.id, max: 1, time: 60000 })).first();
		if (response) {
			try {
				await response.delete();
			} catch (err) {
				// No-op
			}
		}
		if (response && configJS.yesStrings.includes(response.content.toLowerCase().trim())) {
			let success = true;
			await msg.channel.delete(`Room Management | Command issued by ${msg.author.tag}`).catch(err => {
				success = false;
				logger.debug(`Failed to delete room '${msg.channel.name}' on server '${msg.guild.name}'`, { svrid: msg.guild.id, chid: msg.channel.id }, err);
				question.edit({
					embeds: [{
						color: Colors.LIGHT_ERR,
						title: "Failed to delete room!",
						description: "I might be missing sufficient permissions!",
					}],
				});
			});
			if (success) serverDocument.query.id("config.room_data", msg.channel.id).remove();
		} else {
			await question.edit({
				embeds: [{
					color: Colors.PROMPT,
					title: "I'll keep the room intact 😅",
					description: "Do you want to add any members to this channel?",
					footer: {
						text: "You have 1 minute to respond.",
					},
				}],
			});
			response = (await msg.channel.awaitMessages({ filter: res => res.author.id === msg.author.id, max: 1, time: 60000 })).first();
			if (response) {
				try {
					await response.delete();
				} catch (err) {
					// No-op
				}
			}
			if (response && configJS.yesStrings.includes(response.content.toLowerCase().trim())) {
				await question.edit({
					embeds: [{
						color: Colors.PROMPT,
						description: "Please send the names of the members you'd like to add.",
						footer: {
							text: "You can separate them with '|'",
						},
					}],
				});
				response = (await msg.channel.awaitMessages({ filter: res => res.author.id === msg.author.id, max: 1, time: 60000 })).first();
				try {
					await response.delete();
				} catch (err) {
					// No-op
				}

				const failed = [];
				const members = ArgParser.parseQuoteArgs(response.content, response.content.includes("|") ? "|" : " ");
				await Promise.all(members.map(async memberQuery => {
					let member;
					try {
						member = await client.memberSearch(memberQuery, msg.guild);
					} catch (err) {
						return failed.push(memberQuery);
					}
					if (!member || !member.user) return;
					// Discord.js v14: use permissionOverwrites.edit instead of updateOverwrite
					msg.channel.permissionOverwrites.edit(member, {
						ViewChannel: true,
					}, { reason: `Room Management | Command issued by ${msg.member.tag}` }).catch(err => {
						logger.debug(`Failed to add member '${member.user.username}' to room '${msg.channel.name}' on server '${msg.guild.name}'`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: member.id }, err);
					});
				}));
				question.edit({
					embeds: [{
						color: Colors.SUCCESS,
						description: "Welcome, new people! 😘",
						footer: !failed.length ? undefined : {
							text: `I couldn't find members for ${failed.splice(0, 3).join(", ")}${failed.length > 3 ? " and more" : ""}`,
						},
					}],
				});
			} else {
				question.edit({
					embeds: [{
						color: Colors.SUCCESS,
						description: "Ok! I won't add any members either.",
					}],
				});
			}
		}
	} else if (msg.suffix) {
		const args = ArgParser.parseQuoteArgs(msg.suffix);
		if (["text", "voice"].includes(args[0].toLowerCase())) {
			const [type] = args.splice(0, 1);

			// Voice rooms require voice_features premium feature
			if (type === "voice") {
				const hasVoiceFeatures = await TierManager.canAccess(msg.author.id, "voice_features");
				if (!hasVoiceFeatures) {
					return msg.send({
						embeds: [{
							color: Colors.SOFT_ERR,
							title: "Premium Feature",
							description: "Voice room creation requires a premium subscription.",
							footer: { text: "Upgrade your membership to create voice rooms." },
						}],
					});
				}
			}

			const members = [];

			await Promise.all(args.map(async memberQuery => {
				const member = await client.memberSearch(memberQuery, msg.guild).catch(() => {
					// No-op
				});
				if (member) members.push(member);
			}));

			if (!serverDocument.config.room_category || !msg.guild.channels.cache.has(serverDocument.config.room_category)) {
				const categoryChannel = await msg.guild.channels.create("Talk Rooms", {
					reason: "Room Management | Creating room category",
					type: "category",
				});
				serverQueryDocument.set("config.room_category", categoryChannel.id);
			}

			const permissionOverwrites = members.map(member => ({
				id: member.user.id,
				type: "member",
				allow: PermissionFlagsBits.ViewChannel,
			}));

			const channel = await msg.guild.channels.create(`talk-room-${Date.now()}`, {
				reason: `Room Management | Command issued by ${msg.author.tag}`,
				type,
				parent: serverDocument.config.room_category,
				topic: `Talk Room created by ${msg.author.tag}`,
				permissionOverwrites: [{
					id: msg.guild.id,
					type: "role",
					deny: PermissionFlagsBits.ViewChannel,
				}, {
					id: msg.author.id,
					type: "member",
					allow: PermissionFlagsBits.ViewChannel,
				}, ...permissionOverwrites],
			}).catch(err => {
				logger.debug(`Failed to create talk room in '${msg.guild.name}'`, { svrid: msg.guild.id, err });
			});
			if (channel && channel.type === ChannelType.GuildText) {
				channel.send({
					embeds: [{
						color: Colors.SUCCESS,
						title: "First! 🐬",
						description: `Use \`${msg.guild.commandPrefix}${commandData.name}\` to delete this room or add members.`,
					}],
				});
			} else if (channel && channel.type === ChannelType.GuildVoice) {
				msg.send({
					embeds: [{
						color: Colors.SUCCESS,
						title: "Room created! 🐬",
						description: `The room will automatically be deleted once everyone leaves.`,
					}],
				});
			}

			if (channel) serverQueryDocument.push("config.room_data", { _id: channel.id });
		} else {
			logger.silly(`Invalid parameters \`${msg.suffix}\` provided for ${commandData.name}`, { usrid: msg.author.id });
			msg.sendInvalidUsage(commandData);
		}
	} else {
		msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				description: "This channel isn't a room!",
				footer: {
					text: `Create a new room using ${msg.guild.commandPrefix}${commandData.name} ${commandData.usage}`,
				},
			}],
		});
	}
};
