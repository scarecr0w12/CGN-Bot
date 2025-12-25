export = Client;
declare class Client {
    /**
     * Create a Discord.js client sandboxed for extension execution
     * @param {GABClient} bot The raw bot instance
     * @param {Discord.Guild} server The raw guild this client should be instantiated for
     * @param {Document} serverDocument The server document for the guild
     * @param {Object} extensionDocument The extension's DB document
     * @param {Object} scopes The scopes this extension has been granted by the guild
     */
    constructor(bot: GABClient, server: Discord.Guild, serverDocument: Document, extensionDocument: any, scopes: any);
    /**
     * The client's Discord user.
     * @type {API.User}
     */
    user: API.User;
    /**
     * The amount of ms that have passed since this shard entered the READY state.
     * @type {number}
     */
    uptime: number;
    /**
     * The ID for the current shard.
     * @type {string}
     */
    shard: string;
}
import API = require("../index");
//# sourceMappingURL=Client.d.ts.map