const { SlashCommandBuilder, time, TimestampStyles } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("userinfo")
		.setDescription("Display detailed information about a user")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to get information about")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const user = interaction.options.getUser("user") || interaction.user;
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			return interaction.reply({
				content: "Could not find that user in this server!",
				ephemeral: true,
			});
		}

		// Get roles
		const roles = member.roles.cache
			.filter(r => r.id !== interaction.guild.id)
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
			if (member.permissions.has("BanMembers")) keyPermissions.push("Ban Members");
			if (member.permissions.has("KickMembers")) keyPermissions.push("Kick Members");
		}

		// Bot admin level
		const adminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, member);
		const adminLevelText = ["None", "Basic Admin", "Moderator", "Full Admin"][adminLevel] || "Unknown";

		const color = member.displayHexColor !== "#000000" ? member.displayColor : 0x3669FA;

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
				name: "📅 Dates",
				value: [
					`**Created:** ${time(user.createdAt, TimestampStyles.RelativeTime)}`,
					`**Joined:** ${time(member.joinedAt, TimestampStyles.RelativeTime)}`,
				].join("\n"),
				inline: true,
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

		return interaction.reply({
			embeds: [{
				color,
				title: `User Info: ${client.getName(serverDocument, member)}`,
				thumbnail: { url: user.displayAvatarURL({ size: 256 }) },
				fields,
				footer: { text: `Requested by ${interaction.user.tag}` },
				timestamp: new Date().toISOString(),
			}],
		});
	},
};
