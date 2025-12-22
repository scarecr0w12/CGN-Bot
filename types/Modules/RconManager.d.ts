export = RconManager;
/**
 * RconManager - Main interface for extensions
 */
declare class RconManager {
    /**
     * Send an RCON command to a game server
     * @param {Object} options
     * @param {string} options.type - "webrcon" (Rust) or "source" (other games)
     * @param {string} options.host - Server hostname or IP
     * @param {number} options.port - RCON port
     * @param {string} options.password - RCON password
     * @param {string} options.command - Command to execute
     * @param {string} [options.serverId] - Server identifier for rate limiting
     * @returns {Promise<Object>}
     */
    static sendCommand(options: {
        type: string;
        host: string;
        port: number;
        password: string;
        command: string;
        serverId?: string;
    }): Promise<any>;
    /**
     * Test RCON connection
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    static testConnection(options: any): Promise<any>;
    /**
     * Close all connections (for shutdown)
     */
    static closeAll(): void;
}
//# sourceMappingURL=RconManager.d.ts.map