export = ExtensionManager;
/**
 * Manages all operations of extensions on the Shard Worker.
 * @class
 */
declare class ExtensionManager extends DJSClient<boolean> {
    constructor(options?: {});
    /**
     * A boolean indicating if this Manager is ready to run extensions.
     * @type {boolean}
     */
    ready: boolean;
    /**
     * The global Database object, if this ExtensionManager is connected to a MongoDB instance, otherwise null.
     * @type {?Database}
     */
    DB: Database | null;
    /**
     * Events handler initialized on the first call to ExtensionManager.initialize()
     * @type {?EventsHandler}
     */
    handler: EventsHandler | null;
    /**
     * Initialize the Manager to run extensions and connect to MongoDB and Discord.
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Construct and bind this manager's EventsHandler if it doesn't already have one.
     * @returns {?EventsHandler} The EventsHandler bound to this manager after initializing
     * @private
     */
    private _initializeEventsHandler;
    /**
     * Run an extension triggered by the provided eventData.
     * @param {Document} extensionDocument
     * @param {object} versionDocument
     * @param {Document} serverDocument
     * @param {object} extensionConfigDocument
     * @param {object} eventData
     * @param {GABGuild} eventData.guild
     * @param {GABMessage} [eventData.msg]
     * @param {object} [eventData.event]
     * @returns {{ success: boolean, err: ?Error }}
     */
    runExtension(extensionDocument: Document, versionDocument: object, serverDocument: Document, extensionConfigDocument: object, eventData: {
        guild: GABGuild;
        msg?: GABMessage;
        event?: object;
    }): {
        success: boolean;
        err: Error | null;
    };
    /**
     * Handle the result of an extension run and save serverDocument modifications.
     * @param {{ success: boolean, err: ?Error }} result
     * @param {Document} serverDocument
     * @param {object} extensionConfigDocument
     * @returns {Promise<{ code: number, description: string }>}
     */
    handleRunResult(result: {
        success: boolean;
        err: Error | null;
    }, serverDocument: Document, extensionConfigDocument: object): Promise<{
        code: number;
        description: string;
    }>;
    /**
     * Fetches the code associated with a versionDocument from the FS.
     * @param {Object} versionDocument
     * @returns {Promise<string>}
     */
    fetchExtensionCode(versionDocument: any): Promise<string>;
    /**
     * Evaluate a string of javascript code in an isolated sandbox with the provided context.
     * Uses isolated-vm for secure execution (replaces vulnerable vm2).
     * @param {string} code
     * @param {object} context
     * @param {ExtensionManager} context.client
     * @param {Document} context.serverDocument
     * @param {Document} context.extensionDocument
     * @param {object} context.versionDocument
     * @param {object} context.extensionConfigDocument
     * @param {GABMessage} [context.msg]
     * @param {GABGuild} context.guild
     * @param {object} [context.event]
     * @returns {Promise<{ success: boolean, err: ?Error }>}
     */
    runWithContext(code: string, context: {
        client: ExtensionManager;
        serverDocument: Document;
        extensionDocument: Document;
        versionDocument: object;
        extensionConfigDocument: object;
        msg?: GABMessage;
        guild: GABGuild;
        event?: object;
    }): Promise<{
        success: boolean;
        err: Error | null;
    }>;
}
import { Client as DJSClient } from "discord.js";
import EventsHandler = require("./EventsHandler");
//# sourceMappingURL=ExtensionManager.d.ts.map