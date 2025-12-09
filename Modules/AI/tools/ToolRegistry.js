/**
 * ToolRegistry - Registry for AI tools (web search, etc.)
 * Manages available tools and their execution
 */

const WebSearchTool = require("./WebSearchTool");

class ToolRegistry {
	constructor (aiManager) {
		this.aiManager = aiManager;
		this.tools = new Map();
	}

	/**
	 * Initialize the tool registry with default tools
	 */
	async initialize () {
		// Register default tools
		this.register("websearch", new WebSearchTool());

		logger.info(`AI Tool Registry initialized with ${this.tools.size} tools`);
	}

	/**
	 * Register a tool
	 * @param {string} name - Tool name
	 * @param {Object} tool - Tool instance
	 */
	register (name, tool) {
		this.tools.set(name.toLowerCase(), tool);
	}

	/**
	 * Get a tool by name
	 * @param {string} name - Tool name
	 * @returns {Object|null} Tool instance or null
	 */
	get (name) {
		return this.tools.get(name.toLowerCase()) || null;
	}

	/**
	 * Check if a tool is enabled for a guild
	 * @param {Object} serverDocument - The server document
	 * @param {string} toolName - Tool name
	 * @returns {boolean} True if enabled
	 */
	isEnabled (serverDocument, toolName) {
		const aiConfig = serverDocument.config.ai || {};
		const governance = aiConfig.governance || {};
		const toolsConfig = governance.tools || {};

		const allow = toolsConfig.allow || [];
		const deny = toolsConfig.deny || [];

		// If in deny list, disabled
		if (deny.includes(toolName)) return false;

		// If allow list exists and tool not in it, disabled
		if (allow.length > 0 && !allow.includes(toolName)) return false;

		// Default to enabled
		return true;
	}

	/**
	 * Execute a tool
	 * @param {string} toolName - Tool name
	 * @param {Object} options - Tool options
	 * @param {Object} options.serverDocument - The server document
	 * @param {Object} options.user - The Discord user
	 * @param {Object} options.params - Tool-specific parameters
	 * @returns {Promise<string>} Tool result
	 */
	async execute (toolName, { serverDocument, user, params }) {
		const tool = this.get(toolName);

		if (!tool) {
			throw new Error(`Unknown tool: ${toolName}`);
		}

		if (!this.isEnabled(serverDocument, toolName)) {
			throw new Error(`Tool '${toolName}' is disabled. Enable it with the AI governance settings.`);
		}

		// Get tool-specific config
		const aiConfig = serverDocument.config.ai || {};
		const toolsConfig = aiConfig.tools || {};
		const toolConfig = toolsConfig[toolName] || {};

		return tool.execute({ ...params, config: toolConfig, user });
	}

	/**
	 * Get list of available tools
	 * @returns {string[]} Array of tool names
	 */
	list () {
		return Array.from(this.tools.keys());
	}

	/**
	 * Get tool descriptions for help
	 * @returns {Object} Map of tool names to descriptions
	 */
	getDescriptions () {
		const descriptions = {};
		for (const [name, tool] of this.tools.entries()) {
			descriptions[name] = tool.description || "No description available";
		}
		return descriptions;
	}
}

module.exports = ToolRegistry;
