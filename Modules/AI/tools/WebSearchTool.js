/**
 * WebSearchTool - Web search tool for AI
 * Uses DuckDuckGo or configured search API
 */

const { fetch } = require("undici");

class WebSearchTool {
	constructor () {
		this.name = "websearch";
		this.description = "Search the web for current information";
	}

	/**
	 * Execute a web search
	 * @param {Object} options - Search options
	 * @param {string} options.query - Search query
	 * @param {number} options.limit - Max results
	 * @param {Object} options.config - Tool configuration
	 * @returns {Promise<string>} Formatted search results
	 */
	async execute ({ query, limit = 5, config = {} }) {
		if (!query || query.trim().length === 0) {
			return "Please provide a search query.";
		}

		try {
			// Use configured search provider or default to DuckDuckGo
			const provider = config.provider || "duckduckgo";

			let results;
			if (provider === "serp" && config.apiKey) {
				results = await this._searchSerp(query, limit, config.apiKey);
			} else {
				results = await this._searchDuckDuckGo(query, limit);
			}

			if (!results || results.length === 0) {
				return `No results found for: ${query}`;
			}

			return this._formatResults(query, results);
		} catch (error) {
			logger.warn(`Web search error: ${error.message}`);
			return `Search failed: ${error.message}`;
		}
	}

	/**
	 * Search using DuckDuckGo Instant Answer API
	 * @private
	 */
	async _searchDuckDuckGo (query, limit) {
		const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

		const response = await fetch(url, {
			headers: {
				"User-Agent": "SkynetBot/1.0",
			},
		});

		if (!response.ok) {
			throw new Error(`DuckDuckGo API error: ${response.status}`);
		}

		const data = await response.json();
		const results = [];

		// Add abstract if available
		if (data.Abstract) {
			results.push({
				title: data.Heading || query,
				snippet: data.Abstract,
				url: data.AbstractURL || "",
				source: data.AbstractSource || "DuckDuckGo",
			});
		}

		// Add related topics
		if (data.RelatedTopics) {
			for (const topic of data.RelatedTopics.slice(0, limit - results.length)) {
				if (topic.Text && topic.FirstURL) {
					results.push({
						title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 50),
						snippet: topic.Text,
						url: topic.FirstURL,
						source: "DuckDuckGo",
					});
				}
			}
		}

		// Add answer if available
		if (data.Answer && results.length < limit) {
			results.unshift({
				title: "Direct Answer",
				snippet: data.Answer,
				url: "",
				source: "DuckDuckGo",
			});
		}

		return results.slice(0, limit);
	}

	/**
	 * Search using SerpAPI
	 * @private
	 */
	async _searchSerp (query, limit, apiKey) {
		const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${limit}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`SerpAPI error: ${response.status}`);
		}

		const data = await response.json();
		const results = [];

		// Add organic results
		if (data.organic_results) {
			for (const result of data.organic_results.slice(0, limit)) {
				results.push({
					title: result.title,
					snippet: result.snippet,
					url: result.link,
					source: "Google",
				});
			}
		}

		// Add answer box if available
		if (data.answer_box && results.length < limit) {
			results.unshift({
				title: data.answer_box.title || "Answer",
				snippet: data.answer_box.answer || data.answer_box.snippet || "",
				url: data.answer_box.link || "",
				source: "Google Answer Box",
			});
		}

		return results.slice(0, limit);
	}

	/**
	 * Format search results for display
	 * @private
	 */
	_formatResults (query, results) {
		const lines = [`**Web Search Results for:** ${query}\n`];

		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			lines.push(`**${i + 1}. ${result.title}**`);

			if (result.snippet) {
				// Truncate long snippets
				const snippet = result.snippet.length > 200 ?
					`${result.snippet.substring(0, 200)}...` :
					result.snippet;
				lines.push(snippet);
			}

			if (result.url) {
				lines.push(`<${result.url}>`);
			}

			lines.push("");
		}

		return lines.join("\n").trim();
	}
}

module.exports = WebSearchTool;
