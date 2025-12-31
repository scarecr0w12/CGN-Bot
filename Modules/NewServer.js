/* eslint-disable max-len */
const { get: getDatabase } = require("../Database/Driver");
// const Utils = require("./Utils/"); // Disabled: no longer needed after removing startup message
const { PermissionFlagsBits } = require("discord.js");
const ServerTemplates = require("./ServerTemplates");
const TierManager = require("./TierManager");

// Set defaults for new server document
// @param {string} templateId - Optional template ID to apply preset configuration
module.exports = async (client, server, serverDocument, templateId = null) => {
	const DB = getDatabase();

	// Default RSS feed
	const rssFeedsDocs = await DB.GlobalRSSFeeds.find({}).exec();
	const defaultRSSFeeds = rssFeedsDocs.map(d => d.toObject());

	// Default Tags
	const tagsDocs = await DB.GlobalTags.find({}).exec();
	const defaultTags = tagsDocs.map(d => d.toObject());

	// Default Ranks
	const ranksDocs = await DB.GlobalRanks.find({}).exec();
	const defaultRanksList = ranksDocs.map(d => d.toObject());

	// Default Status Messages
	const statusDocs = await DB.GlobalStatusMessages.find({}).exec();
	const defStatusMessages = {};
	statusDocs.forEach(d => {
		defStatusMessages[d._id] = d.messages;
	});

	// Default Tag Reactions
	const reactionDocs = await DB.GlobalTagReactions.find({}).exec();
	const defTagReactions = reactionDocs.map(d => d.content);

	const serverConfigQueryDocument = serverDocument.query.prop("config");
	// Default admin roles
	const serverRoles = server.roles && server.roles.cache ? [...server.roles.cache.values()] : server.roles || [];
	serverRoles.forEach(role => {
		if (role.name !== "@everyone" && !role.managed && role.permissions.has(PermissionFlagsBits.ManageGuild, true) && !serverDocument.config.admins.id(role.id)) {
			serverConfigQueryDocument.push("admins", {
				_id: role.id,
				level: 3,
			});
		}
	});

	// Default RSS feed
	serverConfigQueryDocument.set("rss_feeds", defaultRSSFeeds);

	// Default tag list
	serverConfigQueryDocument.set("tags.list", defaultTags);

	// Default ranks list
	serverConfigQueryDocument.set("ranks_list", defaultRanksList);

	// Default member messages (only set if values exist)
	if (defStatusMessages.new_member_message !== undefined) {
		serverConfigQueryDocument.set("moderation.status_messages.new_member_message.messages", defStatusMessages.new_member_message);
	}
	if (defStatusMessages.member_online_message !== undefined) {
		serverConfigQueryDocument.set("moderation.status_messages.member_online_message.messages", defStatusMessages.member_online_message);
	}
	if (defStatusMessages.member_offline_message !== undefined) {
		serverConfigQueryDocument.set("moderation.status_messages.member_offline_message.messages", defStatusMessages.member_offline_message);
	}
	if (defStatusMessages.member_removed_message !== undefined) {
		serverConfigQueryDocument.set("moderation.status_messages.member_removed_message.messages", defStatusMessages.member_removed_message);
	}
	if (defStatusMessages.member_banned_message !== undefined) {
		serverConfigQueryDocument.set("moderation.status_messages.member_banned_message.messages", defStatusMessages.member_banned_message);
	}
	if (defStatusMessages.member_unbanned_message !== undefined) {
		serverConfigQueryDocument.set("moderation.status_messages.member_unbanned_message.messages", defStatusMessages.member_unbanned_message);
	}

	// Default tag reactions (only set if values exist)
	if (defTagReactions && defTagReactions.length > 0) {
		serverConfigQueryDocument.set("tag_reaction.messages", defTagReactions);
	}

	// Set default tier from site settings (overriding schema default "free" if needed)
	try {
		const defaultTier = await TierManager.getDefaultTier();
		if (defaultTier && defaultTier._id) {
			serverDocument.query.set("subscription.tier_id", defaultTier._id);
		}
	} catch (err) {
		logger.warn("Failed to set default tier for new server", { svrid: server.id }, err);
	}

	// Apply server template if specified
	if (templateId && ServerTemplates.isValidTemplate(templateId)) {
		await ServerTemplates.applyTemplate(serverDocument, templateId, client);
		logger.info("Applied server template during setup", { svrid: server.id, templateId });
	}

	// Disabled: Don't send startup message to server owners/moderators
	// const guildCount = await Utils.GetValue(client, "guilds.size", "int");
	// await client.messageBotAdmins(server, serverDocument, {
	// 	embeds: [{
	// 		color: 0x43B581,
	// 		title: `Hello! ${client.user.tag} (that's me) has been added to "${server}", a server you moderate!`,
	// 		description: `Use \`${client.getCommandPrefix(server, serverDocument)}help\` to learn more, or check out https://skynetbot.com/ 🙂 🎉`,
	// 		footer: {
	// 			text: `${guildCount % 1000 === 0 ? `*Wow, you're server #${guildCount} for me!* 🎉` : ""}`,
	// 		},
	// 	}],
	// });

	return serverDocument;
};
