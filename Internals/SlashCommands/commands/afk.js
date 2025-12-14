const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("afk")
		.setDescription("AFK status management")
		.addSubcommand(sub =>
			sub.setName("set")
				.setDescription("Set your AFK message")
				.addStringOption(opt =>
					opt.setName("message")
						.setDescription("Your AFK message")
						.setRequired(true)
						.setMaxLength(200),
				),
		)
		.addSubcommand(sub =>
			sub.setName("clear")
				.setDescription("Clear your AFK status"),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all AFK members in this server"),
		)
		.addSubcommand(sub =>
			sub.setName("check")
				.setDescription("Check a user's AFK status")
				.addUserOption(opt =>
					opt.setName("user")
						.setDescription("User to check")
						.setRequired(true),
				),
		),

	async execute (interaction, _client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "set":
				await this.setAfk(interaction, serverDocument);
				break;
			case "clear":
				await this.clearAfk(interaction, serverDocument);
				break;
			case "list":
				await this.listAfk(interaction, serverDocument);
				break;
			case "check":
				await this.checkAfk(interaction, serverDocument);
				break;
		}
	},

	async setAfk (interaction, serverDocument) {
		const message = interaction.options.getString("message");

		let memberDocument = serverDocument.members[interaction.user.id];
		if (!memberDocument) {
			serverDocument.query.push("members", { _id: interaction.user.id });
			memberDocument = serverDocument.members[interaction.user.id];
		}

		serverDocument.query.id("members", interaction.user.id).set("afk_message", message);
		serverDocument.query.id("members", interaction.user.id).set("afk_since", new Date());
		await serverDocument.save();

		return interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "💤 AFK Status Set",
				description: `**Message:** ${message}`,
				footer: { text: "I'll notify people when they mention you" },
			}],
			ephemeral: true,
		});
	},

	async clearAfk (interaction, serverDocument) {
		const memberDocument = serverDocument.members[interaction.user.id];

		if (!memberDocument || !memberDocument.afk_message) {
			return interaction.reply({
				content: "You don't have an AFK status set.",
				ephemeral: true,
			});
		}

		serverDocument.query.id("members", interaction.user.id).set("afk_message", null);
		serverDocument.query.id("members", interaction.user.id).set("afk_since", null);
		await serverDocument.save();

		return interaction.reply({
			embeds: [{
				color: 0x57F287,
				title: "👋 Welcome Back!",
				description: "Your AFK status has been cleared.",
			}],
			ephemeral: true,
		});
	},

	async listAfk (interaction, serverDocument) {
		await interaction.deferReply({ ephemeral: true });

		const afkMembers = [];

		for (const [memberId, memberData] of Object.entries(serverDocument.members || {})) {
			if (memberData.afk_message) {
				afkMembers.push({
					id: memberId,
					message: memberData.afk_message,
					since: memberData.afk_since,
				});
			}
		}

		if (afkMembers.length === 0) {
			return interaction.editReply({
				embeds: [{
					color: 0xFEE75C,
					title: "💤 AFK Members",
					description: "No members are currently AFK.",
				}],
			});
		}

		const afkList = await Promise.all(afkMembers.slice(0, 15).map(async member => {
			const user = await interaction.client.users.fetch(member.id).catch(() => null);
			const since = member.since ? `<t:${Math.floor(new Date(member.since).getTime() / 1000)}:R>` : "Unknown";
			return `**${user?.tag || "Unknown"}** - ${since}\n> ${member.message.slice(0, 50)}${member.message.length > 50 ? "..." : ""}`;
		}));

		await interaction.editReply({
			embeds: [{
				color: 0x5865F2,
				title: "💤 AFK Members",
				description: afkList.join("\n\n"),
				footer: { text: `${afkMembers.length} members AFK` },
			}],
		});
	},

	async checkAfk (interaction, serverDocument) {
		const user = interaction.options.getUser("user");
		const memberDocument = serverDocument.members[user.id];

		if (!memberDocument || !memberDocument.afk_message) {
			return interaction.reply({
				embeds: [{
					color: 0x57F287,
					description: `${user} is not AFK.`,
				}],
				ephemeral: true,
			});
		}

		const since = memberDocument.afk_since ?
			`<t:${Math.floor(new Date(memberDocument.afk_since).getTime() / 1000)}:R>` :
			"Unknown";

		return interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: `💤 ${user.tag} is AFK`,
				description: memberDocument.afk_message,
				fields: [
					{ name: "Since", value: since, inline: true },
				],
				thumbnail: { url: user.displayAvatarURL() },
			}],
			ephemeral: true,
		});
	},
};
