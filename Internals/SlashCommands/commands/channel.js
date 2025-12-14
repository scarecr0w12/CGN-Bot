const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("channel")
		.setDescription("Channel management commands")
		.addSubcommand(sub =>
			sub.setName("lock")
				.setDescription("Lock the current channel, preventing everyone from sending messages")
				.addStringOption(opt =>
					opt.setName("reason")
						.setDescription("Reason for locking the channel")
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unlock")
				.setDescription("Unlock a previously locked channel")
				.addStringOption(opt =>
					opt.setName("reason")
						.setDescription("Reason for unlocking the channel")
						.setRequired(false),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction) {
		const subcommand = interaction.options.getSubcommand();
		const reason = interaction.options.getString("reason");
		const everyoneRole = interaction.guild.roles.everyone;

		if (subcommand === "lock") {
			const lockReason = reason || "Channel locked by moderator";

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
				}, { reason: `${lockReason} | Locked by @${interaction.user.tag}` });

				return interaction.reply({
					embeds: [{
						color: 0x00FF00,
						title: "🔒 Channel Locked",
						description: "This channel has been locked. Only moderators can send messages.",
						fields: [
							{ name: "Reason", value: lockReason, inline: false },
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
		} else if (subcommand === "unlock") {
			const unlockReason = reason || "Channel unlocked by moderator";

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
				}, { reason: `${unlockReason} | Unlocked by @${interaction.user.tag}` });

				return interaction.reply({
					embeds: [{
						color: 0x00FF00,
						title: "🔓 Channel Unlocked",
						description: "This channel has been unlocked. Everyone can send messages again.",
						fields: [
							{ name: "Reason", value: unlockReason, inline: false },
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
		}
	},
};
