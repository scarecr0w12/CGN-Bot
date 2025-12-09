const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("lock")
		.setDescription("Lock the current channel, preventing everyone from sending messages")
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for locking the channel")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction) {
		const reason = interaction.options.getString("reason") || "Channel locked by moderator";
		const everyoneRole = interaction.guild.roles.everyone;

		// Check if already locked
		const currentPerms = interaction.channel.permissionOverwrites.cache.get(everyoneRole.id);
		if (currentPerms && currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
			return interaction.reply({
				content: "🔒 This channel is already locked!",
				ephemeral: true,
			});
		}

		try {
			await interaction.channel.permissionOverwrites.edit(everyoneRole, {
				SendMessages: false,
			}, { reason: `${reason} | Locked by @${interaction.user.tag}` });

			return interaction.reply({
				embeds: [{
					color: 0x00FF00,
					title: "🔒 Channel Locked",
					description: "This channel has been locked. Only moderators can send messages.",
					fields: [
						{ name: "Reason", value: reason, inline: false },
						{ name: "Locked by", value: `<@${interaction.user.id}>`, inline: true },
					],
				}],
			});
		} catch (err) {
			return interaction.reply({
				content: `Failed to lock the channel: ${err.message}`,
				ephemeral: true,
			});
		}
	},
};
