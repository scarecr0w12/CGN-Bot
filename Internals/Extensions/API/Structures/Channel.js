const { Scopes } = require("../../../Constants");
const ScopeManager = require("../Utils/ScopeManager");
const { serializeError, parseSendMessageOptions } = require("../Utils/Utils");
const privProps = new WeakMap();

/**
 * Represents a Discord Channel in the Extension API.
 * @memberof API
 */
class Channel {
	/**
	 * @param {Object} API - The API namespace
	 * @param {ExtensionManager} client - The extension manager client
	 * @param {Discord.Channel} channel - The Discord.js channel object
	 * @param {Array<String>} scopes - The extension's scopes
	 */
	constructor (API, client, channel, scopes) {
		privProps.set(this, { API, client, channel, scopes });

		/**
		 * The channel's unique snowflake ID.
		 * @type {String}
		 */
		this.id = channel.id;

		/**
		 * The channel's name.
		 * @type {String}
		 */
		this.name = channel.name;

		/**
		 * The channel's type.
		 * @type {Number}
		 */
		this.type = channel.type;

		/**
		 * The channel's topic/description.
		 * @type {?String}
		 */
		this.topic = channel.topic || null;

		/**
		 * Whether the channel is NSFW.
		 * @type {Boolean}
		 */
		this.nsfw = channel.nsfw || false;

		/**
		 * The channel's position in the channel list.
		 * @type {Number}
		 */
		this.position = channel.position;

		/**
		 * The parent category ID.
		 * @type {?String}
		 */
		this.parentId = channel.parentId;

		/**
		 * The slowmode rate limit in seconds.
		 * @type {Number}
		 */
		this.rateLimitPerUser = channel.rateLimitPerUser || 0;

		/**
		 * A UNIX Timestamp of the creation of this channel.
		 * @type {Number}
		 */
		this.createdTimestamp = channel.createdTimestamp;

		/**
		 * The last message ID in this channel.
		 * @type {?String}
		 */
		this.lastMessageId = channel.lastMessageId;

		/**
		 * The guild ID this channel belongs to.
		 * @type {?String}
		 */
		this.guildId = channel.guild ? channel.guild.id : null;
	}

	/**
	 * The Date this channel was created.
	 * @type {?Date}
	 * @readonly
	 */
	get createdAt () {
		return this.createdTimestamp ? new Date(this.createdTimestamp) : null;
	}

	/**
	 * Whether the extension can delete this channel.
	 * @type {Boolean}
	 * @readonly
	 */
	get deletable () {
		const { channel, scopes } = privProps.get(this);
		try {
			ScopeManager.check(scopes, Scopes.channels_manage.scope);
			return channel.deletable;
		} catch {
			return false;
		}
	}

	/**
	 * Whether this is a text-based channel.
	 * @type {Boolean}
	 * @readonly
	 */
	get isTextBased () {
		return privProps.get(this).channel.isTextBased();
	}

	/**
	 * Whether this is a voice-based channel.
	 * @type {Boolean}
	 * @readonly
	 */
	get isVoiceBased () {
		return privProps.get(this).channel.isVoiceBased();
	}

	/**
	 * Whether this is a thread channel.
	 * @type {Boolean}
	 * @readonly
	 */
	get isThread () {
		return privProps.get(this).channel.isThread();
	}

	/**
	 * Send a message to this channel.
	 * @param {String|Object} content - The message content or embed
	 * @param {Object} [embed] - The embed object
	 * @returns {Promise<API.Message>}
	 * @scope messages_write
	 */
	async send (content, embed) {
		const { API, client, channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.messages_write.scope);
		const sendOptions = parseSendMessageOptions(content, embed);
		const msg = await channel.send(sendOptions).catch(serializeError);
		return new API.Message(API, client, msg, scopes);
	}

	/**
	 * Fetch messages from this channel.
	 * @param {Object} [options] - Fetch options
	 * @param {Number} [options.limit=50] - Number of messages to fetch (max 100)
	 * @param {String} [options.before] - Message ID to fetch before
	 * @param {String} [options.after] - Message ID to fetch after
	 * @returns {Promise<Array<API.Message>>}
	 * @scope messages_read
	 */
	async fetchMessages (options = {}) {
		const { API, client, channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.messages_read.scope);
		const messages = await channel.messages.fetch({
			limit: Math.min(options.limit || 50, 100),
			before: options.before,
			after: options.after,
		}).catch(serializeError);
		return messages.map(msg => new API.Message(API, client, msg, scopes));
	}

	/**
	 * Fetch a specific message by ID.
	 * @param {String} messageId - The message ID to fetch
	 * @returns {Promise<?API.Message>}
	 * @scope messages_read
	 */
	async fetchMessage (messageId) {
		const { API, client, channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.messages_read.scope);
		try {
			const msg = await channel.messages.fetch(messageId);
			return new API.Message(API, client, msg, scopes);
		} catch {
			return null;
		}
	}

	/**
	 * Bulk delete messages from this channel.
	 * @param {Number|Array<String>} messages - Number of messages to delete or array of message IDs
	 * @param {String} [reason] - Reason for deletion
	 * @returns {Promise<Number>} Number of messages deleted
	 * @scope messages_manage
	 */
	async bulkDelete (messages, _reason) {
		const { channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.messages_manage.scope);
		const deleted = await channel.bulkDelete(messages, true).catch(serializeError);
		return deleted.size;
	}

	/**
	 * Set the channel's slowmode.
	 * @param {Number} seconds - Slowmode in seconds (0 to disable)
	 * @param {String} [reason] - Reason for the change
	 * @returns {Promise<Channel>}
	 * @scope channels_manage
	 */
	async setSlowmode (seconds, reason) {
		const { channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.channels_manage.scope);
		await channel.setRateLimitPerUser(seconds, reason).catch(serializeError);
		this.rateLimitPerUser = seconds;
		return this;
	}

	/**
	 * Set the channel's topic.
	 * @param {String} topic - The new topic
	 * @param {String} [reason] - Reason for the change
	 * @returns {Promise<Channel>}
	 * @scope channels_manage
	 */
	async setTopic (topic, reason) {
		const { channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.channels_manage.scope);
		await channel.setTopic(topic, reason).catch(serializeError);
		this.topic = topic;
		return this;
	}

	/**
	 * Set the channel's NSFW status.
	 * @param {Boolean} nsfw - Whether the channel should be NSFW
	 * @param {String} [reason] - Reason for the change
	 * @returns {Promise<Channel>}
	 * @scope channels_manage
	 */
	async setNSFW (nsfw, reason) {
		const { channel, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.channels_manage.scope);
		await channel.setNSFW(nsfw, reason).catch(serializeError);
		this.nsfw = nsfw;
		return this;
	}

	/**
	 * Get a string representation (mention) of the channel.
	 * @returns {String}
	 */
	toString () {
		return `<#${this.id}>`;
	}

	/**
	 * Convert to a plain object for serialization.
	 * @returns {Object}
	 */
	toJSON () {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			topic: this.topic,
			nsfw: this.nsfw,
			position: this.position,
			parentId: this.parentId,
			rateLimitPerUser: this.rateLimitPerUser,
			createdTimestamp: this.createdTimestamp,
			guildId: this.guildId,
		};
	}
}

module.exports = Channel;
