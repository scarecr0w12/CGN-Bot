export = OpenAIProvider;
declare class OpenAIProvider extends BaseProvider {
    apiKey: any;
    baseUrl: any;
    organization: any;
    /**
     * Perform a chat completion
     * @param {Object} options - Chat options
     * @returns {Promise<string>|AsyncGenerator} Response or stream
     */
    chat({ model, messages, stream, ...params }: any): Promise<string> | AsyncGenerator;
    /**
     * Handle non-streaming response
     * @private
     */
    private _handleResponse;
    /**
     * Handle streaming response
     * @private
     */
    private _handleStream;
    /**
     * Generate an image from a text prompt
     * @param {Object} options - Image generation options
     * @param {string} options.prompt - The text prompt
     * @param {string} options.model - Model to use (dall-e-2, dall-e-3, gpt-image-1)
     * @param {string} options.size - Image size (1024x1024, 1792x1024, 1024x1792)
     * @param {string} options.quality - Image quality (standard, hd)
     * @param {string} options.style - Image style (vivid, natural) - dall-e-3 only
     * @param {number} options.n - Number of images to generate
     * @returns {Promise<Array>} Array of image URLs or base64 data
     */
    generateImage({ prompt, model, size, quality, style, n }: {
        prompt: string;
        model: string;
        size: string;
        quality: string;
        style: string;
        n: number;
    }): Promise<any[]>;
    /**
     * Create variations of an existing image
     * @param {Object} options - Variation options
     * @param {Buffer|string} options.image - Image buffer or base64 string
     * @param {string} options.model - Model to use (dall-e-2 only for variations)
     * @param {string} options.size - Image size
     * @param {number} options.n - Number of variations
     * @returns {Promise<Array>} Array of image URLs
     */
    createImageVariation({ image, model, size, n }: {
        image: Buffer | string;
        model: string;
        size: string;
        n: number;
    }): Promise<any[]>;
    /**
     * Edit an image with a prompt (inpainting)
     * @param {Object} options - Edit options
     * @param {Buffer|string} options.image - Original image
     * @param {Buffer|string} options.mask - Mask image (transparent areas will be edited)
     * @param {string} options.prompt - Edit prompt
     * @param {string} options.model - Model to use
     * @param {string} options.size - Image size
     * @param {number} options.n - Number of images
     * @returns {Promise<Array>} Array of edited images
     */
    editImage({ image, mask, prompt, model, size, n }: {
        image: Buffer | string;
        mask: Buffer | string;
        prompt: string;
        model: string;
        size: string;
        n: number;
    }): Promise<any[]>;
}
import BaseProvider = require("./BaseProvider");
//# sourceMappingURL=OpenAIProvider.d.ts.map