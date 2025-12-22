declare namespace _exports {
    export { GetGuildSettings };
}
declare namespace _exports {
    export { GetGuild };
    export { messageHandler as handler };
}
export = _exports;
/**
 * A settings object that determines the parsing method for the getGuild handler
 */
type GetGuildSettings = {
    /**
     * - Indicates if the handler should ONLY parse data requested in the settings object
     */
    strict?: boolean;
    /**
     * - A list of all the values that the handler should manually parse, if this property is a string and strict is enabled, the handler will parse only this value
     */
    resolve?: (any[] | string);
    /**
     * - A list of member ID's indicating the parser what members should be fully parsed using the toJSON method, rather than the default (ID)
     */
    fullResolveMembers?: (any[] | string);
    /**
     * - A list of map names indicating the parser what collections should be fully parsed using the toJSON method, rather than using the default (list of ID's)
     */
    fullResolveMaps?: any[];
    /**
     * - A user ID that must be present in the guild's member collection before parsing
     */
    mutualOnlyTo?: string;
    /**
     * - A search query to filter through all guilds before parsing
     */
    findFilter?: string;
    /**
     * - If set to "noKeys", multiple results will be parsed in an array rather than an object
     */
    parse?: string;
};
declare class GetGuild {
    static getAll(client: any, settings: any): any;
    constructor(client: any, target: any);
    client: any;
    target: any;
    _fetchedCollections: any[];
    _send(settings: any): any;
    initialize(members: any, mutualOnlyTo: any): Promise<this>;
    success: boolean;
    fetchProperty(properties: any): Promise<this>;
    reSync(): Promise<this>;
    fetchCollection(collections: any): Promise<this>;
    fetchMember(members: any, isQuery: any): Promise<any>;
}
/**
 * A settings object that determines the parsing method for the getGuild handler
 * @typedef {Object} GetGuildSettings
 * @property {boolean} [strict] - Indicates if the handler should ONLY parse data requested in the settings object
 * @property {(array|string)} [resolve] - A list of all the values that the handler should manually parse, if this property is a string and strict is enabled, the handler will parse only this value
 * @property {(array|string)} [fullResolveMembers] - A list of member ID's indicating the parser what members should be fully parsed using the toJSON method, rather than the default (ID)
 * @property {array} [fullResolveMaps] - A list of map names indicating the parser what collections should be fully parsed using the toJSON method, rather than using the default (list of ID's)
 * @property {string} [mutualOnlyTo] - A user ID that must be present in the guild's member collection before parsing
 * @property {string} [findFilter] - A search query to filter through all guilds before parsing
 * @property {string} [parse] - If set to "noKeys", multiple results will be parsed in an array rather than an object
 */
/**
 * Handler for incoming getGuild messages
 * @param guild {Discord.Guild} The guild whose data is being fetched
 * @param settings {GetGuildSettings} Settings to parse the guild data
 * @param respond {function} Callback function to be called with the payload for a getGuild return message
 * @returns {*}
 */
declare function messageHandler(guild: Discord.Guild, settings: GetGuildSettings, respond: Function): any;
//# sourceMappingURL=GetGuild.d.ts.map