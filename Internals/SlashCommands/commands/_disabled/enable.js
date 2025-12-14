const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	adminLevel: 3,
	data: new SlashCommandBuilder()
		.setName("enable")
		.setDescription("Enable a command in this channel")
		.addStringOption(opt =>
			opt.setName("command")
				.setDescription("The command to enable")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute (interaction, client, serverDocument) {
		const commandName = interaction.options.getString("command").toLowerCase();
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
				.set("isEnabled", true);
		} else {
			serverQueryDocument.id("channels", channelDocument._id)
				.push("command_overrides", { _id: commandName, isEnabled: true });
		}

		await serverDocument.save();

		return interaction.reply({
			content: `✅ Command \`${commandName}\` has been **enabled** in this channel!`,
			ephemeral: true,
		});
	},
};
