const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("View a user's profile")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to view (defaults to you)")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const user = interaction.options.getUser("user") || interaction.user;
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);
		const memberDocument = serverDocument.members.id(user.id);

		if (!member || !memberDocument) {
			return interaction.reply({
				content: "Could not find that user!",
				ephemeral: true,
			});
		}

		const points = memberDocument.points || 0;
		const messages = memberDocument.messages || 0;
		const afkMessage = memberDocument.afk_message || "Not set";
		const strikes = memberDocument.strikes ? memberDocument.strikes.length : 0;

		const adminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, member);
		const adminText = ["None", "Basic Admin", "Moderator", "Full Admin"][adminLevel] || "Unknown";

		return interaction.reply({
			embeds: [{
				color: member.displayColor || 0x3669FA,
				title: `Profile: ${client.getName(serverDocument, member)}`,
				thumbnail: { url: user.displayAvatarURL({ size: 256 }) },
				fields: [
					{ name: "⭐ Points", value: `${points}`, inline: true },
					{ name: "💬 Messages", value: `${messages}`, inline: true },
					{ name: "⚠️ Strikes", value: `${strikes}`, inline: true },
					{ name: "🛡️ Admin Level", value: adminText, inline: true },
					{ name: "💤 AFK", value: afkMessage, inline: true },
					{ name: "📅 Joined", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
				],
			}],
		});
	},
};
