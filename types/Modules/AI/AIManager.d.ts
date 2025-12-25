export = AIManager;
declare class AIManager {
    /**
     * @param {Object} client - The Discord client instance
     */
    constructor(client: any);
    client: any;
    providerFactory: ProviderFactory;
    memory: ConversationMemory;
    vectorMemory: VectorMemory;
    rateLimiter: RateLimiter;
    usageTracker: UsageTracker;
    toolRegistry: ToolRegistry;
    _modelCache: Map<any, any>;
    _modelCacheTTL: number;
    /**
     * Initialize the AI manager
     */
    initialize(): Promise<void>;
    /**
     * Resolve provider and model configuration for a guild
     * @param {Object} serverDocument - The server document from database
     * @returns {Object} { providerName, model, providerConfig }
     */
    resolveProviderAndModel(serverDocument: any): any;
    /**
     * Build a provider instance from configuration
     * @param {string} providerName - Name of the provider
     * @param {Object} config - Provider configuration
     * @returns {Object} Provider instance
     */
    buildProvider(providerName: string, config: any): any;
    /**
     * Get available models for a provider (with caching)
     * @param {string} providerName - Name of the provider
     * @param {Object} providerConfig - Provider configuration
     * @returns {Promise<string[]>} List of available models
     */
    getAvailableModels(providerName: string, providerConfig: any): Promise<string[]>;
    /**
     * Check if a model is allowed by guild policy
     * @param {Object} serverDocument - The server document
     * @param {string} providerName - Provider name
     * @param {string} modelName - Model name
     * @returns {string|null} Error message if not allowed, null if allowed
     */
    isModelAllowed(serverDocument: any, providerName: string, modelName: string): string | null;
    /**
     * Check rate limits and record usage
     * @param {Object} serverDocument - The server document
     * @param {Object} channel - The Discord channel
     * @param {Object} user - The Discord user
     * @returns {string|null} Error message if rate limited, null if allowed
     */
    checkAndRecordUsage(serverDocument: any, channel: any, user: any): string | null;
    /**
     * Check budget limits for a user
     * @param {Object} serverDocument - The server document
     * @param {Object} user - The Discord user
     * @returns {string|null} Error message if over budget, null if allowed
     */
    checkBudget(serverDocument: any, user: any): string | null;
    /**
     * Build conversation context from memory
     * @param {Object} serverDocument - The server document
     * @param {string} channelId - The channel ID
     * @param {Object} user - The Discord user
     * @param {string} currentMessage - The current user message for vector search
     * @returns {Array} Array of ChatMessage objects
     */
    buildContext(serverDocument: any, channelId: string, user: any, currentMessage?: string): any[];
    /**
     * Search vector memory for relevant context
     * @param {Object} serverDocument - The server document
     * @param {string} channelId - The channel ID
     * @param {string} userId - The user ID
     * @param {string} query - The search query
     * @returns {Promise<Array>} Array of relevant memories
     */
    searchVectorMemory(serverDocument: any, channelId: string, userId: string, query: string): Promise<any[]>;
    /**
     * Store a message in vector memory
     * @param {Object} serverDocument - The server document
     * @param {string} channelId - The channel ID
     * @param {string} userId - The user ID
     * @param {string} content - The content to store
     * @param {string} type - Type of memory (message, fact, summary)
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<string|null>} Point ID or null
     */
    storeInVectorMemory(serverDocument: any, channelId: string, userId: string, content: string, type?: string, metadata?: any): Promise<string | null>;
    /**
     * Get vector memory statistics for a guild
     * @param {Object} serverDocument - The server document
     * @returns {Promise<Object|null>} Stats object or null
     */
    getVectorMemoryStats(serverDocument: any): Promise<any | null>;
    /**
     * Test vector memory connection
     * @param {Object} config - Qdrant configuration
     * @returns {Promise<Object>} Connection test result
     */
    testVectorMemoryConnection(config: any): Promise<any>;
    /**
     * Clear vector memory for a guild
     * @param {Object} serverDocument - The server document
     * @param {Object} options - Clear options (channelId, userId, olderThan)
     * @returns {Promise<boolean>} Whether deletion was successful
     */
    clearVectorMemory(serverDocument: any, options?: any): Promise<boolean>;
    /**
     * Perform a chat completion
     * @param {Object} options - Chat options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.channel - The Discord channel
     * @param {Object} options.user - The Discord user
     * @param {string} options.message - The user's message
     * @param {boolean} options.stream - Whether to stream the response
     * @returns {AsyncGenerator|Promise} Response or stream
     */
    chat({ serverDocument, channel, user, message, stream }: {
        serverDocument: any;
        channel: any;
        user: any;
        message: string;
        stream: boolean;
    }): AsyncGenerator | Promise<any>;
    /**
     * Perform a single (non-streaming) chat completion
     * @private
     */
    private _singleChat;
    /**
     * Perform a streaming chat completion
     * @private
     */
    private _streamChat;
    /**
     * Resolve template variables in a message
     * @param {string} message - The message with variables
     * @param {Object} serverDocument - The server document
     * @param {Object} channel - The Discord channel
     * @param {Object} user - The Discord user
     * @returns {string} Message with variables resolved
     */
    resolveVariables(message: string, serverDocument: any, channel: any, user: any): string;
    /**
     * Get available variables help text
     * @returns {string} Help text describing available variables
     */
    getVariablesHelp(): string;
    /**
     * Generate an image from a text prompt
     * @param {Object} options - Generation options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.user - The Discord user
     * @param {string} options.prompt - The text prompt
     * @param {string} options.model - Model to use (dall-e-2, dall-e-3, gpt-image-1)
     * @param {string} options.size - Image size
     * @param {string} options.quality - Image quality (standard, hd)
     * @param {string} options.style - Image style (vivid, natural)
     * @returns {Promise<Array>} Array of generated images
     */
    generateImage({ serverDocument, user, prompt, model, size, quality, style }: {
        serverDocument: any;
        user: any;
        prompt: string;
        model: string;
        size: string;
        quality: string;
        style: string;
    }): Promise<any[]>;
    /**
     * Create variations of an existing image
     * @param {Object} options - Variation options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.user - The Discord user
     * @param {Buffer|string} options.image - Image buffer or base64 string
     * @param {string} options.size - Image size
     * @returns {Promise<Array>} Array of variation images
     */
    createImageVariation({ serverDocument, user, image, size }: {
        serverDocument: any;
        user: any;
        image: Buffer | string;
        size: string;
    }): Promise<any[]>;
    /**
     * Summarize text or messages using AI
     * @param {Object} options - Summarize options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.channel - The Discord channel
     * @param {Object} options.user - The Discord user
     * @param {string} options.text - Text to summarize
     * @param {string} options.style - Summary style (brief, detailed, bullets)
     * @returns {Promise<string>} Summary text
     */
    summarize({ serverDocument, channel, user, text, style }: {
        serverDocument: any;
        channel: any;
        user: any;
        text: string;
        style: string;
    }): Promise<string>;
    /**
     * Rewrite text in a different tone/style
     * @param {Object} options - Rewrite options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.channel - The Discord channel
     * @param {Object} options.user - The Discord user
     * @param {string} options.text - Text to rewrite
     * @param {string} options.tone - Target tone
     * @returns {Promise<string>} Rewritten text
     */
    rewrite({ serverDocument, channel, user, text, tone }: {
        serverDocument: any;
        channel: any;
        user: any;
        text: string;
        tone: string;
    }): Promise<string>;
    /**
     * Explain code or concepts
     * @param {Object} options - Explain options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.channel - The Discord channel
     * @param {Object} options.user - The Discord user
     * @param {string} options.content - Content to explain
     * @param {string} options.type - Type of content (code, concept, error)
     * @param {string} options.level - Explanation level (beginner, intermediate, advanced)
     * @returns {Promise<string>} Explanation
     */
    explain({ serverDocument, channel, user, content, type, level }: {
        serverDocument: any;
        channel: any;
        user: any;
        content: string;
        type: string;
        level: string;
    }): Promise<string>;
    /**
     * Generate a stylized avatar from a prompt
     * @param {Object} options - Avatar options
     * @param {Object} options.serverDocument - The server document
     * @param {Object} options.user - The Discord user
     * @param {string} options.description - Description of the avatar
     * @param {string} options.style - Art style (anime, realistic, cartoon, pixel, fantasy)
     * @returns {Promise<Array>} Array of generated avatar images
     */
    generateAvatar({ serverDocument, user, description, style }: {
        serverDocument: any;
        user: any;
        description: string;
        style: string;
    }): Promise<any[]>;
}
import ProviderFactory = require("./providers/ProviderFactory");
import ConversationMemory = require("./ConversationMemory");
import VectorMemory = require("./VectorMemory");
import RateLimiter = require("./RateLimiter");
import UsageTracker = require("./UsageTracker");
import ToolRegistry = require("./tools/ToolRegistry");
//# sourceMappingURL=AIManager.d.ts.map