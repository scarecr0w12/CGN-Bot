export = Member;
/**
 * Represents a Guild Member in the Extension API.
 * @memberof API
 */
declare class Member {
    /**
     * @param {Object} API - The API namespace
     * @param {ExtensionManager} client - The extension manager client
     * @param {Discord.GuildMember} member - The Discord.js member object
     * @param {Array<String>} scopes - The extension's scopes
     */
    constructor(API: any, client: ExtensionManager, member: Discord.GuildMember, scopes: Array<string>);
    /**
     * The member's unique snowflake ID.
     * @type {String}
     */
    id: string;
    /**
     * The member's nickname in this guild, or null if none.
     * @type {?String}
     */
    nickname: string | null;
    /**
     * The member's display name (nickname or username).
     * @type {String}
     */
    displayName: string;
    /**
     * The user object for this member.
     * @type {API.User}
     */
    user: API.User;
    /**
     * Whether this member is the guild owner.
     * @type {Boolean}
     */
    isOwner: boolean;
    /**
     * A UNIX timestamp of when this member joined the guild.
     * @type {?Number}
     */
    joinedTimestamp: number | null;
    /**
     * A UNIX timestamp of when this member started boosting the guild.
     * @type {?Number}
     */
    premiumSinceTimestamp: number | null;
    /**
     * Whether this member is currently timed out.
     * @type {Boolean}
     */
    isCommunicationDisabled: boolean;
    /**
     * The timestamp when this member's timeout will end.
     * @type {?Number}
     */
    communicationDisabledUntilTimestamp: number | null;
    /**
     * Whether this member is pending verification (membership screening).
     * @type {Boolean}
     */
    pending: boolean;
    /**
     * The member's avatar hash in this guild.
     * @type {?String}
     */
    avatar: string | null;
    /**
     * The Date this member joined the guild.
     * @type {?Date}
     * @readonly
     */
    readonly get joinedAt(): Date | null;
    /**
     * The Date this member started boosting.
     * @type {?Date}
     * @readonly
     */
    readonly get premiumSince(): Date | null;
    /**
     * Whether this member is kickable by the bot.
     * @type {Boolean}
     * @readonly
     */
    readonly get kickable(): boolean;
    /**
     * Whether this member is bannable by the bot.
     * @type {Boolean}
     * @readonly
     */
    readonly get bannable(): boolean;
    /**
     * Whether this member is manageable by the bot.
     * @type {Boolean}
     * @readonly
     */
    readonly get manageable(): boolean;
    /**
     * The URL to the member's guild avatar.
     * @param {Object} [options] - Options for the avatar URL
     * @returns {String}
     */
    avatarURL(options?: any): string;
    /**
     * Check if the member has a specific role.
     * @param {String} roleId - The role ID to check
     * @returns {Boolean}
     * @scope roles_read
     */
    hasRole(roleId: string): boolean;
    /**
     * Add a role to this member.
     * @param {String} roleId - The role ID to add
     * @param {String} [reason] - Reason for adding the role
     * @returns {Promise<Member>}
     * @scope roles_manage
     */
    addRole(roleId: string, reason?: string): Promise<Member>;
    /**
     * Remove a role from this member.
     * @param {String} roleId - The role ID to remove
     * @param {String} [reason] - Reason for removing the role
     * @returns {Promise<Member>}
     * @scope roles_manage
     */
    removeRole(roleId: string, reason?: string): Promise<Member>;
    /**
     * Set the member's nickname.
     * @param {?String} nickname - The new nickname, or null to remove
     * @param {String} [reason] - Reason for the nickname change
     * @returns {Promise<Member>}
     * @scope members_manage
     */
    setNickname(nickname: string | null, reason?: string): Promise<Member>;
    /**
     * Kick this member from the guild.
     * @param {String} [reason] - Reason for the kick
     * @returns {Promise<Member>}
     * @scope kick
     */
    kick(reason?: string): Promise<Member>;
    /**
     * Ban this member from the guild.
     * @param {Object} [options] - Ban options
     * @param {String} [options.reason] - Reason for the ban
     * @param {Number} [options.deleteMessageDays] - Days of messages to delete (0-7)
     * @returns {Promise<Member>}
     * @scope ban
     */
    ban(options?: {
        reason?: string;
        deleteMessageDays?: number;
    }): Promise<Member>;
    /**
     * Timeout this member.
     * @param {Number} duration - Timeout duration in milliseconds
     * @param {String} [reason] - Reason for the timeout
     * @returns {Promise<Member>}
     * @scope members_manage
     */
    timeout(duration: number, reason?: string): Promise<Member>;
    /**
     * Get a string representation (mention) of the member.
     * @returns {String}
     */
    toString(): string;
    /**
     * Convert to a plain object for serialization.
     * @returns {Object}
     */
    toJSON(): any;
}
//# sourceMappingURL=Member.d.ts.map