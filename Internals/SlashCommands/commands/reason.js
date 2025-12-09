const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("reason")
		.setDescription("Update the reason for a modlog case")
		.addIntegerOption(opt =>
			opt.setName("case")
				.setDescription("The case number")
				.setMinValue(1)
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("The new reason")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute (interaction, client, serverDocument) {
		const caseNumber = interaction.options.getInteger("case");
		const newReason = interaction.options.getString("reason");

		const { modlog } = serverDocument;
		if (!modlog || !modlog.entries || modlog.entries.length === 0) {
			return interaction.reply({
				content: "No modlog entries found!",
				ephemeral: true,
			});
		}

		const entry = modlog.entries.find(e => e.case_number === caseNumber);
		if (!entry) {
			return interaction.reply({
				content: `Case #${caseNumber} not found!`,
				ephemeral: true,
			});
		}

		const serverQueryDocument = serverDocument.query;
		serverQueryDocument.id("modlog.entries", entry._id).set("reason", newReason);
		await serverDocument.save();

		return interaction.reply({
			content: `✅ Updated reason for case #${caseNumber}`,
			ephemeral: true,
		});
	},
};
