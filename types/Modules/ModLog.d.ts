export = ModLog;
declare class ModLog {
    /**
     * Format a User for use in a ModLog entry's message
     * @param {User} user
     * @returns {string}
     */
    static getUserText(user: User): string;
    /**
     * Get a ModLog Entry's message
     * @param {number} modlogID
     * @param {string} type
     * @param {string} affectedUserString
     * @param {string} creatorString
     * @param {string} reason
     * @returns {string}
     */
    static getEntryText(modlogID: number, type: string, affectedUserString?: string, creatorString?: string, reason?: string): string;
    static create(guild: any, type: any, member: any, creator: any, reason?: any): Promise<any>;
    /**
     * Update an existing ModLog Entry
     * @param {Guild} guild
     * @param {number} id
     * @param {ModLogEntryData} data
     * @returns {Promise<number|SkynetError>} The numeric ID of the ModLog Entry updated, or an error if an expected exception occurred
     */
    static update(guild: Guild, id: number, data: ModLogEntryData): Promise<number | SkynetError>;
    static delete(guild: any, id: any): Promise<any>;
    /**
     * Enables ModLog features in a guild and channel
     * @param {SkynetGuild} guild
     * @param {Channel} channel
     * @returns {Promise<Snowflake|SkynetError|null>} The Snowflake ID of the channel modlog has been enabled in, if successful. If an expected error occurred, this will return a SkynetError object
     */
    static enable(guild: SkynetGuild, channel: Channel): Promise<Snowflake | SkynetError | null>;
    /**
     * Disables ModLog featuers in a guild
     * @param {SkynetGuild} guild
     * @returns {Promise<string|null>} The String ID of the channel modlog was enabled in, if successful.
     */
    static disable(guild: SkynetGuild): Promise<string | null>;
}
declare namespace ModLog {
    export { ModLogEntryData };
}
/**
 * An object representing the raw data of a ModLog entry
 */
type ModLogEntryData = {
    type: string;
    affected_user: SkynetGuildMember;
    creator: SkynetGuildMember;
    reason: string;
    message_id: string;
};
//# sourceMappingURL=ModLog.d.ts.map