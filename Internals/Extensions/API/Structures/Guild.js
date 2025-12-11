const { Scopes } = require("../../../Constants");
const ScopeManager = require("../Utils/ScopeManager");
// Utils imported for potential future use
const privProps = new WeakMap();

/**
 * Represents a Discord Guild in the Extension API.
 * @memberof API
 */
class Guild {
	/**
	 * @param {Object} API - The API namespace
	 * @param {ExtensionManager} client - The extension manager client
	 * @param {Discord.Guild} guild - The Discord.js guild object
	 * @param {Array<String>} scopes - The extension's scopes
	 */
	constructor (API, client, guild, scopes) {
		privProps.set(this, { API, client, guild, scopes });

		/**
		 * The guild's unique snowflake ID.
		 * @type {String}
		 */
		this.id = guild.id;

		/**
		 * The guild's name.
		 * @type {String}
		 */
		this.name = guild.name;

		/**
		 * The guild's icon hash.
		 * @type {?String}
		 */
		this.icon = guild.icon;

		/**
		 * The guild's banner hash.
		 * @type {?String}
		 */
		this.banner = guild.banner;

		/**
		 * The guild's splash hash.
		 * @type {?String}
		 */
		this.splash = guild.splash;

		/**
		 * The guild's description.
		 * @type {?String}
		 */
		this.description = guild.description;

		/**
		 * The guild owner's user ID.
		 * @type {String}
		 */
		this.ownerId = guild.ownerId;

		/**
		 * The total number of members in this guild.
		 * @type {Number}
		 */
		this.memberCount = guild.memberCount;

		/**
		 * The number of boosts this guild has.
		 * @type {Number}
		 */
		this.premiumSubscriptionCount = guild.premiumSubscriptionCount || 0;

		/**
		 * The premium tier of this guild (0-3).
		 * @type {Number}
		 */
		this.premiumTier = guild.premiumTier;

		/**
		 * The guild's verification level.
		 * @type {Number}
		 */
		this.verificationLevel = guild.verificationLevel;

		/**
		 * Whether the guild is verified.
		 * @type {Boolean}
		 */
		this.verified = guild.verified || false;

		/**
		 * Whether the guild is partnered.
		 * @type {Boolean}
		 */
		this.partnered = guild.partnered || false;

		/**
		 * Whether the guild is available.
		 * @type {Boolean}
		 */
		this.available = guild.available;

		/**
		 * A UNIX timestamp of when the guild was created.
		 * @type {Number}
		 */
		this.createdTimestamp = guild.createdTimestamp;

		/**
		 * The guild's preferred locale.
		 * @type {String}
		 */
		this.preferredLocale = guild.preferredLocale;

		/**
		 * The maximum number of members this guild can have.
		 * @type {?Number}
		 */
		this.maximumMembers = guild.maximumMembers;

		/**
		 * The vanity URL code for the guild.
		 * @type {?String}
		 */
		this.vanityURLCode = guild.vanityURLCode;

		/**
		 * The AFK channel ID.
		 * @type {?String}
		 */
		this.afkChannelId = guild.afkChannelId;

		/**
		 * The AFK timeout in seconds.
		 * @type {?Number}
		 */
		this.afkTimeout = guild.afkTimeout;

		/**
		 * The system channel ID.
		 * @type {?String}
		 */
		this.systemChannelId = guild.systemChannelId;

		/**
		 * The rules channel ID.
		 * @type {?String}
		 */
		this.rulesChannelId = guild.rulesChannelId;

		/**
		 * The public updates channel ID.
		 * @type {?String}
		 */
		this.publicUpdatesChannelId = guild.publicUpdatesChannelId;
	}

	/**
	 * The Date the guild was created.
	 * @type {Date}
	 * @readonly
	 */
	get createdAt () {
		return new Date(this.createdTimestamp);
	}

	/**
	 * The URL to the guild's icon.
	 * @param {Object} [options] - Options for the icon URL
	 * @returns {?String}
	 */
	iconURL (options = {}) {
		const guild = privProps.get(this).guild;
		if (!guild.icon) return null;
		return guild.iconURL({
			format: options.format || "webp",
			size: options.size || 128,
		});
	}

