/**
 * Matomo Tag Manager Proxy
 *
 * Proxies requests from the Matomo Tag Manager container script
 * to the actual Matomo server. This allows the container to load
 * its assets through the bot's domain.
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

module.exports = async (req, res) => {
	const matomoUrl = process.env.MATOMO_URL;

	if (!matomoUrl) {
		return res.status(404).send("Not Found");
	}

	// Build the target URL with all query parameters
	const queryString = new URLSearchParams(req.query).toString();

	let parsedUrl;
	try {
		const baseUrl = matomoUrl.endsWith("/") ? matomoUrl.slice(0, -1) : matomoUrl;
		parsedUrl = new URL(`${baseUrl}/index.php?${queryString}`);
	} catch (e) {
		return res.status(500).send("Invalid Matomo URL configuration");
	}

	const isHttps = parsedUrl.protocol === "https:";
	const httpModule = isHttps ? https : http;

	const options = {
		hostname: parsedUrl.hostname,
		port: parsedUrl.port || (isHttps ? 443 : 80),
		path: `${parsedUrl.pathname}${parsedUrl.search}`,
		method: "GET",
		headers: {
			"User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
			Accept: req.headers.accept || "*/*",
			"Accept-Encoding": "identity",
		},
	};

	const proxyReq = httpModule.request(options, proxyRes => {
		// Forward content type and other relevant headers
		const contentType = proxyRes.headers["content-type"];
		if (contentType) {
			res.setHeader("Content-Type", contentType);
		}

		// Set CORS headers
		res.setHeader("Access-Control-Allow-Origin", "*");

		// Set caching headers for static assets
		if (req.query.module === "Proxy") {
			res.setHeader("Cache-Control", "public, max-age=3600");
		}

		// Pipe the response
		proxyRes.pipe(res);
	});

	proxyReq.on("error", err => {
		logger.warn("Matomo Tag Manager proxy error", { error: err.message });
		res.status(502).send("Proxy Error");
	});

	proxyReq.end();
};
