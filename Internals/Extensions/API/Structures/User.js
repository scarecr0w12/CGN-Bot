const privProps = new WeakMap();

/**
 * Represents a Discord User in the Extension API.
 * @memberof API
 */
class User {
	/**
	 * @param {Object} API - The API namespace
	 * @param {ExtensionManager} client - The extension manager client
	 * @param {Discord.User} user - The Discord.js user object
	 * @param {Array<String>} scopes - The extension's scopes
	 */
	constructor (API, client, user, scopes) {
		privProps.set(this, { API, client, user, scopes });

		/**
		 * The user's unique snowflake ID.
		 * @type {String}
		 */
		this.id = user.id;

		/**
		 * The user's username.
		 * @type {String}
		 */
		this.username = user.username;

		/**
		 * The user's display name (global name).
		 * @type {?String}
		 */
		this.displayName = user.displayName || user.globalName || null;

		/**
		 * The user's discriminator (legacy, usually "0" now).
		 * @type {String}
		 */
		this.discriminator = user.discriminator;

		/**
		 * The user's tag (username#discriminator or just username).
		 * @type {String}
		 */
		this.tag = user.tag;

		/**
		 * Whether the user is a bot.
		 * @type {Boolean}
		 */
		this.bot = user.bot;

		/**
		 * Whether the user is the system user.
		 * @type {Boolean}
		 */
		this.system = user.system || false;

		/**
		 * The user's avatar hash.
		 * @type {?String}
		 */
		this.avatar = user.avatar;

		/**
		 * The user's banner hash.
		 * @type {?String}
		 */
		this.banner = user.banner || null;

		/**
		 * The user's accent color.
		 * @type {?Number}
		 */
		this.accentColor = user.accentColor || null;

		/**
		 * A UNIX timestamp of when the user's account was created.
		 * @type {Number}
		 */
		this.createdTimestamp = user.createdTimestamp;
	}

	/**
	 * The Date the user's account was created.
	 * @type {Date}
	 * @readonly
	 */
	get createdAt () {
		return new Date(this.createdTimestamp);
	}

	/**
	 * The URL to the user's avatar.
	 * @param {Object} [options] - Options for the avatar URL
	 * @param {String} [options.format='webp'] - The format of the image
	 * @param {Number} [options.size=128] - The size of the image
	 * @returns {String}
	 */
	avatarURL (options = {}) {
		const user = privProps.get(this).user;
		return user.displayAvatarURL({
			format: options.format || "webp",
			size: options.size || 128,
		});
	}

	/**
	 * The URL to the user's default avatar.
	 * @returns {String}
	 */
	defaultAvatarURL () {
		return privProps.get(this).user.defaultAvatarURL;
	}

	/**
	 * The URL to the user's banner.
	 * @param {Object} [options] - Options for the banner URL
	 * @returns {?String}
	 */
	bannerURL (options = {}) {
		const user = privProps.get(this).user;
		if (!user.banner) return null;
		return user.bannerURL({
			format: options.format || "webp",
			size: options.size || 512,
		});
	}

	/**
	 * Get a string representation of the user.
	 * @returns {String}
	 */
	toString () {
		return `<@${this.id}>`;
	}

	/**
	 * Convert to a plain object for serialization.
	 * @returns {Object}
	 */
	toJSON () {
		return {
			id: this.id,
			username: this.username,
			displayName: this.displayName,
			discriminator: this.discriminator,
			tag: this.tag,
			bot: this.bot,
			avatar: this.avatar,
			createdTimestamp: this.createdTimestamp,
		};
	}
}

module.exports = User;
