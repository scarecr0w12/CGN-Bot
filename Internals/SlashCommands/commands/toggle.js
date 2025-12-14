const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("toggle")
		.setDescription("Enable or disable a command in this channel")
		.addStringOption(opt =>
			opt.setName("command")
				.setDescription("The command to toggle")
				.setRequired(true),
		)
		.addStringOption(opt =>
			opt.setName("action")
				.setDescription("Enable or disable the command")
				.setRequired(true)
				.addChoices(
					{ name: "Enable", value: "enable" },
					{ name: "Disable", value: "disable" },
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction, client, serverDocument) {
		const commandName = interaction.options.getString("command").toLowerCase();
		const action = interaction.options.getString("action");
		const isEnabled = action === "enable";

		const commands = require("../../../Configurations/commands.js");

		if (!commands.public[commandName]) {
			return interaction.reply({
				content: `Command \`${commandName}\` not found!`,
				ephemeral: true,
			});
		}

		const serverQueryDocument = serverDocument.query;
		const channelDocument = serverDocument.channels.id(interaction.channel.id);

		if (!channelDocument) {
			return interaction.reply({
				content: "Could not find channel configuration!",
				ephemeral: true,
			});
		}

		const cmdDoc = channelDocument.command_overrides.id(commandName);
		if (cmdDoc) {
			serverQueryDocument.id("channels", channelDocument._id)
				.id("command_overrides", cmdDoc._id)
				.set("isEnabled", isEnabled);
		} else {
			serverQueryDocument.id("channels", channelDocument._id)
				.push("command_overrides", { _id: commandName, isEnabled });
		}

		await serverDocument.save();

		const emoji = isEnabled ? "✅" : "🚫";
		const status = isEnabled ? "enabled" : "disabled";

		return interaction.reply({
			content: `${emoji} Command \`${commandName}\` has been **${status}** in this channel!`,
			ephemeral: true,
		});
	},
};
