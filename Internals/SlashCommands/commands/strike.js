const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { create: CreateModLog } = require("../../../Modules/ModLog");

module.exports = {
	adminLevel: 1,
	data: new SlashCommandBuilder()
		.setName("strike")
		.setDescription("Manage user strikes/warnings")
		.addSubcommand(sub =>
			sub.setName("give")
				.setDescription("Give a strike to a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("The user to strike")
						.setRequired(true),
				)
				.addStringOption(opt =>
					opt.setName("reason")
						.setDescription("Reason for the strike")
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("remove")
				.setDescription("Remove a strike from a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("The user to remove strike from")
						.setRequired(true),
				)
				.addIntegerOption(opt =>
					opt.setName("index")
						.setDescription("Strike number to remove (from /strikes list)")
						.setRequired(false)
						.setMinValue(1),
				),
		)
		.addSubcommand(sub =>
			sub.setName("clear")
				.setDescription("Clear all strikes from a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("The user to clear strikes from")
						.setRequired(true),
				),
		)
		.addSubcommand(sub =>
			sub.setName("view")
				.setDescription("View strikes for a user")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("The user to view strikes for")
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const user = interaction.options.getUser("user");

		// Get member document
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

		switch (subcommand) {
			case "give": {
				const member = await interaction.guild.members.fetch(user.id).catch(() => null);
				if (!member) {
					return interaction.reply({
						content: "Could not find that user in this server!",
						ephemeral: true,
					});
				}

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

				const reason = interaction.options.getString("reason") || "No reason specified";

				memberDocument.strikes.push({
					reason: reason,
					admin: interaction.user.id,
					timestamp: Date.now(),
				});

				await serverDocument.save();

				const strikeCount = memberDocument.strikes.length;
				const ordinal = getOrdinal(strikeCount);

				await CreateModLog(interaction.guild, "Strike", member, interaction.user, reason);

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
			}

			case "remove": {
				if (memberDocument.strikes.length === 0) {
					return interaction.reply({
						content: `${user.tag} has no strikes to remove!`,
						ephemeral: true,
					});
				}

				const index = interaction.options.getInteger("index");
				let removedStrike;

				if (index) {
					if (index > memberDocument.strikes.length) {
						return interaction.reply({
							content: `Invalid strike index. User only has ${memberDocument.strikes.length} strike(s).`,
							ephemeral: true,
						});
					}
					removedStrike = memberDocument.strikes.splice(index - 1, 1)[0];
				} else {
					removedStrike = memberDocument.strikes.pop();
				}

				await serverDocument.save();

				await CreateModLog(interaction.guild, "Strike Removed", { user }, interaction.user,
					`Removed: "${removedStrike.reason}"`);

				return interaction.reply({
					embeds: [{
						color: 0x00FF00,
						description: `✅ Removed strike from **@${user.tag}**`,
						fields: [
							{ name: "Removed Reason", value: removedStrike.reason, inline: true },
							{ name: "Remaining Strikes", value: `${memberDocument.strikes.length}`, inline: true },
						],
					}],
					ephemeral: true,
				});
			}

			case "clear": {
				const count = memberDocument.strikes.length;
				if (count === 0) {
					return interaction.reply({
						content: `${user.tag} has no strikes to clear!`,
						ephemeral: true,
					});
				}

				memberDocument.strikes = [];
				await serverDocument.save();

				await CreateModLog(interaction.guild, "Strikes Cleared", { user }, interaction.user,
					`Cleared ${count} strike(s)`);

				return interaction.reply({
					embeds: [{
						color: 0x00FF00,
						description: `✅ Cleared **${count}** strike(s) from **@${user.tag}**`,
					}],
					ephemeral: true,
				});
			}

			case "view": {
				if (memberDocument.strikes.length === 0) {
					return interaction.reply({
						content: `${user.tag} has no strikes.`,
						ephemeral: true,
					});
				}

				const strikes = memberDocument.strikes.slice(-10).map((s, i) => {
					const date = s.timestamp ? `<t:${Math.floor(s.timestamp / 1000)}:R>` : "Unknown";
					const admin = s.admin ? `<@${s.admin}>` : "System";
					return `**${i + 1}.** ${s.reason}\n   └ By ${admin} ${date}`;
				}).join("\n\n");

				return interaction.reply({
					embeds: [{
						color: 0xFFFF00,
						title: `⚠️ Strikes for ${user.tag}`,
						description: strikes,
						footer: { text: `Total: ${memberDocument.strikes.length} strike(s)` },
					}],
					ephemeral: true,
				});
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};

function getOrdinal (n) {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}
