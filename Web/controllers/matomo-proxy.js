const https = require("https");
const http = require("http");
const { URL } = require("url");

module.exports = async (req, res) => {
	const { method: apiMethod, idSite, period, date, lastMinutes, filter_limit, expanded, flat, field } = req.query;

	// Get Matomo configuration from environment
	const matomoUrl = process.env.MATOMO_URL;
	const matomoToken = process.env.MATOMO_TOKEN;
	const matomoSiteId = idSite || process.env.MATOMO_SITE_ID || "1";

	if (!matomoUrl || !matomoToken) {
		return res.status(500).json({ error: "Matomo not configured" });
	}

	if (!apiMethod) {
		return res.status(400).json({ error: "Missing 'method' parameter" });
	}

	// Build POST body
	const params = new URLSearchParams();
	params.append("module", "API");
	params.append("method", apiMethod);
	params.append("idSite", matomoSiteId);
	params.append("format", "JSON");
	params.append("token_auth", matomoToken);

	if (period) params.append("period", period);
	if (date) params.append("date", date);
	if (lastMinutes) params.append("lastMinutes", lastMinutes);
	if (filter_limit) params.append("filter_limit", filter_limit);
	if (expanded) params.append("expanded", expanded);
	if (flat) params.append("flat", flat);

	const postData = params.toString();

	// Parse Matomo URL
	let parsedUrl;
	try {
		// Remove trailing slash if present
		const baseUrl = matomoUrl.endsWith("/") ? matomoUrl.slice(0, -1) : matomoUrl;
		parsedUrl = new URL(`${baseUrl}/index.php`);
	} catch (e) {
		return res.status(500).json({ error: "Invalid Matomo URL configuration" });
	}

	const isHttps = parsedUrl.protocol === "https:";
	const httpModule = isHttps ? https : http;

	const options = {
		hostname: parsedUrl.hostname,
		port: parsedUrl.port || (isHttps ? 443 : 80),
		path: parsedUrl.pathname,
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": Buffer.byteLength(postData),
		},
	};

	const proxyReq = httpModule.request(options, proxyRes => {
		let data = "";
		proxyRes.on("data", chunk => {
			data += chunk;
		});
		proxyRes.on("end", () => {
			res.setHeader("Content-Type", "application/json");
			res.setHeader("Access-Control-Allow-Origin", "*");
			try {
				// Try to parse as JSON to validate
				let jsonData = JSON.parse(data);

				// If a specific field is requested, extract it and return as array for Grafana
				if (field) {
					// Handle array index notation like "[0].visitors"
					let value = jsonData;
					const parts = field.split(".").filter(p => p);
					for (const part of parts) {
						const arrayMatch = part.match(/^\[(\d+)\](.*)$/);
						if (arrayMatch) {
							const index = parseInt(arrayMatch[1], 10);
							const remainder = arrayMatch[2];
							value = value[index];
							if (remainder && value) {
								value = value[remainder];
							}
						} else if (value && typeof value === "object") {
							value = value[part];
						}
					}
					// Return as array with single object for Grafana stat panels
					jsonData = [{ value: typeof value === "string" ? parseFloat(value) || value : value }];
				}

				res.json(jsonData);
			} catch (e) {
				// If not valid JSON, return error
				res.status(502).json({ error: "Invalid response from Matomo", details: data.substring(0, 200) });
			}
		});
	});

	proxyReq.on("error", err => {
		res.status(502).json({ error: "Failed to connect to Matomo", details: err.message });
	});

	proxyReq.write(postData);
	proxyReq.end();
};
