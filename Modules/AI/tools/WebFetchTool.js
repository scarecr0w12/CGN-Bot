const { fetch } = require("undici");

class WebFetchTool {
	constructor () {
		this.name = "webfetch";
		this.description = "Fetch and summarize the contents of a web page";
	}

	async execute ({ url, maxChars = 6000, config = {} }) {
		if (!url || typeof url !== "string") {
			return "Please provide a valid URL.";
		}

		let parsedUrl;
		try {
			parsedUrl = new URL(url);
		} catch (error) {
			return `Invalid URL: ${url}`;
		}

		if (!["http:", "https:"].includes(parsedUrl.protocol)) {
			return "Only http and https URLs are supported.";
		}

		const effectiveMaxChars = Math.max(500, Math.min(config.maxChars || maxChars || 6000, 20000));
		const timeoutMs = Math.max(2000, Math.min(config.timeoutMs || 10000, 30000));
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(parsedUrl.toString(), {
				headers: {
					"User-Agent": "SkynetBot/1.0 (+https://github.com/scarecr0w12/CGN-Bot)",
					Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
				},
				signal: controller.signal,
				redirect: "follow",
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const contentType = response.headers.get("content-type") || "unknown";
			const html = await response.text();
			const text = this._extractText(html)
				.replace(/\s+/g, " ")
				.trim()
				.slice(0, effectiveMaxChars);

			if (!text) {
				return `Fetched ${parsedUrl.toString()} but could not extract readable text.`;
			}

			return [
				`Fetched URL: ${parsedUrl.toString()}`,
				`Content-Type: ${contentType}`,
				"",
				text,
			].join("\n");
		} catch (error) {
			logger.warn(`Web fetch error for ${parsedUrl.toString()}: ${error.message}`);
			return `Fetch failed for ${parsedUrl.toString()}: ${error.message}`;
		} finally {
			clearTimeout(timeout);
		}
	}

	_extractText (html) {
		return html
			.replace(/<script[\s\S]*?<\/script>/gi, " ")
			.replace(/<style[\s\S]*?<\/style>/gi, " ")
			.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
			.replace(/<svg[\s\S]*?<\/svg>/gi, " ")
			.replace(/<[^>]+>/g, " ")
			.replace(/&nbsp;/gi, " ")
			.replace(/&amp;/gi, "&")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">")
			.replace(/&quot;/gi, '"')
			.replace(/&#39;/gi, "'");
	}
}

module.exports = WebFetchTool;
