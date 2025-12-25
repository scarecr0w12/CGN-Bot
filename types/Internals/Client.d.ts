export = SkynetClient;
declare class SkynetClient extends DJSClient<boolean> {
    constructor(options: any);
    isReady: boolean;
    debugMode: any;
    officialMode: boolean;
    MOTDTimers: Collection<any, any>;
    _timeouts: Set<any>;
    _intervals: Set<any>;
    shardID: string;
    messageListeners: {};
    workerManager: import("./WorkerManager.js");
    IPC: ProcessAsPromised;
    shard: import("./ShardUtil.js");
    conversionHandler: import("../Modules/ConversionHandler.js");
    extendables: Collection<any, any>;
    /**
     * Initializes all extendables
     * @private
     */
    private initExtendables;
    /**
     * Gets the command prefix for a server
     * @param {Discord.Guild} server The guild to search for
     * @param {Document} serverDocument The database server document for the server
     * @returns {Promise<?String>} The prefix of the server
     */
    getCommandPrefix(server: Discord.Guild, serverDocument: Document): Promise<string | null>;
    /**
     * Special await message for PM interaction.
     * @param {Discord.TextChannel} channel The channel to await a message in
     * @param {Discord.User} user The user to await the message from
     * @param {Number} [timeout=60000] The timeout for this await
     * @param {Function} [filter] The filter to run on the message
     */
    awaitPMMessage(channel: Discord.TextChannel, user: Discord.User, timeout?: number, filter?: Function): Promise<any>;
    deleteAwaitPMMessage(channel: any, user: any): void;
    /**
     * Checks if message contains a command tag, returning the command and suffix
     * @param {Discord.Message} message The message object from Discord
     * @param {Document} serverDocument The database server document for the server assigned with the message
     * @returns {Promise<?Object>} Object containing the command and the suffix (if present)
     */
    checkCommandTag(message: Discord.Message, serverDocument: Document): Promise<any | null>;
    /**
     * Gets the name of a user on a server in accordance with config
     * @param {Document} serverDocument The database server document
     * @param {Discord.GuildMember} member The guild member to get the name from
     * @param {Boolean} [ignoreNick=false] If it should ignore nicknames
     */
    getName(serverDocument: Document, member: Discord.GuildMember, ignoreNick?: boolean): any;
    reloadPrivateCommand(command: any, returnError?: boolean): any;
    reloadPublicCommand(command: any, returnError?: boolean): any;
    reloadSharedCommand(command: any, returnError?: boolean): any;
    reloadAllPrivateCommands(): void;
    reloadAllPublicCommands(): void;
    reloadAllSharedCommands(): void;
    reloadAllCommands(): void;
    getPMCommandList(): string[];
    getPublicCommandList(): string[];
    getSharedCommandList(): string[];
    getPMCommand(command: any): any;
    getPublicCommand(command: any): any;
    getSharedCommand(command: any): any;
    getPMCommandMetadata(command: any): any;
    getPublicCommandMetadata(command: any): any;
    getPublicCommandName(command: any): any;
    getSharedCommandMetadata(command: any): any;
    getSharedCommandName(command: any): any;
    canRunSharedCommand(command: any, user: any): Promise<boolean>;
    /**
     * Finds a member on a server (by username, ID, etc.)
     * @param {String} string The string to search from
     * @param {Discord.Guild} server The guild to search the member in
     * @returns {Promise<?Discord.GuildMember>} The guild member
     */
    memberSearch(string: string, server: Discord.Guild): Promise<Discord.GuildMember | null>;
    /**
     * Relays a command job to a shard that has sufficient data.
     * @param {String} command The Relay command to execute
     * @param {Object} filter An object of arguments passed to the "find" function of the Relay command
     * @param {Object} params An object of arguments passed to the execution function of the Relay command
     * @returns {Promise<?Boolean>} True when the master replies with a success, false if find failed. If an error occurred, the destination shard is expected to handle according to command logic.
     */
    relayCommand(command: string, filter: any, params: any): Promise<boolean | null>;
    /**
     * Finds a channel (by name or ID) in a server
     * @param {String} string The string to search the channel for
     * @param {Discord.Guild} server The guild to search the channel in
     * @returns {Promise<?Discord.TextChannel>} The text channel from the guild, if found.
     */
    channelSearch(string: string, server: Discord.Guild): Promise<Discord.TextChannel | null>;
    /**
     * Finds a role (by name or ID) in a server
     * @param {String} string The string to search the role for
     * @param {Discord.Guild} server The guild to search the role in
     * @returns {Promise<?Discord.Role>} The role, if found.
     */
    roleSearch(string: string, server: Discord.Guild): Promise<Discord.Role | null>;
    /**
     * Checks if a member can take actions on another member
     * @param {Discord.Guild} guild The guild to check the permissions in
     * @param {Discord.GuildMember} member The message member
     * @param {Discord.GuildMember} [affectedUser] The affected member
     * @returns {Object} Object containing the results
     */
    canDoActionOnMember(guild: Discord.Guild, member: Discord.GuildMember, affectedUser?: Discord.GuildMember, type?: any): any;
    /**
     * Gets the game string from a user
     * @param {Discord.GuildMember|Discord.User} userOrMember The user or GuildMember to get the game from
     * @returns {Promise<?String>} A string containing the game, or an empty string otherwise
     */
    getGame(userOrMember: Discord.GuildMember | Discord.User): Promise<string | null>;
    /**
     * Check if a user has leveled up a rank.
     * @param {Discord.Guild} server The guild containing the member.
     * @param {Document} serverDocument The database server document for the guild.
     * @param {Query} serverQueryDocument The Query Document
     * @param {Discord.GuildMember} member The GuildMember to check if he leveled up.
     * @param {Object} memberDocument The database member document from the guild.
     * @param {Boolean} [override=false] A boolean that represents if the rank score should be calculated with the new scores or not.
     * @returns {?Promise<?String>} String containing the new role ID for leveling up.
     */
    checkRank(server: Discord.Guild, serverDocument: Document, serverQueryDocument: Query, member: Discord.GuildMember, memberDocument: any, override?: boolean): Promise<string | null> | null;
    /**
     * Handle a spam or filter violation on a server
     * @param {Discord.Guild} server The guild that should handle this violation
     * @param {Document} serverDocument The database document for the guild
     * @param {Discord.TextChannel} channel The channel the violation occured
     * @param {Discord.GuildMember} member The member that did the violation
     * @param {Document} userDocument The database user document for the member
     * @param {Document} memberDocument The database member document from the server document
     * @param {String} userMessage A string that should be given to the user about the violation
     * @param {String} adminMessage A string that should be given to the admins about what the user violated
     * @param {String} strikeMessage The strike message that should appear in the mod logs and the audit logs
     * @param {String} action What action should be taken.
     * @param {String} roleID The role ID that the user should get due to the violation
     */
    handleViolation(server: Discord.Guild, serverDocument: Document, channel: Discord.TextChannel, member: Discord.GuildMember, userDocument: Document, memberDocument: Document, userMessage: string, adminMessage: string, strikeMessage: string, action: string, roleID: string): Promise<void>;
    /**
     * Check if user has a bot admin role on a server / is a bot admin on the server
     * @param {Discord.Guild} server The server to check on
     * @param {Document} serverDocument The database guild document
     * @param {Discord.GuildMember} member The member to check the admin level
     * @returns {Number} The admin level of the user
     */
    getUserBotAdmin(server: Discord.Guild, serverDocument: Document, member: Discord.GuildMember): number;
    /**
     * Message the bot admins for a server
     * @param {Discord.Guild} server The server that should have its admins messaged
     * @param {Document} serverDocument The database guild document for the guild.
     * @param {?Object|String} messageObject A string or a message object.
     * To send both a content and an embed, you can provide the content in the messageObject.
     */
    messageBotAdmins(server: Discord.Guild, serverDocument: Document, messageObject: (any | string) | null): Promise<void>;
    /**
     * Checks if a user is muted on a server, with or without overwrites
     * @param {Discord.TextChannel} channel The channel to check this on
     * @param {Discord.GuildMember} member The member to check this on
     * @returns {Boolean} A boolean depending if the member is muted.
     */
    isMuted(channel: Discord.TextChannel, member: Discord.GuildMember): boolean;
    /**
     * Check if a permission overwrite has any permissions related to channels
     * @param {Discord.PermissionOverwrites} allowedOrDenied The allowed or deny value of a permission overwrite for a member or role
     * @returns {Boolean} True if it has any of the perms, false if default
     */
    hasOverwritePerms(allowedOrDenied: Discord.PermissionOverwrites): boolean;
    /**
     * Mutes a member of a server in a channel
     * @param {Discord.TextChannel} channel The channel to mute in
     * @param {Discord.GuildMember} member The member to mute
     * @param {String} [reason] Optional reason for the mute
     */
    muteMember(channel: Discord.TextChannel, member: Discord.GuildMember, reason?: string): Promise<void>;
    /**
     * Unmute a member of a server in a channel
     * @param {Discord.GuildChannel} channel The channel to unmute in
     * @param {Discord.GuildMember} member The member to unmute
     * @param {String} [reason] Optional reason for the unmute
     */
    unmuteMember(channel: Discord.GuildChannel, member: Discord.GuildMember, reason?: string): Promise<void>;
    findQueryUser(query: any, list: any): any;
    /**
     * Gets the avatar for a user by his ID and hash
     * @param {String} id The user or mebmer ID
     * @param {String} hash The avatar hash returned from Discord
     * @param {String} [type="avatars"] Type of avatar to fetch, set to "icons" for servers
     * @param {Boolean} [webp=false] If the webp version of an image should be fetched
     * @returns {String} A string containing either the Discord URL to the avatar or a static reference to the generic avatar
     */
    getAvatarURL(id: string, hash: string, type?: string, webp?: boolean): string;
    /**
     * Logs a message to the serverDocument, for the admin console's logs section
     * @param {serverDocument} serverDocument The server's mongoose document
     * @param {String} level The level of severity
     * @param {String} content The content of the log message
     * @param {String} [chid] The optional channel ID
     * @param {String} [usrid] The optional user ID
     * @returns {Promise<Document>} A promise representing the new serverDocument
     */
    logMessage(serverDocument: any, level: string, content: string, chid?: string, usrid?: string): Promise<Document>;
    /**
     * Runs a message (command or keyword) extension on the extension worker
     * @param {GABMessage} msg
     * @param {Object} extensionConfigDocument
     * @returns {Promise<*>}
     */
    runExtension(msg: GABMessage, extensionConfigDocument: any): Promise<any>;
    /**
     * Gets a translator for a server using the i18n system.
     * @param {Document} serverDocument The server document to get translator for
     * @param {Document} [userDocument] Optional user document for user-specific language preference
     * @returns {Object} Translator object with t function and language helpers
     */
    getTranslator(serverDocument: Document, userDocument?: Document): any;
    /**
     * @deprecated Use getTranslator instead - legacy method for backward compatibility
     * @param {Document} serverDocument The document to get the file for
     */
    getTranslateFile(serverDocument: Document): any;
    /**
     * Sets a timeout that will be automatically cancelled if the client is destroyed
     * @param {Function} fn
     * @param {Number} delay time to wait before executing (in milliseconds)
     * @param {String} [key="generic"] The key representing this timer
     * @param {...*} args Arguments for the function
     * @returns {Timeout}
     */
    setTimeout(fn: Function, delay: number, key?: string, ...args: any[]): Timeout;
    /**
     * Clears a timeout
     * @param {Timeout} timeout Timeout to cancel
     */
    clearTimeout(timeout: Timeout): void;
    /**
     * Sets an interval that will be automatically cancelled if the client is destroyed
     * @param {Function} fn Function to execute
     * @param {Number} delay Time to wait between executions (in milliseconds)
     * @param {String} [key="generic"] The key representing this interval
     * @param {...*} args Arguments for the function
     * @returns {Timeout}
     */
    setInterval(fn: Function, delay: number, key?: string, ...args: any[]): Timeout;
    /**
     * Clears an interval
     * @param {Timeout} interval Interval to cancel
     */
    clearInterval(interval: Timeout): void;
    init(): Promise<string>;
    sweepMessages(lifetime?: any, commandLifetime?: number): number;
}
import { Client as DJSClient } from "discord.js";
import { Collection } from "discord.js";
import ProcessAsPromised = require("process-as-promised");
//# sourceMappingURL=Client.d.ts.map