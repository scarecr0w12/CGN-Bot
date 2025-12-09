const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
	adminLevel: 0,
	data: new SlashCommandBuilder()
		.setName("room")
		.setDescription("Manage temporary voice rooms")
		.addSubcommand(sub =>
			sub.setName("create")
				.setDescription("Create a temporary voice room")
				.addStringOption(opt =>
					opt.setName("name")
						.setDescription("Room name")
						.setRequired(true),
				)
				.addIntegerOption(opt =>
					opt.setName("limit")
						.setDescription("User limit (0 for unlimited)")
						.setMinValue(0)
						.setMaxValue(99)
						.setRequired(false),
				),
		)
		.addSubcommand(sub =>
			sub.setName("delete")
				.setDescription("Delete your temporary voice room"),
		)
		.addSubcommand(sub =>
			sub.setName("lock")
				.setDescription("Lock your temporary voice room"),
		)
		.addSubcommand(sub =>
			sub.setName("unlock")
				.setDescription("Unlock your temporary voice room"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Connect),

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();
		const serverQueryDocument = serverDocument.query;

		// Initialize temp_rooms if not exists
		if (!serverDocument.config.temp_rooms) {
			serverQueryDocument.set("config.temp_rooms", []);
		}

		const tempRooms = serverDocument.config.temp_rooms || [];
		const userRoom = tempRooms.find(r => r.owner_id === interaction.user.id);

		switch (subcommand) {
			case "create": {
				if (userRoom) {
					return interaction.reply({
						content: "You already have a temporary room!",
						ephemeral: true,
					});
				}

				const name = interaction.options.getString("name");
				const limit = interaction.options.getInteger("limit") || 0;

				try {
					const channel = await interaction.guild.channels.create({
						name: `🔊 ${name}`,
						type: ChannelType.GuildVoice,
						userLimit: limit,
						reason: `Temporary room by ${interaction.user.tag}`,
					});

					serverQueryDocument.push("config.temp_rooms", {
						channel_id: channel.id,
						owner_id: interaction.user.id,
						created_at: Date.now(),
					});
					await serverDocument.save();

					return interaction.reply({
						content: `✅ Created your room: ${channel}`,
					});
				} catch (err) {
					return interaction.reply({
						content: `Failed to create room: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "delete": {
				if (!userRoom) {
					return interaction.reply({
						content: "You don't have a temporary room!",
						ephemeral: true,
					});
				}

				try {
					const channel = await interaction.guild.channels.fetch(userRoom.channel_id);
					if (channel) await channel.delete("Room owner deleted");

					serverQueryDocument.pull("config.temp_rooms", userRoom);
					await serverDocument.save();

					return interaction.reply({
						content: "🗑️ Your room has been deleted!",
						ephemeral: true,
					});
				} catch (err) {
					return interaction.reply({
						content: `Failed to delete room: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "lock": {
				if (!userRoom) {
					return interaction.reply({
						content: "You don't have a temporary room!",
						ephemeral: true,
					});
				}

				try {
					const channel = await interaction.guild.channels.fetch(userRoom.channel_id);
					await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });

					return interaction.reply({
						content: "🔒 Your room is now locked!",
						ephemeral: true,
					});
				} catch (err) {
					return interaction.reply({
						content: `Failed to lock room: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			case "unlock": {
				if (!userRoom) {
					return interaction.reply({
						content: "You don't have a temporary room!",
						ephemeral: true,
					});
				}

				try {
					const channel = await interaction.guild.channels.fetch(userRoom.channel_id);
					await channel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });

					return interaction.reply({
						content: "🔓 Your room is now unlocked!",
						ephemeral: true,
					});
				} catch (err) {
					return interaction.reply({
						content: `Failed to unlock room: ${err.message}`,
						ephemeral: true,
					});
				}
			}

			default:
				return interaction.reply({ content: "Unknown subcommand", ephemeral: true });
		}
	},
};