	/**
	 * The URL to the guild's banner.
	 * @param {Object} [options] - Options for the banner URL
	 * @returns {?String}
	 */
	bannerURL (options = {}) {
		const guild = privProps.get(this).guild;
		if (!guild.banner) return null;
		return guild.bannerURL({
			format: options.format || "webp",
			size: options.size || 512,
		});
	}

	/**
	 * The URL to the guild's splash.
	 * @param {Object} [options] - Options for the splash URL
	 * @returns {?String}
	 */
	splashURL (options = {}) {
		const guild = privProps.get(this).guild;
		if (!guild.splash) return null;
		return guild.splashURL({
			format: options.format || "webp",
			size: options.size || 512,
		});
	}

	/**
	 * Fetch a member by ID.
	 * @param {String} userId - The user ID to fetch
	 * @returns {Promise<?API.Member>}
	 * @scope members_read
	 */
	async fetchMember (userId) {
		const { API, client, guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.members_read.scope);
		try {
			const member = await guild.members.fetch(userId);
			return new API.Member(API, client, member, scopes);
		} catch {
			return null;
		}
	}

	/**
	 * Get the number of roles in this guild.
	 * @type {Number}
	 * @readonly
	 * @scope roles_read
	 */
	get roleCount () {
		const { guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.roles_read.scope);
		return guild.roles.cache.size;
	}

	/**
	 * Get a list of role info objects.
	 * @returns {Array<Object>}
	 * @scope roles_read
	 */
	getRoles () {
		const { guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.roles_read.scope);
		return guild.roles.cache.map(role => ({
			id: role.id,
			name: role.name,
			color: role.color,
			position: role.position,
			mentionable: role.mentionable,
			managed: role.managed,
			permissions: role.permissions.bitfield.toString(),
		}));
	}

	/**
	 * Get a role by ID.
	 * @param {String} roleId - The role ID
	 * @returns {?Object}
	 * @scope roles_read
	 */
	getRole (roleId) {
		const { guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.roles_read.scope);
		const role = guild.roles.cache.get(roleId);
		if (!role) return null;
		return {
			id: role.id,
			name: role.name,
			color: role.color,
			position: role.position,
			mentionable: role.mentionable,
			managed: role.managed,
			permissions: role.permissions.bitfield.toString(),
		};
	}

	/**
	 * Get the number of channels in this guild.
	 * @type {Number}
	 * @readonly
	 * @scope channels_read
	 */
	get channelCount () {
		const { guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.channels_read.scope);
		return guild.channels.cache.size;
	}

	/**
	 * Get a list of channel info objects.
	 * @returns {Array<Object>}
	 * @scope channels_read
	 */
	getChannels () {
		const { guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.channels_read.scope);
		return guild.channels.cache.map(channel => ({
			id: channel.id,
			name: channel.name,
			type: channel.type,
			position: channel.position,
			parentId: channel.parentId,
		}));
	}

	/**
	 * Get a channel by ID.
	 * @param {String} channelId - The channel ID
	 * @returns {?API.Channel}
	 * @scope channels_read
	 */
	getChannel (channelId) {
		const { API, client, guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.channels_read.scope);
		const channel = guild.channels.cache.get(channelId);
		if (!channel) return null;
		return new API.Channel(API, client, channel, scopes);
	}

	/**
	 * Get a list of emoji info objects.
	 * @returns {Array<Object>}
	 * @scope guild_read
	 */
	getEmojis () {
		const { guild, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.guild_read.scope);
		return guild.emojis.cache.map(emoji => ({
			id: emoji.id,
			name: emoji.name,
			animated: emoji.animated,
			available: emoji.available,
			url: emoji.url,
		}));
	}

	/**
	 * Convert to a plain object for serialization.
	 * @returns {Object}
	 */
	toJSON () {
		return {
			id: this.id,
			name: this.name,
			icon: this.icon,
			ownerId: this.ownerId,
			memberCount: this.memberCount,
			premiumTier: this.premiumTier,
			premiumSubscriptionCount: this.premiumSubscriptionCount,
			verificationLevel: this.verificationLevel,
			createdTimestamp: this.createdTimestamp,
		};
	}
}

module.exports = Guild;
