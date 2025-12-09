const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("alert")
		.setDescription("Send an alert to all server admins")
		.addStringOption(opt =>
			opt.setName("message")
				.setDescription("The alert message")
				.setRequired(true)
				.setMaxLength(1000),
		),

	async execute (interaction, client, serverDocument) {
		const message = interaction.options.getString("message");

		// Get admin members
		const adminMembers = interaction.guild.members.cache.filter(member => {
			const adminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, member);
			return adminLevel >= 1 && !member.user.bot;
		});

		if (adminMembers.size === 0) {
			return interaction.reply({
				content: "No admins found to alert!",
				ephemeral: true,
			});
		}

		// Send DMs to admins
		let sent = 0;
		for (const [, admin] of adminMembers) {
			try {
				await admin.send({
					embeds: [{
						color: 0xFF0000,
						title: "🚨 Alert from Server",
						description: message,
						fields: [
							{ name: "Server", value: interaction.guild.name, inline: true },
							{ name: "Channel", value: `<#${interaction.channel.id}>`, inline: true },
							{ name: "From", value: `<@${interaction.user.id}>`, inline: true },
						],
						timestamp: new Date().toISOString(),
					}],
				});
				sent++;
			} catch (_) {
				// DMs disabled
			}
		}

		return interaction.reply({
			content: `🚨 Alert sent to **${sent}** admin(s)!`,
			ephemeral: true,
		});
	},
};
