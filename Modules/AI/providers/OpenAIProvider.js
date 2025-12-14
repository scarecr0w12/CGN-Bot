/**
 * OpenAIProvider - Provider for OpenAI API
 * Supports GPT-4, GPT-4o, GPT-3.5-turbo, and other OpenAI models
 */

const BaseProvider = require("./BaseProvider");
const { fetch } = require("undici");

class OpenAIProvider extends BaseProvider {
	constructor (config) {
		super(config);
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
		this.organization = config.organization || null;
	}

	/**
	 * Perform a chat completion
	 * @param {Object} options - Chat options
	 * @returns {Promise<string>|AsyncGenerator} Response or stream
	 */
	async chat ({ model, messages, stream = false, ...params }) {
		const url = `${this.baseUrl}/chat/completions`;

		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.apiKey}`,
		};

		if (this.organization) {
			headers["OpenAI-Organization"] = this.organization;
		}

		const body = {
			model,
			messages,
			stream,
			...params,
		};

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI API error: ${response.status} - ${error}`);
		}

		if (stream) {
			return this._handleStream(response);
		} else {
			return this._handleResponse(response);
		}
	}

	/**
	 * Handle non-streaming response
	 * @private
	 */
	async _handleResponse (response) {
		const data = await response.json();

		// Record usage
		if (data.usage) {
			this.setLastUsage({
				prompt: data.usage.prompt_tokens || 0,
				completion: data.usage.completion_tokens || 0,
				total: data.usage.total_tokens || 0,
			});
		}

		const choice = data.choices && data.choices[0];
		return choice && choice.message ? choice.message.content : "";
	}

	/**
	 * Handle streaming response
	 * @private
	 */
	async *_handleStream (response) {
		let totalCompletion = 0;

		for await (const chunk of this.parseSSEStream(response.body, (parsed) => {
			const choice = parsed.choices && parsed.choices[0];
			const delta = choice && choice.delta;
			if (delta && delta.content) {
				totalCompletion += delta.content.length;
				return delta.content;
			}
			return null;
		})) {
			yield chunk;
		}

		// Estimate usage for streaming (actual usage not available in stream)
		// Prompt tokens unknown in streaming, completion is rough estimate
		this.setLastUsage({
			prompt: 0,
			completion: Math.ceil(totalCompletion / 4),
			total: Math.ceil(totalCompletion / 4),
		});
	}

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
	async generateImage ({ prompt, model = "dall-e-3", size = "1024x1024", quality = "standard", style = "vivid", n = 1 }) {
		const url = `${this.baseUrl}/images/generations`;

		const body = {
			model,
			prompt,
			n,
			size,
		};

		// dall-e-3 specific options
		if (model === "dall-e-3") {
			body.quality = quality;
			body.style = style;
		}

		// gpt-image-1 returns base64 by default
		if (model === "gpt-image-1") {
			body.response_format = "b64_json";
		}

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI Image API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		return data.data.map(img => ({
			url: img.url || null,
			b64_json: img.b64_json || null,
			revised_prompt: img.revised_prompt || null,
		}));
	}

	/**
	 * Create variations of an existing image
	 * @param {Object} options - Variation options
	 * @param {Buffer|string} options.image - Image buffer or base64 string
	 * @param {string} options.model - Model to use (dall-e-2 only for variations)
	 * @param {string} options.size - Image size
	 * @param {number} options.n - Number of variations
	 * @returns {Promise<Array>} Array of image URLs
	 */
	async createImageVariation ({ image, model = "dall-e-2", size = "1024x1024", n = 1 }) {
		const url = `${this.baseUrl}/images/variations`;

		// Create form data
		const FormData = require("form-data");
		const formData = new FormData();

		// Convert base64 to buffer if needed
		let imageBuffer = image;
		if (typeof image === "string") {
			imageBuffer = Buffer.from(image, "base64");
		}

		formData.append("image", imageBuffer, { filename: "image.png", contentType: "image/png" });
		formData.append("model", model);
		formData.append("size", size);
		formData.append("n", String(n));

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				...formData.getHeaders(),
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI Image Variation API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		return data.data.map(img => ({
			url: img.url || null,
			b64_json: img.b64_json || null,
		}));
	}

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
	async editImage ({ image, mask, prompt, model = "dall-e-2", size = "1024x1024", n = 1 }) {
		const url = `${this.baseUrl}/images/edits`;

		const FormData = require("form-data");
		const formData = new FormData();

		// Convert base64 to buffer if needed
		let imageBuffer = image;
		if (typeof image === "string") {
			imageBuffer = Buffer.from(image, "base64");
		}

		formData.append("image", imageBuffer, { filename: "image.png", contentType: "image/png" });

		if (mask) {
			let maskBuffer = mask;
			if (typeof mask === "string") {
				maskBuffer = Buffer.from(mask, "base64");
			}
			formData.append("mask", maskBuffer, { filename: "mask.png", contentType: "image/png" });
		}

		formData.append("prompt", prompt);
		formData.append("model", model);
		formData.append("size", size);
		formData.append("n", String(n));

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				...formData.getHeaders(),
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenAI Image Edit API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		return data.data.map(img => ({
			url: img.url || null,
			b64_json: img.b64_json || null,
		}));
	}

	/**
	 * List available models
	 * @returns {Promise<string[]>} Array of model names
	 */
	async listModels () {
		const url = `${this.baseUrl}/models`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to list models: ${response.status}`);
		}

		const data = await response.json();
		const models = data.data || [];

		// Filter to chat models
		return models
			.filter(m => m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3"))
			.map(m => m.id)
			.sort();
	}
}

module.exports = OpenAIProvider;
