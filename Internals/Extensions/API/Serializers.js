/**
 * Serialization Utilities Module
 * Handles serialization of Discord objects for the extension sandbox
 */

/**
 * Serialize an interaction for the isolate
 * @param {Interaction} interaction
 * @returns {Object}
 */
const serializeInteraction = (interaction) => {
	const optionsMap = {};
	try {
		const data = interaction.options && Array.isArray(interaction.options.data) ? interaction.options.data : [];
		data.forEach(opt => {
			if (!opt || !opt.name) return;
			let value = opt.value;
			if (opt.user) value = { id: opt.user.id, type: "user" };
			else if (opt.member) value = { id: opt.member.id, type: "member" };
			else if (opt.channel) value = { id: opt.channel.id, type: "channel" };
			else if (opt.role) value = { id: opt.role.id, type: "role" };
			else if (opt.attachment) value = { id: opt.attachment.id, type: "attachment", url: opt.attachment.url, name: opt.attachment.name };
			optionsMap[opt.name] = value;
		});
	} catch (_) {
		// Ignore parsing errors
	}

	return {
		id: interaction.id,
		commandName: interaction.commandName,
		guildId: interaction.guildId,
		channelId: interaction.channelId,
		user: interaction.user ? {
			id: interaction.user.id,
			username: interaction.user.username,
			tag: interaction.user.tag,
			bot: interaction.user.bot,
		} : null,
		member: interaction.member ? { id: interaction.member.id } : null,
		options: optionsMap,
	};
};

/**
 * Serialize a message for the isolate
 * @param {Message} msg
 * @returns {Object}
 */
const serializeMessage = (msg) => {
	return {
		id: msg.id,
		content: msg.content,
		author: {
			id: msg.author.id,
			username: msg.author.username,
			discriminator: msg.author.discriminator,
			tag: msg.author.tag,
			bot: msg.author.bot,
		},
		channel: {
			id: msg.channel.id,
			name: msg.channel.name,
			type: msg.channel.type,
		},
		guild: msg.guild ? {
			id: msg.guild.id,
			name: msg.guild.name,
		} : null,
		createdAt: msg.createdAt.toISOString(),
		suffix: msg.suffix || "",
	};
};

/**
 * Serialize a channel for the isolate
 * @param {Channel} channel
 * @returns {Object}
 */
const serializeChannel = (channel) => {
	return {
		id: channel.id,
		name: channel.name,
		type: channel.type,
		topic: channel.topic || null,
		nsfw: channel.nsfw || false,
	};
};

/**
 * Serialize a guild for the isolate
 * @param {Guild} guild
 * @returns {Object}
 */
const serializeGuild = (guild) => {
	return {
		id: guild.id,
		name: guild.name,
		memberCount: guild.memberCount,
		ownerId: guild.ownerId,
		icon: guild.icon,
	};
};

/**
 * Serialize bot info for the isolate
 * @param {Client} client
 * @param {Guild} guild
 * @param {Document} serverDocument
 * @returns {Object}
 */
const serializeBot = (client, guild, serverDocument) => {
	return {
		user: {
			id: client.user.id,
			username: client.user.username,
			tag: client.user.tag,
		},
		prefix: serverDocument.config.command_prefix,
	};
};

/**
 * Serialize event data for the isolate
 * @param {Object} eventData
 * @returns {Object}
 */
const serializeEvent = (eventData) => {
	// Return a safe copy of event data
	try {
		return JSON.parse(JSON.stringify(eventData));
	} catch {
		return { type: "unknown" };
	}
};

/**
 * Serialize a member for the isolate
 * @param {GuildMember} member
 * @param {Function} serializeUser - User serializer function
 * @returns {Object}
 */
const serializeMember = (member, serializeUser) => {
	return {
		id: member.id,
		nickname: member.nickname,
		displayName: member.displayName,
		joinedTimestamp: member.joinedTimestamp,
		premiumSinceTimestamp: member.premiumSinceTimestamp,
		pending: member.pending || false,
		communicationDisabledUntil: member.communicationDisabledUntilTimestamp,
		roles: Array.from(member.roles.cache.keys()),
		user: serializeUser(member.user),
		avatarURL: member.displayAvatarURL({ format: "webp", size: 128 }),
		kickable: member.kickable,
		bannable: member.bannable,
		manageable: member.manageable,
		isOwner: member.id === member.guild.ownerId,
	};
};

/**
 * Serialize a user for the isolate
 * @param {User} user
 * @returns {Object}
 */
const serializeUser = (user) => {
	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName || user.globalName || user.username,
		discriminator: user.discriminator,
		tag: user.tag,
		bot: user.bot,
		system: user.system || false,
		avatar: user.avatar,
		banner: user.banner || null,
		accentColor: user.accentColor || null,
		createdTimestamp: user.createdTimestamp,
		avatarURL: user.displayAvatarURL({ format: "webp", size: 128 }),
		defaultAvatarURL: user.defaultAvatarURL,
	};
};

/**
 * Serialize guild roles for the isolate
 * @param {Guild} guild
 * @returns {Object}
 */
