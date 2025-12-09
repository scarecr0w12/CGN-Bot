const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Get help with bot commands")
		.addStringOption(opt =>
			opt.setName("command")
				.setDescription("Get help for a specific command")
				.setRequired(false),
		),

	async execute (interaction, client, serverDocument) {
		const commandName = interaction.options.getString("command");
		const prefix = serverDocument.config.command_prefix || "!";

		if (commandName) {
			// Show help for specific command
			const commands = require("../../../Configurations/commands.js");
			const cmd = commands.public[commandName.toLowerCase()];

			if (!cmd) {
				return interaction.reply({
					content: `Command \`${commandName}\` not found!`,
					ephemeral: true,
				});
			}

			return interaction.reply({
				embeds: [{
					color: 0x3669FA,
					title: `📖 Help: ${commandName}`,
					description: cmd.description || "No description available",
					fields: [
						{ name: "Usage", value: `\`${prefix}${commandName} ${cmd.usage || ""}\``, inline: false },
						{ name: "Category", value: cmd.category || "General", inline: true },
						{ name: "Admin Level", value: `${cmd.defaults ? cmd.defaults.adminLevel : 0}`, inline: true },
					],
				}],
				ephemeral: true,
			});
		}

		// Show general help
		return interaction.reply({
			embeds: [{
				color: 0x3669FA,
				title: "📖 SkynetBot Help",
				description: [
					`Use \`/help <command>\` for info on a specific command.`,
					"",
					"**Categories:**",
					"🎪 Fun - Entertainment commands",
					"🔦 Utility - Useful tools",
					"⚒ Moderation - Server management",
					"🎬 Search & Media - Search engines & media",
					"⭐️ Stats & Points - Rankings and points",
					"🤖 SkynetBot - Bot info commands",
				].join("\n"),
				footer: { text: `Prefix: ${prefix} | Slash commands also available!` },
			}],
			ephemeral: true,
		});
	},
};
