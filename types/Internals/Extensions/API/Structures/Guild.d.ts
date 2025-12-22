export = Guild;
/**
 * Represents a Discord Guild in the Extension API.
 * @memberof API
 */
declare class Guild {
    /**
     * @param {Object} API - The API namespace
     * @param {ExtensionManager} client - The extension manager client
     * @param {Discord.Guild} guild - The Discord.js guild object
     * @param {Array<String>} scopes - The extension's scopes
     */
    constructor(API: any, client: ExtensionManager, guild: Discord.Guild, scopes: Array<string>);
    /**
     * The guild's unique snowflake ID.
     * @type {String}
     */
    id: string;
    /**
     * The guild's name.
     * @type {String}
     */
    name: string;
    /**
     * The guild's icon hash.
     * @type {?String}
     */
    icon: string | null;
    /**
     * The guild's banner hash.
     * @type {?String}
     */
    banner: string | null;
    /**
     * The guild's splash hash.
     * @type {?String}
     */
    splash: string | null;
    /**
     * The guild's description.
     * @type {?String}
     */
    description: string | null;
    /**
     * The guild owner's user ID.
     * @type {String}
     */
    ownerId: string;
    /**
     * The total number of members in this guild.
     * @type {Number}
     */
    memberCount: number;
    /**
     * The number of boosts this guild has.
     * @type {Number}
     */
    premiumSubscriptionCount: number;
    /**
     * The premium tier of this guild (0-3).
     * @type {Number}
     */
    premiumTier: number;
    /**
     * The guild's verification level.
     * @type {Number}
     */
    verificationLevel: number;
    /**
     * Whether the guild is verified.
     * @type {Boolean}
     */
    verified: boolean;
    /**
     * Whether the guild is partnered.
     * @type {Boolean}
     */
    partnered: boolean;
    /**
     * Whether the guild is available.
     * @type {Boolean}
     */
    available: boolean;
    /**
     * A UNIX timestamp of when the guild was created.
     * @type {Number}
     */
    createdTimestamp: number;
    /**
     * The guild's preferred locale.
     * @type {String}
     */
    preferredLocale: string;
    /**
     * The maximum number of members this guild can have.
     * @type {?Number}
     */
    maximumMembers: number | null;
    /**
     * The vanity URL code for the guild.
     * @type {?String}
     */
    vanityURLCode: string | null;
    /**
     * The AFK channel ID.
     * @type {?String}
     */
    afkChannelId: string | null;
    /**
     * The AFK timeout in seconds.
     * @type {?Number}
     */
    afkTimeout: number | null;
    /**
     * The system channel ID.
     * @type {?String}
     */
    systemChannelId: string | null;
    /**
     * The rules channel ID.
     * @type {?String}
     */
    rulesChannelId: string | null;
    /**
     * The public updates channel ID.
     * @type {?String}
     */
    publicUpdatesChannelId: string | null;
    /**
     * The Date the guild was created.
     * @type {Date}
     * @readonly
     */
    readonly get createdAt(): Date;
    /**
     * The URL to the guild's icon.
     * @param {Object} [options] - Options for the icon URL
     * @returns {?String}
     */
    iconURL(options?: any): string | null;
    /**
     * The URL to the guild's banner.
     * @param {Object} [options] - Options for the banner URL
     * @returns {?String}
     */
    bannerURL(options?: any): string | null;
    /**
     * The URL to the guild's splash.
     * @param {Object} [options] - Options for the splash URL
     * @returns {?String}
     */
    splashURL(options?: any): string | null;
    /**
     * Fetch a member by ID.
     * @param {String} userId - The user ID to fetch
     * @returns {Promise<?API.Member>}
     * @scope members_read
     */
    fetchMember(userId: string): Promise<API.Member | null>;
    /**
     * Get the number of roles in this guild.
     * @type {Number}
     * @readonly
     * @scope roles_read
     */
    readonly get roleCount(): number;
    /**
     * Get a list of role info objects.
     * @returns {Array<Object>}
     * @scope roles_read
     */
    getRoles(): Array<any>;
    /**
     * Get a role by ID.
     * @param {String} roleId - The role ID
     * @returns {?Object}
     * @scope roles_read
     */
    getRole(roleId: string): any | null;
    /**
     * Get the number of channels in this guild.
     * @type {Number}
     * @readonly
     * @scope channels_read
     */
    readonly get channelCount(): number;
    /**
     * Get a list of channel info objects.
     * @returns {Array<Object>}
     * @scope channels_read
     */
    getChannels(): Array<any>;
    /**
     * Get a channel by ID.
     * @param {String} channelId - The channel ID
     * @returns {?API.Channel}
     * @scope channels_read
     */
    getChannel(channelId: string): API.Channel | null;
    /**
     * Get a list of emoji info objects.
     * @returns {Array<Object>}
     * @scope guild_read
     */
    getEmojis(): Array<any>;
    /**
     * Convert to a plain object for serialization.
     * @returns {Object}
     */
    toJSON(): any;
}
//# sourceMappingURL=Guild.d.ts.map