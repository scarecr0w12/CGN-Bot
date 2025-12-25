export = Message;
/**
 * Represents a message on Discord.
 * @memberof API
 */
declare class Message {
    constructor(API: any, client: any, msg: any, scopes: any, isRoot: any);
    /**
     * A collection of attachments in this message.
     * @type {Collection<API.Message>}
     */
    attachments: Collection<API.Message>;
    /**
     * The author of this message.
     * @type {API.User}
     */
    author: API.User;
    /**
     * This message's raw content.
     * @type {String}
     */
    content: string;
    /**
     * A UNIX Timestamp of the creation of this message.
     * @type {Number}
     */
    createdTimestamp: number;
    /**
     * A UNIX Timestamp of the latest edit of this message.
     * @type {Number}
     */
    editedTimestamp: number;
    /**
     * An array of embeds this message has.
     * @type {Array<API.Embed>}
     */
    embeds: Array<API.Embed>;
    /**
     * The guild in which this message was sent.
     * @type {API.Guild}
     */
    guild: API.Guild;
    /**
     * The unique snowflake ID of this message.
     * @type {String}
     */
    id: string;
    /**
     * The author of this message their member object for this Guild.
     * @type {?API.Member}
     */
    member: API.Member | null;
    /**
     * Whether or not this message is pinned.
     * @type {Boolean}
     */
    pinned: boolean;
    /**
     * Whether or not this message was sent by Discord.
     * @type {Boolean}
     */
    system: boolean;
    /**
     * Whether or not this message was a TTS message.
     * @type {Boolean}
     */
    tts: boolean;
    /**
     * The type of this message.
     * @type {String}
     */
    type: string;
    /**
     * A URL to jump to this message in Discord.
     * @type {String}
     */
    url: string;
    /**
     * ID of the webhook that sent this message.
     * @type {?String}
     */
    webhookID: string | null;
    /**
     * The Date this message was created.
     * @type {?Date}
     * @readonly
     */
    readonly get createdAt(): Date | null;
    /**
     * Deletes this message.
     * @param {String} reason - Reason for deleting this message, to be shown in Audit Logs.
     * @returns {Promise<API.Message>}
     * @scope messages_manage
     */
    delete(reason: string): Promise<API.Message>;
    /**
     * Edits this message.
     * @param {String|Object} content - The new content or embed for this message
     * @param {Object} [embed] - The new embed for this message
     * @returns {Promise<API.Message>}
     * @scope messages_write
     */
    edit(content: string | any, embed?: any): Promise<API.Message>;
    /**
     * Whether the extension can pin this message.
     * @type {Boolean}
     * @readonly
     */
    readonly get pinnable(): boolean;
    /**
     * Pins this message.
     * @returns {Promise<API.Message>}
     * @scope channels_manage
     */
    pin(): Promise<API.Message>;
    /**
     * Unpins this message.
     * @returns {Promise<API.Message>}
     * @scope channels_manage
     */
    unpin(): Promise<API.Message>;
    /**
     * Reply to this message by prefixing the author's mention to the specified message content.
     * @param {String|Object} content - The content or embed for the reply
     * @param {Object} [embed] - The embed for the reply
     * @returns {Promise<API.Message>} The reply sent
     */
    reply(content: string | any, embed?: any): Promise<API.Message>;
}
//# sourceMappingURL=Message.d.ts.map