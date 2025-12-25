const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const GameUpdateAnnouncer = require("../../../Modules/GameUpdateAnnouncer");

const games = GameUpdateAnnouncer.getAvailableGames();
const gameChoices = games.map(g => ({ name: g.name, value: g.id }));

module.exports = {
	data: new SlashCommandBuilder()
		.setName("gameupdates")
		.setDescription("Configure game server update announcements")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(sub =>
			sub.setName("subscribe")
				.setDescription("Subscribe a channel to game updates")
				.addStringOption(opt =>
					opt.setName("game")
						.setDescription("The game to subscribe to")
						.setRequired(true)
						.addChoices(...gameChoices),
				)
				.addChannelOption(opt =>
					opt.setName("channel")
						.setDescription("Channel to post updates to")
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
				)
				.addRoleOption(opt =>
					opt.setName("mention")
						.setDescription("Role to mention when updates are posted (optional)"),
				),
		)
		.addSubcommand(sub =>
			sub.setName("unsubscribe")
				.setDescription("Unsubscribe from a game's updates")
				.addStringOption(opt =>
					opt.setName("game")
						.setDescription("The game to unsubscribe from")
						.setRequired(true)
						.addChoices(...gameChoices),
				),
		)
		.addSubcommand(sub =>
			sub.setName("list")
				.setDescription("List all game update subscriptions"),
		)
		.addSubcommand(sub =>
			sub.setName("games")
				.setDescription("List all available games to subscribe to"),
		),

	adminLevel: 2,

	async execute (interaction, client, serverDocument) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "subscribe":
				await handleSubscribe(interaction, serverDocument);
				break;
			case "unsubscribe":
				await handleUnsubscribe(interaction, serverDocument);
				break;
			case "list":
				await handleList(interaction, serverDocument);
				break;
			case "games":
				await handleGames(interaction);
				break;
		}
	},
};

async function handleSubscribe (interaction, serverDocument) {
	const gameId = interaction.options.getString("game");
	const channel = interaction.options.getChannel("channel");
	const mentionRole = interaction.options.getRole("mention");

	const gameInfo = GameUpdateAnnouncer.getGameInfo(gameId);
	if (!gameInfo) {
		return interaction.reply({
			content: "❌ Invalid game selection.",
			ephemeral: true,
		});
	}

	// Check bot permissions in target channel
	const permissions = channel.permissionsFor(interaction.guild.members.me);
	if (!permissions?.has(["SendMessages", "EmbedLinks"])) {
		return interaction.reply({
			content: `❌ I don't have permission to send messages or embeds in ${channel}.`,
			ephemeral: true,
		});
	}

	// Initialize game_updates if not exists
	if (!serverDocument.config.game_updates) {
		serverDocument.config.game_updates = { isEnabled: true, subscriptions: [] };
	}
	if (!serverDocument.config.game_updates.subscriptions) {
		serverDocument.config.game_updates.subscriptions = [];
	}

	// Check if already subscribed
	const existingIndex = serverDocument.config.game_updates.subscriptions.findIndex(
		s => s.game_id === gameId,
	);

	if (existingIndex >= 0) {
		// Update existing subscription
		serverDocument.config.game_updates.subscriptions[existingIndex].channel_id = channel.id;
		serverDocument.config.game_updates.subscriptions[existingIndex].isEnabled = true;
		if (mentionRole) {
			serverDocument.config.game_updates.subscriptions[existingIndex].mention_role_id = mentionRole.id;
		}
	} else {
		// Add new subscription
		serverDocument.config.game_updates.subscriptions.push({
			game_id: gameId,
			channel_id: channel.id,
			isEnabled: true,
			mention_role_id: mentionRole?.id || "",
		});
	}

	serverDocument.config.game_updates.isEnabled = true;
	serverDocument.markModified("config.game_updates");
	await serverDocument.save();

	const mentionText = mentionRole ? ` and will mention ${mentionRole}` : "";
	return interaction.reply({
		embeds: [{
			color: gameInfo.color,
			title: "✅ Game Updates Subscribed",
			description: `You will now receive **${gameInfo.name}** updates in ${channel}${mentionText}.`,
			thumbnail: { url: gameInfo.icon },
			footer: { text: "Updates are checked hourly" },
		}],
	});
}

async function handleUnsubscribe (interaction, serverDocument) {
	const gameId = interaction.options.getString("game");

	const gameInfo = GameUpdateAnnouncer.getGameInfo(gameId);
	if (!gameInfo) {
		return interaction.reply({
			content: "❌ Invalid game selection.",
			ephemeral: true,
		});
	}

	if (!serverDocument.config.game_updates?.subscriptions?.length) {
		return interaction.reply({
			content: "❌ You have no game update subscriptions.",
			ephemeral: true,
		});
	}

	const existingIndex = serverDocument.config.game_updates.subscriptions.findIndex(
		s => s.game_id === gameId,
	);

	if (existingIndex < 0) {
		return interaction.reply({
			content: `❌ You are not subscribed to **${gameInfo.name}** updates.`,
			ephemeral: true,
		});
	}

	serverDocument.config.game_updates.subscriptions.splice(existingIndex, 1);
	serverDocument.markModified("config.game_updates");
	await serverDocument.save();

	return interaction.reply({
		embeds: [{
			color: 0xE74C3C,
			title: "🗑️ Subscription Removed",
			description: `You will no longer receive **${gameInfo.name}** updates.`,
		}],
	});
}

async function handleList (interaction, serverDocument) {
	const subscriptions = serverDocument.config.game_updates?.subscriptions || [];

	if (!subscriptions.length) {
		return interaction.reply({
			embeds: [{
				color: 0x5865F2,
				title: "🎮 Game Update Subscriptions",
				description: "You have no game update subscriptions.\n\nUse `/gameupdates subscribe` to add one!",
			}],
		});
	}

	const fields = subscriptions.map(sub => {
		const gameInfo = GameUpdateAnnouncer.getGameInfo(sub.game_id);
		const channel = interaction.guild.channels.cache.get(sub.channel_id);
		const status = sub.isEnabled ? "✅ Active" : "⏸️ Paused";
		const mentionText = sub.mention_role_id ?
			`\nMention: <@&${sub.mention_role_id}>` :
			"";

		return {
			name: gameInfo?.name || sub.game_id,
			value: `Channel: ${channel || "Unknown"}\nStatus: ${status}${mentionText}`,
			inline: true,
		};
	});

	return interaction.reply({
		embeds: [{
			color: 0x5865F2,
			title: "🎮 Game Update Subscriptions",
			description: `You have ${subscriptions.length} active subscription(s).`,
			fields,
			footer: { text: "Updates are checked hourly" },
		}],
	});
}

async function handleGames (interaction) {
	const gamesList = games.map(g => `• **${g.name}** (\`${g.id}\`)`).join("\n");

	return interaction.reply({
		embeds: [{
			color: 0x5865F2,
			title: "🎮 Available Games",
			description: `Subscribe to any of these games to receive update notifications:\n\n${gamesList}`,
			footer: { text: "Use /gameupdates subscribe to add a subscription" },
		}],
	});
}
