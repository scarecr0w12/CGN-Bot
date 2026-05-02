const TierManager = require("../../../Modules/TierManager");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const Logger = require("../../../Internals/Logger");
const logger = new Logger("ServerManagement");

 const getCollectionValues = collection => {
	if (!collection) return [];
	if (collection.cache) return [...collection.cache.values()];
	if (Array.isArray(collection)) return collection;
	if (typeof collection === "object") return Object.values(collection);
	return [];
 };

 const getBotName = req => req.svr.members?.[req.app.client.user.id]?.nickname || req.app.client.user.username;

 const toBigInt = value => {
	if (typeof value === "bigint") return value;
	if (typeof value === "number") return BigInt(value);
	if (typeof value === "string" && value) return BigInt(value);
	return 0n;
 };

/**
 * Server Management Controller (Tier 2)
 * Allows server owners to manage channels, categories, roles, and permissions
 */

module.exports.channels = async (req, { res }) => {
	const canAccess = await TierManager.canAccess(req.svr.id, "server_management");
	if (!canAccess) {
		return res.redirect(`/dashboard/${req.svr.id}/subscription?feature=server_management`);
	}

	try {
		await req.svr.fetchCollection("channels");

		const channels = getCollectionValues(req.svr.channels)
			.filter(c => c.type !== ChannelType.DM && c.type !== ChannelType.GroupDM)
			.sort((a, b) => (a.rawPosition || a.position || 0) - (b.rawPosition || b.position || 0))
			.map(channel => ({
				id: channel.id,
				name: channel.name,
				type: channel.type,
				parentId: channel.parentId,
				position: channel.rawPosition || channel.position || 0,
				topic: channel.topic || null,
				nsfw: channel.nsfw || false,
				bitrate: channel.bitrate || null,
				userLimit: channel.userLimit || null,
				rateLimitPerUser: channel.rateLimitPerUser || null,
				permissionOverwrites: getCollectionValues(channel.permissionOverwrites)
					.map(overwrite => ({
					id: overwrite.id,
					type: overwrite.type,
					allow: overwrite.allow?.bitfield?.toString?.() || overwrite.allow?.toString?.() || "0",
					deny: overwrite.deny?.bitfield?.toString?.() || overwrite.deny?.toString?.() || "0",
					})),
			}));

		const categories = channels.filter(c => c.type === ChannelType.GuildCategory);
		const textChannels = channels.filter(c => c.type === ChannelType.GuildText);
		const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice);
		const stageChannels = channels.filter(c => c.type === ChannelType.GuildStageVoice);
		const forumChannels = channels.filter(c => c.type === ChannelType.GuildForum);
		const announcementChannels = channels.filter(c => c.type === ChannelType.GuildAnnouncement);

		res.setPageData({
			page: "admin-server-channels.ejs",
			categories,
			textChannels,
			voiceChannels,
			stageChannels,
			forumChannels,
			announcementChannels,
			channelTypes: ChannelType,
			botName: getBotName(req),
		});
		res.render();
	} catch (err) {
		logger.error("Error loading channels page", {}, err);
		return req.app.Helpers.renderError(res, "Error", "Failed to load channel management.");
	}
};

module.exports.roles = async (req, { res }) => {
	const canAccess = await TierManager.canAccess(req.svr.id, "server_management");
	if (!canAccess) {
		return res.redirect(`/dashboard/${req.svr.id}/subscription?feature=server_management`);
	}

	try {
		await req.svr.fetchCollection("roles");

		const roles = getCollectionValues(req.svr.roles)
			.sort((a, b) => b.position - a.position)
			.map(role => ({
				id: role.id,
				name: role.name,
				color: role.color,
				hexColor: role.hexColor,
				position: role.position,
				hoist: role.hoist,
				mentionable: role.mentionable,
				managed: role.managed,
				permissions: toBigInt(role.permissions?.bitfield ?? role.permissions).toString(),
				permissionsList: Object.entries(PermissionFlagsBits)
					.filter(([, value]) => {
						const bitfield = toBigInt(role.permissions?.bitfield ?? role.permissions);
						return (bitfield & value) === value;
					})
					.map(([name]) => name),
			}));

		res.setPageData({
			page: "admin-server-roles.ejs",
			roles,
			permissions: PermissionFlagsBits,
			botName: getBotName(req),
		});
		res.render();
	} catch (err) {
		logger.error("Error loading roles page", {}, err);
		return req.app.Helpers.renderError(res, "Error", "Failed to load role management.");
	}
};
