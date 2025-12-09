const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("strike")
		.setDescription("Give a warning/strike to a user")
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("The user to strike")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("reason")
				.setDescription("Reason for the strike")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute (interaction, client, serverDocument) {
		const user = interaction.options.getUser("user");
		const reason = interaction.options.getString("reason") || "No reason specified";

		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		if (!member) {
			return interaction.reply({
				content: "Could not find that user!",
				ephemeral: true,
			});
		}

		// Don't allow striking bots or admins
		if (user.bot) {
			return interaction.reply({
				content: "You cannot strike a bot!",
				ephemeral: true,
			});
		}

		const targetAdminLevel = client.getUserBotAdmin(interaction.guild, serverDocument, member);
		if (targetAdminLevel > 0) {
			return interaction.reply({
				content: "You cannot strike an admin!",
				ephemeral: true,
			});
		}

		// Add strike to member document
		const memberDocument = serverDocument.members.id(user.id);
		if (!memberDocument) {
			return interaction.reply({
				content: "Could not find member data!",
				ephemeral: true,
			});
		}

		if (!memberDocument.strikes) {
			memberDocument.strikes = [];
		}

		memberDocument.strikes.push({
			reason: reason,
			admin: interaction.user.id,
			timestamp: Date.now(),
		});

		await serverDocument.save();

		const strikeCount = memberDocument.strikes.length;
		const ordinal = getOrdinal(strikeCount);

		// Create ModLog entry
		await CreateModLog(interaction.guild, "Strike", member, interaction.user, reason);

		// DM the user
		try {
			await user.send({
				embeds: [{
					color: 0xFFFF00,
					description: `You've received a strike in \`${interaction.guild.name}\`! ⚠️`,
					fields: [
						{ name: "Reason", value: reason, inline: true },
						{ name: "Strike #", value: `${strikeCount}${ordinal}`, inline: true },
					],
				}],
			});
		} catch (_) {
			// DMs disabled
		}

		return interaction.reply({
			embeds: [{
				color: 0xFFFF00,
				description: `**@${user.tag}** has received their ${strikeCount}${ordinal} strike! ⚠️`,
				fields: [
					{ name: "Reason", value: reason, inline: true },
				],
			}],
		});
	},
};

function getOrdinal (n) {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}