const serializeRoles = (guild) => {
	const roles = {};
	guild.roles.cache.forEach(role => {
		roles[role.id] = {
			id: role.id,
			name: role.name,
			color: role.color,
			hexColor: role.hexColor,
			position: role.position,
			hoist: role.hoist,
			mentionable: role.mentionable,
			managed: role.managed,
			permissions: role.permissions.bitfield.toString(),
			members: role.members.size,
		};
	});
	return {
		list: Object.values(roles),
		byId: roles,
		count: guild.roles.cache.size,
		highest: guild.roles.highest ? {
			id: guild.roles.highest.id,
			name: guild.roles.highest.name,
		} : null,
		everyone: guild.roles.everyone ? {
			id: guild.roles.everyone.id,
			name: guild.roles.everyone.name,
		} : null,
	};
};

/**
 * Get embed builder helper functions
 * @returns {Object}
 */
const getEmbedHelper = () => {
	return {
		/**
		 * Create a new embed object
		 */
		create: (options = {}) => ({
			title: options.title || null,
			description: options.description || null,
			url: options.url || null,
			color: options.color || null,
			timestamp: options.timestamp || null,
			footer: options.footer || null,
			thumbnail: options.thumbnail || null,
			image: options.image || null,
			author: options.author || null,
			fields: options.fields || [],
		}),

		/**
		 * Color constants
		 */
		colors: {
			DEFAULT: 0x000000,
			AQUA: 0x1ABC9C,
			GREEN: 0x2ECC71,
			BLUE: 0x3498DB,
			PURPLE: 0x9B59B6,
			GOLD: 0xF1C40F,
			ORANGE: 0xE67E22,
			RED: 0xE74C3C,
			GREY: 0x95A5A6,
			NAVY: 0x34495E,
			DARK_AQUA: 0x11806A,
			DARK_GREEN: 0x1F8B4C,
			DARK_BLUE: 0x206694,
			DARK_PURPLE: 0x71368A,
			DARK_GOLD: 0xC27C0E,
			DARK_ORANGE: 0xA84300,
			DARK_RED: 0x992D22,
			DARK_GREY: 0x979C9F,
			LIGHT_GREY: 0xBCC0C0,
			DARK_NAVY: 0x2C3E50,
			BLURPLE: 0x5865F2,
			GREYPLE: 0x99AAB5,
			WHITE: 0xFFFFFF,
			SUCCESS: 0x00FF00,
			ERROR: 0xFF0000,
			WARNING: 0xFFA500,
			INFO: 0x3498DB,
		},

		/**
		 * Parse a color value
		 */
		resolveColor: color => {
			if (typeof color === "string") {
				if (color === "RANDOM") return Math.floor(Math.random() * (0xFFFFFF + 1));
				if (color.startsWith("#")) return parseInt(color.slice(1), 16);
				return parseInt(color, 16);
			}
			if (Array.isArray(color)) {
				return (color[0] * 65536) + (color[1] * 256) + color[2];
			}
			return color;
		},
	};
};

/**
 * Serialize the points module for the isolate
 * @param {Object} pointsModule - Points module instance
 * @returns {Object} Serialized points data and functions
 */
const serializePointsModule = (pointsModule) => {
	// Since we can't pass functions through isolated-vm,
	// we need to pre-compute the data and return static values
	// Write methods are exposed via global callbacks
	try {
		return {
			isEnabled: pointsModule.isEnabled,
			canWrite: pointsModule.canWrite,
			self: pointsModule.getSelf(),
			leaderboard: pointsModule.getLeaderboard(25),
			ranks: pointsModule.getRanks(),
			stats: pointsModule.getStats(),
			totalMembers: pointsModule.getTotalMembers(),
			memberIds: pointsModule.getMemberIds(250),

			// Helper functions that work on the pre-loaded data
			_leaderboardData: pointsModule.getLeaderboard(100),

			// Write method wrappers - these call the global callbacks
			// Extensions should use: economy.addPoints(userId, amount)
			addPoints: "__USE_CALLBACK__",
			removePoints: "__USE_CALLBACK__",
			transfer: "__USE_CALLBACK__",
			setPoints: "__USE_CALLBACK__",
			getUser: "__USE_CALLBACK__",
		};
	} catch (err) {
		// Return minimal data if there's an error (e.g., missing scopes)
		return {
			isEnabled: false,
			canWrite: false,
			self: null,
			leaderboard: [],
			ranks: [],
			stats: null,
			totalMembers: 0,
			memberIds: [],
			error: err.message,
			addPoints: "__USE_CALLBACK__",
			removePoints: "__USE_CALLBACK__",
			transfer: "__USE_CALLBACK__",
			setPoints: "__USE_CALLBACK__",
			getUser: "__USE_CALLBACK__",
		};
	}
};

module.exports = {
	serializeInteraction,
	serializeMessage,
	serializeChannel,
	serializeGuild,
	serializeBot,
	serializeEvent,
	serializeMember,
	serializeUser,
	serializeRoles,
	getEmbedHelper,
	serializePointsModule,
};
