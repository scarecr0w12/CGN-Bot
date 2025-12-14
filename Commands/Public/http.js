const TierManager = require("../../Modules/TierManager");
const https = require("https");
const http = require("http");
const { URL } = require("url");

// Rate limiting: Map of user IDs to request timestamps
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Blocked hosts/patterns for security
const BLOCKED_PATTERNS = [
	/^localhost$/i,
	/^127\.\d+\.\d+\.\d+$/,
	/^10\.\d+\.\d+\.\d+$/,
	/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
	/^192\.168\.\d+\.\d+$/,
	/^0\.0\.0\.0$/,
	/^::1$/,
	/^fe80:/i,
	/\.local$/i,
	/\.internal$/i,
	/metadata\.google/i,
	/169\.254\.\d+\.\d+$/,
];

module.exports = async ({ client, Constants: { Colors } }, documents, msg, commandData) => {
	// Check tier access (Tier 2 required for developer tools)
	const canAccess = await TierManager.hasMinimumTierLevel(msg.guild.id, 2);
	if (!canAccess) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "🔒 Premium Feature",
				description: "Developer tools require **Tier 2 (Premium)** subscription.",
				footer: { text: "Upgrade your server to access this feature" },
			}],
		});
	}

	// Check rate limit
	const userId = msg.author.id;
	const now = Date.now();
	const userRequests = rateLimits.get(userId) || [];
	const recentRequests = userRequests.filter(t => now - t < RATE_LIMIT_WINDOW);

	if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
		const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - recentRequests[0])) / 1000);
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "⏱️ Rate Limited",
				description: `You've made too many requests. Please wait **${waitTime} seconds**.`,
				footer: { text: `Limit: ${MAX_REQUESTS_PER_WINDOW} requests per minute` },
			}],
		});
	}

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🌐 HTTP Request",
				description: "Make HTTP requests to external APIs.",
				fields: [
					{
						name: "Usage",
						value: [
							`\`${commandData.name} <url>\` - GET request`,
							`\`${commandData.name} GET <url>\` - GET request`,
							`\`${commandData.name} POST <url> | <json body>\` - POST request`,
							`\`${commandData.name} HEAD <url>\` - HEAD request (headers only)`,
						].join("\n"),
						inline: false,
					},
					{
						name: "Examples",
						value: [
							`\`${commandData.name} https://api.github.com/users/octocat\``,
							`\`${commandData.name} POST https://httpbin.org/post | {"test": "data"}\``,
						].join("\n"),
						inline: false,
					},
					{
						name: "Restrictions",
						value: "• Only HTTP/HTTPS URLs\n• No internal/private IPs\n• 10 requests/minute limit\n• 5 second timeout\n• Max 50KB response",
						inline: false,
					},
				],
			}],
		});
	}

	// Parse method and URL
	const args = msg.suffix.split(/\s+/);
	let method = "GET";
	let urlStr;
	let body = null;

	const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
	if (validMethods.includes(args[0].toUpperCase())) {
		method = args[0].toUpperCase();
		args.shift();
	}

	// Check for body separator
	const pipeIndex = msg.suffix.indexOf("|");
	if (pipeIndex !== -1 && ["POST", "PUT", "PATCH"].includes(method)) {
		const beforePipe = msg.suffix.substring(0, pipeIndex).trim();
		const afterPipe = msg.suffix.substring(pipeIndex + 1).trim();

		// Re-parse URL from before pipe
		const beforeArgs = beforePipe.split(/\s+/);
		if (validMethods.includes(beforeArgs[0].toUpperCase())) {
			beforeArgs.shift();
		}
		urlStr = beforeArgs.join(" ");
		body = afterPipe;

		// Try to parse as JSON
		try {
			JSON.parse(body);
		} catch {
			// Not JSON, send as plain text
		}
	} else {
		urlStr = args.join(" ");
	}

	// Validate URL
	let url;
	try {
		url = new URL(urlStr);
	} catch {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "❌ Invalid URL",
				description: "Please provide a valid HTTP or HTTPS URL.",
			}],
		});
	}

	// Check protocol
	if (!["http:", "https:"].includes(url.protocol)) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "❌ Invalid Protocol",
				description: "Only HTTP and HTTPS protocols are supported.",
			}],
		});
	}

	// Check for blocked hosts
	const hostname = url.hostname;
	for (const pattern of BLOCKED_PATTERNS) {
		if (pattern.test(hostname)) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "🚫 Blocked Host",
					description: "Requests to internal/private networks are not allowed.",
				}],
			});
		}
	}

	// Record this request for rate limiting
	recentRequests.push(now);
	rateLimits.set(userId, recentRequests);

	// Send loading message
	const loadingMsg = await msg.send({
		embeds: [{
			color: Colors.INFO,
			title: "🌐 Sending Request...",
			description: `\`${method} ${url.href}\``,
		}],
	});

	// Make request
	const requestModule = url.protocol === "https:" ? https : http;
	const options = {
		method,
		timeout: 5000,
		headers: {
			"User-Agent": "SkynetBot/1.0 (Discord Bot)",
			Accept: "application/json, text/plain, */*",
		},
	};

	if (body && ["POST", "PUT", "PATCH"].includes(method)) {
		options.headers["Content-Type"] = "application/json";
		options.headers["Content-Length"] = Buffer.byteLength(body);
	}

	try {
		const response = await new Promise((resolve, reject) => {
			const req = requestModule.request(url, options, res => {
				const chunks = [];
				let totalSize = 0;
				const maxSize = 50 * 1024; // 50KB

				res.on("data", chunk => {
					totalSize += chunk.length;
					if (totalSize > maxSize) {
						req.destroy();
						reject(new Error("Response too large (max 50KB)"));
						return;
					}
					chunks.push(chunk);
				});

				res.on("end", () => {
					resolve({
						status: res.statusCode,
						statusText: res.statusMessage,
						headers: res.headers,
						body: Buffer.concat(chunks).toString("utf-8"),
					});
				});
			});

			req.on("error", reject);
			req.on("timeout", () => {
				req.destroy();
				reject(new Error("Request timed out (5s)"));
			});

			if (body) {
				req.write(body);
			}
			req.end();
		});

		// Format response
		const statusEmoji = response.status >= 200 && response.status < 300 ? "✅" :
			response.status >= 300 && response.status < 400 ? "↪️" :
				response.status >= 400 && response.status < 500 ? "⚠️" : "❌";

		// Try to format body as JSON
		let formattedBody = response.body;
		let isJson = false;
		try {
			const parsed = JSON.parse(response.body);
			formattedBody = JSON.stringify(parsed, null, 2);
			isJson = true;
		} catch {
			// Not JSON, keep as-is
		}

		// Truncate if too long
		const maxBodyLength = 1500;
		let truncated = false;
		if (formattedBody.length > maxBodyLength) {
			formattedBody = `${formattedBody.substring(0, maxBodyLength)}...`;
			truncated = true;
		}

		// Select important headers
		const importantHeaders = ["content-type", "content-length", "date", "server", "x-ratelimit-remaining"];
		const headerLines = Object.entries(response.headers)
			.filter(([key]) => importantHeaders.includes(key.toLowerCase()))
			.map(([key, value]) => `${key}: ${value}`)
			.slice(0, 5);

		const fields = [
			{ name: "Status", value: `${statusEmoji} ${response.status} ${response.statusText}`, inline: true },
			{ name: "Size", value: `${response.body.length} bytes`, inline: true },
		];

		if (headerLines.length > 0) {
			fields.push({ name: "Headers", value: `\`\`\`\n${headerLines.join("\n")}\n\`\`\``, inline: false });
		}

		if (method !== "HEAD" && formattedBody) {
			fields.push({
				name: `Response${truncated ? " (truncated)" : ""}`,
				value: `\`\`\`${isJson ? "json" : ""}\n${formattedBody}\n\`\`\``,
				inline: false,
			});
		}

		loadingMsg.edit({
			embeds: [{
				color: response.status >= 200 && response.status < 400 ? Colors.RESPONSE : Colors.SOFT_ERR,
				title: `🌐 ${method} ${url.hostname}${url.pathname}`,
				fields,
				footer: { text: `Response time: ${Date.now() - now}ms` },
			}],
		});
	} catch (err) {
		loadingMsg.edit({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Request Failed",
				description: err.message,
				footer: { text: `${method} ${url.href}` },
			}],
		});
	}
};
