export = IsolatedSandbox;
/**
 * Creates an isolated sandbox environment for running extensions using isolated-vm.
 * This replaces the vulnerable vm2 package with a secure V8 isolate.
 */
declare class IsolatedSandbox {
    /**
     * @param {ExtensionManager} rawClient - The extension manager client
     * @param {Object} context - The extension context
     * @param {Array} scopes - The allowed scopes for this extension
     */
    constructor(rawClient: ExtensionManager, context: any, scopes: any[]);
    rawClient: ExtensionManager;
    context: any;
    scopes: any[];
    isolate: ivm.Isolate;
    vmContext: ivm.Context;
    /**
     * Initialize the isolated environment
     * @param {Number} timeout - Maximum execution time in milliseconds
     * @returns {Promise<void>}
     */
    initialize(_timeout?: number): Promise<void>;
    /**
     * Set up the custom require function in the isolate
     * @param {ivm.Reference} jail - The global reference
     * @private
     */
    private _setupRequire;
    _setupHttpCallbacks(jail: any): Promise<void>;
    /**
     * Set up callbacks for RCON operations (game server control)
     * @param {ivm.Reference} jail
     * @private
     */
    private _setupRconCallbacks;
    /**
     * Set up callbacks for extension store operations
     * @param {ivm.Reference} jail
     * @private
     */
    private _setupExtensionStoreCallbacks;
    /**
     * Set up callbacks for message reply operations
     * @param {ivm.Reference} jail
     * @private
     */
    private _setupMessageCallbacks;
    /**
     * Set up callbacks for points/economy write operations
     * @param {ivm.Reference} jail - The global reference
     * @private
     */
    private _setupPointsCallbacks;
    _pointsModule: any;
    /**
     * Set up callbacks for interaction reply operations (slash commands)
     * @param {ivm.Reference} jail - The global reference
     * @private
     */
    private _setupInteractionCallbacks;
    /**
     * Build serializable module data for the isolate
     * @returns {Object} Module data map
     * @private
     */
    private _buildModulesData;
    /**
     * Resolve a module by name (called from isolate via callback)
     * @param {String} name - Module name
     * @returns {*} The resolved module value
     * @private
     */
    private _resolveModule;
    /**
     * Serialize an interaction for the isolate
     * @param {Interaction} interaction
     * @returns {Object}
     * @private
     */
    private _serializeInteraction;
    /**
     * Serialize a message for the isolate
     * @param {Message} msg
     * @returns {Object}
     * @private
     */
    private _serializeMessage;
    /**
     * Serialize a channel for the isolate
     * @param {Channel} channel
     * @returns {Object}
     * @private
     */
    private _serializeChannel;
    /**
     * Serialize a guild for the isolate
     * @param {Guild} guild
     * @returns {Object}
     * @private
     */
    private _serializeGuild;
    /**
     * Serialize bot info for the isolate
     * @param {Client} client
     * @param {Guild} guild
     * @param {Document} serverDocument
     * @returns {Object}
     * @private
     */
    private _serializeBot;
    /**
     * Serialize event data for the isolate
     * @param {Object} eventData
     * @returns {Object}
     * @private
     */
    private _serializeEvent;
    /**
     * Serialize a member for the isolate
     * @param {GuildMember} member
     * @returns {Object}
     * @private
     */
    private _serializeMember;
    /**
     * Serialize a user for the isolate
     * @param {User} user
     * @returns {Object}
     * @private
     */
    private _serializeUser;
    /**
     * Serialize guild roles for the isolate
     * @param {Guild} guild
     * @returns {Object}
     * @private
     */
    private _serializeRoles;
    /**
     * Get embed builder helper functions
     * @returns {Object}
     * @private
     */
    private _getEmbedHelper;
    /**
     * Serialize the points module for the isolate
     * @param {Object} pointsModule - Points module instance
     * @returns {Object} Serialized points data and functions
     * @private
     */
    private _serializePointsModule;
    /**
     * Set up console.log in the isolate (limited functionality)
     * @param {ivm.Reference} jail
     * @private
     */
    private _setupConsole;
    /**
     * Run code in the isolated environment
     * @param {String} code - The code to execute
     * @param {Number} timeout - Maximum execution time in ms
     * @returns {Promise<{success: Boolean, err: ?Error}>}
     */
    run(code: string, timeout?: number): Promise<{
        success: boolean;
        err: Error | null;
    }>;
    /**
     * Clean up the isolate resources
     */
    dispose(): void;
}
import ivm = require("isolated-vm");
//# sourceMappingURL=IsolatedSandbox.d.ts.map