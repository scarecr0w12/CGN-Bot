export = Channel;
/**
 * Represents a Discord Channel in the Extension API.
 * @memberof API
 */
declare class Channel {
    /**
     * @param {Object} API - The API namespace
     * @param {ExtensionManager} client - The extension manager client
     * @param {Discord.Channel} channel - The Discord.js channel object
     * @param {Array<String>} scopes - The extension's scopes
     */
    constructor(API: any, client: ExtensionManager, channel: Discord.Channel, scopes: Array<string>);
    /**
     * The channel's unique snowflake ID.
     * @type {String}
     */
    id: string;
    /**
     * The channel's name.
     * @type {String}
     */
    name: string;
    /**
     * The channel's type.
     * @type {Number}
     */
    type: number;
    /**
     * The channel's topic/description.
     * @type {?String}
     */
    topic: string | null;
    /**
     * Whether the channel is NSFW.
     * @type {Boolean}
     */
    nsfw: boolean;
    /**
     * The channel's position in the channel list.
     * @type {Number}
     */
    position: number;
    /**
     * The parent category ID.
     * @type {?String}
     */
    parentId: string | null;
    /**
     * The slowmode rate limit in seconds.
     * @type {Number}
     */
    rateLimitPerUser: number;
    /**
     * A UNIX Timestamp of the creation of this channel.
     * @type {Number}
     */
    createdTimestamp: number;
    /**
     * The last message ID in this channel.
     * @type {?String}
     */
    lastMessageId: string | null;
    /**
     * The guild ID this channel belongs to.
     * @type {?String}
     */
    guildId: string | null;
    /**
     * The Date this channel was created.
     * @type {?Date}
     * @readonly
     */
    readonly get createdAt(): Date | null;
    /**
     * Whether the extension can delete this channel.
     * @type {Boolean}
     * @readonly
     */
    readonly get deletable(): boolean;
    /**
     * Whether this is a text-based channel.
     * @type {Boolean}
     * @readonly
     */
    readonly get isTextBased(): boolean;
    /**
     * Whether this is a voice-based channel.
     * @type {Boolean}
     * @readonly
     */
    readonly get isVoiceBased(): boolean;
    /**
     * Whether this is a thread channel.
     * @type {Boolean}
     * @readonly
     */
    readonly get isThread(): boolean;
    /**
     * Send a message to this channel.
     * @param {String|Object} content - The message content or embed
     * @param {Object} [embed] - The embed object
     * @returns {Promise<API.Message>}
     * @scope messages_write
     */
    send(content: string | any, embed?: any): Promise<API.Message>;
    /**
     * Fetch messages from this channel.
     * @param {Object} [options] - Fetch options
     * @param {Number} [options.limit=50] - Number of messages to fetch (max 100)
     * @param {String} [options.before] - Message ID to fetch before
     * @param {String} [options.after] - Message ID to fetch after
     * @returns {Promise<Array<API.Message>>}
     * @scope messages_read
     */
    fetchMessages(options?: {
        limit?: number;
        before?: string;
        after?: string;
    }): Promise<Array<API.Message>>;
    /**
     * Fetch a specific message by ID.
     * @param {String} messageId - The message ID to fetch
     * @returns {Promise<?API.Message>}
     * @scope messages_read
     */
    fetchMessage(messageId: string): Promise<API.Message | null>;
    /**
     * Bulk delete messages from this channel.
     * @param {Number|Array<String>} messages - Number of messages to delete or array of message IDs
     * @param {String} [reason] - Reason for deletion
     * @returns {Promise<Number>} Number of messages deleted
     * @scope messages_manage
     */
    bulkDelete(messages: number | Array<string>, _reason: any): Promise<number>;
    /**
     * Set the channel's slowmode.
     * @param {Number} seconds - Slowmode in seconds (0 to disable)
     * @param {String} [reason] - Reason for the change
     * @returns {Promise<Channel>}
     * @scope channels_manage
     */
    setSlowmode(seconds: number, reason?: string): Promise<Channel>;
    /**
     * Set the channel's topic.
     * @param {String} topic - The new topic
     * @param {String} [reason] - Reason for the change
     * @returns {Promise<Channel>}
     * @scope channels_manage
     */
    setTopic(topic: string, reason?: string): Promise<Channel>;
    /**
     * Set the channel's NSFW status.
     * @param {Boolean} nsfw - Whether the channel should be NSFW
     * @param {String} [reason] - Reason for the change
     * @returns {Promise<Channel>}
     * @scope channels_manage
     */
    setNSFW(nsfw: boolean, reason?: string): Promise<Channel>;
    /**
     * Get a string representation (mention) of the channel.
     * @returns {String}
     */
    toString(): string;
    /**
     * Convert to a plain object for serialization.
     * @returns {Object}
     */
    toJSON(): any;
}
//# sourceMappingURL=Channel.d.ts.map