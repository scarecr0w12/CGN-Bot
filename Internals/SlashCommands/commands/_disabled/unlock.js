const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("unlock")
		.setDescription("Unlock a previously locked channel")
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for unlocking the channel")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction) {
		const reason = interaction.options.getString("reason") || "Channel unlocked by moderator";
		const everyoneRole = interaction.guild.roles.everyone;

		// Check if already unlocked
		const currentPerms = interaction.channel.permissionOverwrites.cache.get(everyoneRole.id);
		if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
			return interaction.reply({
				content: "🔓 This channel is not locked!",
				ephemeral: true,
			});
		}

		try {
			await interaction.channel.permissionOverwrites.edit(everyoneRole, {
				SendMessages: null,
			}, { reason: `${reason} | Unlocked by @${interaction.user.tag}` });

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					title: "🔓 Channel Unlocked",
					description: "This channel has been unlocked. Everyone can send messages again.",
					fields: [
						{ name: "Reason", value: reason, inline: false },
						{ name: "Unlocked by", value: `<@${interaction.user.id}>`, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to unlock the channel: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
