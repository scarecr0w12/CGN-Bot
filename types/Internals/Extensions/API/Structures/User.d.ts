export = User;
/**
 * Represents a Discord User in the Extension API.
 * @memberof API
 */
declare class User {
    /**
     * @param {Object} API - The API namespace
     * @param {ExtensionManager} client - The extension manager client
     * @param {Discord.User} user - The Discord.js user object
     * @param {Array<String>} scopes - The extension's scopes
     */
    constructor(API: any, client: ExtensionManager, user: Discord.User, scopes: Array<string>);
    /**
     * The user's unique snowflake ID.
     * @type {String}
     */
    id: string;
    /**
     * The user's username.
     * @type {String}
     */
    username: string;
    /**
     * The user's display name (global name).
     * @type {?String}
     */
    displayName: string | null;
    /**
     * The user's discriminator (legacy, usually "0" now).
     * @type {String}
     */
    discriminator: string;
    /**
     * The user's tag (username#discriminator or just username).
     * @type {String}
     */
    tag: string;
    /**
     * Whether the user is a bot.
     * @type {Boolean}
     */
    bot: boolean;
    /**
     * Whether the user is the system user.
     * @type {Boolean}
     */
    system: boolean;
    /**
     * The user's avatar hash.
     * @type {?String}
     */
    avatar: string | null;
    /**
     * The user's banner hash.
     * @type {?String}
     */
    banner: string | null;
    /**
     * The user's accent color.
     * @type {?Number}
     */
    accentColor: number | null;
    /**
     * A UNIX timestamp of when the user's account was created.
     * @type {Number}
     */
    createdTimestamp: number;
    /**
     * The Date the user's account was created.
     * @type {Date}
     * @readonly
     */
    readonly get createdAt(): Date;
    /**
     * The URL to the user's avatar.
     * @param {Object} [options] - Options for the avatar URL
     * @param {String} [options.format='webp'] - The format of the image
     * @param {Number} [options.size=128] - The size of the image
     * @returns {String}
     */
    avatarURL(options?: {
        format?: string;
        size?: number;
    }): string;
    /**
     * The URL to the user's default avatar.
     * @returns {String}
     */
    defaultAvatarURL(): string;
    /**
     * The URL to the user's banner.
     * @param {Object} [options] - Options for the banner URL
     * @returns {?String}
     */
    bannerURL(options?: any): string | null;
    /**
     * Get a string representation of the user.
     * @returns {String}
     */
    toString(): string;
    /**
     * Convert to a plain object for serialization.
     * @returns {Object}
     */
    toJSON(): any;
}
//# sourceMappingURL=User.d.ts.map