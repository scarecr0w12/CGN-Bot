const { time, TimestampStyles } = require("discord.js");

module.exports = async ({ client, Constants: { Colors } }, { serverDocument }, msg, commandData) => {
	let { member } = msg;

	if (msg.suffix) {
		member = await client.memberSearch(msg.suffix.trim(), msg.guild).catch(() => null);
		if (!member) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "I couldn't find that user in this server! 🧐",
				}],
			});
		}
	}

	const { user } = member;

	// Calculate account age
	const accountCreated = user.createdAt;
	const joinedServer = member.joinedAt;

	// Get roles (excluding @everyone)
	const roles = member.roles.cache
		.filter(r => r.id !== msg.guild.id)
		.sort((a, b) => b.position - a.position)
		.map(r => `<@&${r.id}>`)
		.slice(0, 15);
	const rolesDisplay = roles.length > 0 ? roles.join(", ") : "None";
	const moreRoles = member.roles.cache.size - 1 - 15;

	// Get permissions
	const keyPermissions = [];
	if (member.permissions.has("Administrator")) {
		keyPermissions.push("Administrator");
	} else {
		if (member.permissions.has("ManageGuild")) keyPermissions.push("Manage Server");
		if (member.permissions.has("ManageChannels")) keyPermissions.push("Manage Channels");
		if (member.permissions.has("ManageRoles")) keyPermissions.push("Manage Roles");
		if (member.permissions.has("ManageMessages")) keyPermissions.push("Manage Messages");
		if (member.permissions.has("KickMembers")) keyPermissions.push("Kick Members");
		if (member.permissions.has("BanMembers")) keyPermissions.push("Ban Members");
		if (member.permissions.has("MentionEveryone")) keyPermissions.push("Mention Everyone");
	}

	// User badges/flags
	const flags = user.flags ? user.flags.toArray() : [];
	const badgeEmojis = {
		Staff: "👨‍💼",
		Partner: "🤝",
		Hypesquad: "🏠",
		BugHunterLevel1: "🐛",
		BugHunterLevel2: "🐛🐛",
		// Bravery
		HypeSquadOnlineHouse1: "🟡",
		// Brilliance
		HypeSquadOnlineHouse2: "🟣",
		// Balance
		HypeSquadOnlineHouse3: "🟢",
		PremiumEarlySupporter: "👑",
		VerifiedDeveloper: "💻",
		VerifiedBot: "✅",
		ActiveDeveloper: "🛠️",
	};
	const badges = flags.map(f => badgeEmojis[f] || f).join(" ") || "None";

	// Bot admin level
	const adminLevel = client.getUserBotAdmin(msg.guild, serverDocument, member);
	const adminLevelText = ["None", "Basic Admin", "Moderator", "Full Admin"][adminLevel] || "Unknown";

	// Highest role color
	const color = member.displayHexColor !== "#000000" ? member.displayColor : Colors.INFO;

	// Status
	const { presence } = member;
	const statusEmoji = {
		online: "🟢",
		idle: "🟡",
		dnd: "🔴",
		offline: "⚫",
	};
	const status = presence ? `${statusEmoji[presence.status] || "⚫"} ${presence.status.charAt(0).toUpperCase() + presence.status.slice(1)}` : "⚫ Offline";

	// Activity
	let activity = "None";
	if (presence && presence.activities.length > 0) {
		const act = presence.activities[0];
		if (act.type === 0) activity = `Playing ${act.name}`;
		else if (act.type === 1) activity = `Streaming ${act.name}`;
		else if (act.type === 2) activity = `Listening to ${act.name}`;
		else if (act.type === 3) activity = `Watching ${act.name}`;
		else if (act.type === 4) activity = act.state || "Custom Status";
		else if (act.type === 5) activity = `Competing in ${act.name}`;
	}

	const fields = [
		{
			name: "📋 User Information",
			value: [
				`**ID:** ${user.id}`,
				`**Username:** ${user.tag}`,
				`**Nickname:** ${member.nickname || "None"}`,
				`**Bot:** ${user.bot ? "Yes 🤖" : "No"}`,
			].join("\n"),
			inline: true,
		},
		{
			name: "📊 Status",
			value: [
				`**Status:** ${status}`,
				`**Activity:** ${activity}`,
			].join("\n"),
			inline: true,
		},
		{
			name: "📅 Dates",
			value: [
				`**Account Created:** ${time(accountCreated, TimestampStyles.RelativeTime)}`,
				`**Joined Server:** ${time(joinedServer, TimestampStyles.RelativeTime)}`,
			].join("\n"),
			inline: false,
		},
		{
			name: `🏷️ Roles [${member.roles.cache.size - 1}]`,
			value: rolesDisplay + (moreRoles > 0 ? ` +${moreRoles} more` : ""),
			inline: false,
		},
	];

	if (keyPermissions.length > 0) {
		fields.push({
			name: "🔑 Key Permissions",
			value: keyPermissions.join(", "),
			inline: false,
		});
	}

	fields.push({
		name: "🤖 Bot Admin Level",
		value: adminLevelText,
		inline: true,
	});

	if (badges !== "None") {
		fields.push({
			name: "🎖️ Badges",
			value: badges,
			inline: true,
		});
	}

	return msg.send({
		embeds: [{
			color,
			title: `User Info: ${client.getName(serverDocument, member)}`,
			thumbnail: { url: user.displayAvatarURL({ size: 256, dynamic: true }) },
			fields,
			footer: { text: `Requested by ${msg.author.tag}` },
			timestamp: new Date().toISOString(),
		}],
	});
};
