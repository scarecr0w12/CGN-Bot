export = ToolRegistry;
declare class ToolRegistry {
    constructor(aiManager: any);
    aiManager: any;
    tools: Map<any, any>;
    /**
     * Initialize the tool registry with default tools
     */
    initialize(): Promise<void>;
    /**
     * Register a tool
     * @param {string} name - Tool name
     * @param {Object} tool - Tool instance
     */
    register(name: string, tool: any): void;
    /**
     * Get a tool by name
     * @param {string} name - Tool name
     * @returns {Object|null} Tool instance or null
     */
    get(name: string): any | null;
    /**
     * Check if a tool is enabled for a guild
     * @param {Object} serverDocument - The server document
     * @param {string} toolName - Tool name
     * @returns {boolean} True if enabled
     */
    isEnabled(serverDocument: any, toolName: string): boolean;
    /**
     * Execute a tool
     * @param {string} toolName - Tool name
     * @param {Object} options - Tool options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.user - The Discord user
     * @param {Object} options.params - Tool-specific parameters
     * @returns {Promise<string>} Tool result
     */
    execute(toolName: string, { serverDocument, user, params }: {
        serverDocument: any;
        user: any;
        params: any;
    }): Promise<string>;
    /**
     * Get list of available tools
     * @returns {string[]} Array of tool names
     */
    list(): string[];
    /**
     * Get tool descriptions for help
     * @returns {Object} Map of tool names to descriptions
     */
    getDescriptions(): any;
}
//# sourceMappingURL=ToolRegistry.d.ts.map