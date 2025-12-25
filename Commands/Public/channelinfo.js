const moment = require("moment");
const { ChannelType } = require("discord.js");

const CHANNEL_TYPE_NAMES = {
	[ChannelType.GuildText]: "Text Channel",
	[ChannelType.GuildVoice]: "Voice Channel",
	[ChannelType.GuildCategory]: "Category",
	[ChannelType.GuildAnnouncement]: "Announcement Channel",
	[ChannelType.GuildStageVoice]: "Stage Channel",
	[ChannelType.GuildForum]: "Forum Channel",
	[ChannelType.GuildMedia]: "Media Channel",
	[ChannelType.PublicThread]: "Public Thread",
	[ChannelType.PrivateThread]: "Private Thread",
	[ChannelType.AnnouncementThread]: "Announcement Thread",
};

const CHANNEL_TYPE_EMOJIS = {
	[ChannelType.GuildText]: "💬",
	[ChannelType.GuildVoice]: "🔊",
	[ChannelType.GuildCategory]: "📁",
	[ChannelType.GuildAnnouncement]: "📢",
	[ChannelType.GuildStageVoice]: "🎭",
	[ChannelType.GuildForum]: "📋",
	[ChannelType.GuildMedia]: "🖼️",
	[ChannelType.PublicThread]: "🧵",
	[ChannelType.PrivateThread]: "🔒",
	[ChannelType.AnnouncementThread]: "📣",
};

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let channel = msg.channel;

	if (msg.suffix) {
		const search = msg.suffix.trim().replace(/^<#|>$/g, "");
		channel = msg.guild.channels.cache.get(search) ||
			msg.guild.channels.cache.find(c => c.name.toLowerCase() === search.toLowerCase()) ||
			msg.guild.channels.cache.find(c => c.name.toLowerCase().includes(search.toLowerCase()));

		if (!channel) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "Channel not found 🔍",
					description: "I couldn't find that channel. Try mentioning it or using its name.",
				}],
			});
		}
	}

	const typeName = CHANNEL_TYPE_NAMES[channel.type] || "Unknown";
	const typeEmoji = CHANNEL_TYPE_EMOJIS[channel.type] || "❓";

	const fields = [
		{
			name: "📋 Type",
			value: `${typeEmoji} ${typeName}`,
			inline: true,
		},
		{
			name: "🆔 ID",
			value: `\`${channel.id}\``,
			inline: true,
		},
		{
			name: "📅 Created",
			value: moment(channel.createdTimestamp).fromNow(),
			inline: true,
		},
	];

	if (channel.parent) {
		fields.push({
			name: "📁 Category",
			value: channel.parent.name,
			inline: true,
		});
	}

	if (channel.position !== undefined) {
		fields.push({
			name: "#️⃣ Position",
			value: (channel.position + 1).toString(),
			inline: true,
		});
	}

	if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
		if (channel.topic) {
			fields.push({
				name: "📝 Topic",
				value: channel.topic.length > 200 ? `${channel.topic.slice(0, 200)}...` : channel.topic,
				inline: false,
			});
		}

		if (channel.rateLimitPerUser) {
			fields.push({
				name: "🐌 Slowmode",
				value: `${channel.rateLimitPerUser}s slowmode`,
				inline: true,
			});
		}

		if (channel.nsfw) {
			fields.push({
				name: "🔞 NSFW",
				value: "Yes",
				inline: true,
			});
		}
	}

	if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
		fields.push({
			name: "👥 User Limit",
			value: channel.userLimit ? channel.userLimit.toString() : "Unlimited",
			inline: true,
		});

		fields.push({
			name: "🎵 Bitrate",
			value: `${channel.bitrate / 1000}kbps`,
			inline: true,
		});

		const membersInChannel = channel.members?.size || 0;
		fields.push({
			name: "🎤 Connected",
			value: membersInChannel.toString(),
			inline: true,
		});
	}

	if (channel.type === ChannelType.GuildForum) {
		const threadCount = channel.threads?.cache.size || 0;
		fields.push({
			name: "🧵 Active Threads",
			value: threadCount.toString(),
			inline: true,
		});
	}

	return msg.send({
		embeds: [{
			color: Colors.INFO,
			title: `${typeEmoji} ${channel.name}`,
			fields,
			footer: {
				text: `Channel ID: ${channel.id}`,
			},
		}],
	});
};
