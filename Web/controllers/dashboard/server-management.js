const TierManager = require("../../../Modules/TierManager");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const Logger = require("../../../Internals/Logger");
const logger = new Logger("ServerManagement");

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
		const guild = req.app.client.guilds.cache.get(req.svr.id);
		if (!guild) {
			return req.app.Helpers.renderError(res, "Server not found", "The bot is not in this server.");
		}

		const channels = guild.channels.cache
			.filter(c => c.type !== ChannelType.DM && c.type !== ChannelType.GroupDM)
			.sort((a, b) => a.rawPosition - b.rawPosition)
			.map(channel => ({
				id: channel.id,
				name: channel.name,
				type: channel.type,
				parentId: channel.parentId,
				position: channel.rawPosition,
				topic: channel.topic || null,
				nsfw: channel.nsfw || false,
				bitrate: channel.bitrate || null,
				userLimit: channel.userLimit || null,
				rateLimitPerUser: channel.rateLimitPerUser || null,
				permissionOverwrites: channel.permissionOverwrites?.cache.map(overwrite => ({
					id: overwrite.id,
					type: overwrite.type,
					allow: overwrite.allow.bitfield.toString(),
					deny: overwrite.deny.bitfield.toString(),
				})) || [],
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
		const guild = req.app.client.guilds.cache.get(req.svr.id);
		if (!guild) {
			return req.app.Helpers.renderError(res, "Server not found", "The bot is not in this server.");
		}

		const roles = guild.roles.cache
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
				permissions: role.permissions.bitfield.toString(),
				permissionsList: Object.entries(PermissionFlagsBits)
					.filter(([, value]) => (role.permissions.bitfield & value) === value)
					.map(([name]) => name),
			}));

		res.setPageData({
			page: "admin-server-roles.ejs",
			roles,
			permissions: PermissionFlagsBits,
		});
		res.render();
	} catch (err) {
		logger.error("Error loading roles page", {}, err);
		return req.app.Helpers.renderError(res, "Error", "Failed to load role management.");
	}
};
