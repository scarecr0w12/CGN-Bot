const moment = require("moment");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	const target = msg.suffix ?
		await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null) :
		msg.member;

	if (!target) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "User not found 🔍",
				description: "I couldn't find that user. Try mentioning them or using their username.",
			}],
		});
	}

	const memberDocument = serverDocument.members[target.id];
	const voiceStats = memberDocument?.voice_stats || {};

	const totalTime = voiceStats.total_time || 0;
	const sessionCount = voiceStats.session_count || 0;
	const lastSession = voiceStats.last_session ? moment(voiceStats.last_session).fromNow() : "Never";

	const formatDuration = (ms) => {
		if (ms === 0) return "0 minutes";
		const duration = moment.duration(ms);
		const parts = [];
		if (duration.days() > 0) parts.push(`${duration.days()}d`);
		if (duration.hours() > 0) parts.push(`${duration.hours()}h`);
		if (duration.minutes() > 0) parts.push(`${duration.minutes()}m`);
		if (parts.length === 0) parts.push("< 1m");
		return parts.join(" ");
	};

	const avgSession = sessionCount > 0 ? Math.floor(totalTime / sessionCount) : 0;

	const isInVoice = target.voice?.channel;
	const currentChannel = isInVoice ? target.voice.channel.name : null;

	const targetName = client.getName(serverDocument, target);

	const fields = [
		{
			name: "📊 Total Voice Time",
			value: formatDuration(totalTime),
			inline: true,
		},
		{
			name: "🔢 Sessions",
			value: sessionCount.toString(),
			inline: true,
		},
		{
			name: "📈 Avg Session",
			value: formatDuration(avgSession),
			inline: true,
		},
		{
			name: "🕐 Last Session",
			value: lastSession,
			inline: true,
		},
	];

	if (isInVoice) {
		fields.push({
			name: "🎤 Currently In",
			value: currentChannel,
			inline: true,
		});
	}

	return msg.send({
		embeds: [{
			color: Colors.INFO,
			author: {
				name: `${targetName}'s Voice Stats`,
				iconURL: target.user.displayAvatarURL({ size: 64 }),
			},
			fields,
			footer: {
				text: isInVoice ? "🟢 Currently in voice" : "⚫ Not in voice",
			},
		}],
	});
};
