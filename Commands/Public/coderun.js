const TierManager = require("../../Modules/TierManager");
const vm = require("vm");

// Rate limiting for code execution
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_EXECUTIONS_PER_WINDOW = 5;

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
	const userExecutions = rateLimits.get(userId) || [];
	const recentExecutions = userExecutions.filter(t => now - t < RATE_LIMIT_WINDOW);

	if (recentExecutions.length >= MAX_EXECUTIONS_PER_WINDOW) {
		const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - recentExecutions[0])) / 1000);
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "⏱️ Rate Limited",
				description: `You've run too many code executions. Please wait **${waitTime} seconds**.`,
				footer: { text: `Limit: ${MAX_EXECUTIONS_PER_WINDOW} executions per minute` },
			}],
		});
	}

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "▶️ Code Runner",
				description: "Execute JavaScript code in a sandboxed environment.",
				fields: [
					{
						name: "Usage",
						value: [
							`\`${commandData.name} <code>\``,
							`\`${commandData.name} \\\`\\\`\\\`js\\n<code>\\n\\\`\\\`\\\`\``,
						].join("\n"),
						inline: false,
					},
					{
						name: "Available APIs",
						value: "`console.log()`, `Math`, `JSON`, `Date`, `Array`, `Object`, `String`, `Number`, `RegExp`, `Map`, `Set`",
						inline: false,
					},
					{
						name: "Restrictions",
						value: "• JavaScript only\n• 3 second timeout\n• No file/network access\n• No require/import\n• 5 executions/minute",
						inline: false,
					},
					{
						name: "Example",
						value: `\`${commandData.name} [1,2,3].map(x => x * 2)\``,
						inline: false,
					},
				],
			}],
		});
	}

	// Extract code from code blocks
	let code = msg.suffix;
	const codeBlockMatch = code.match(/```(?:js|javascript)?\s*([\s\S]*?)```/);
	if (codeBlockMatch) {
		code = codeBlockMatch[1].trim();
	}

	// Record this execution for rate limiting
	recentExecutions.push(now);
	rateLimits.set(userId, recentExecutions);

	// Create sandboxed context
	const logs = [];
	const errors = [];
	const maxLogLength = 500;
	const maxLogs = 20;

	const sandbox = {
		console: {
			log: (...args) => {
				if (logs.length < maxLogs) {
					const output = args.map(a => formatValue(a)).join(" ");
					logs.push(output.substring(0, maxLogLength));
				}
			},
			error: (...args) => {
				if (errors.length < maxLogs) {
					const output = args.map(a => formatValue(a)).join(" ");
					errors.push(output.substring(0, maxLogLength));
				}
			},
			warn: (...args) => {
				if (logs.length < maxLogs) {
					const output = `⚠️ ${args.map(a => formatValue(a)).join(" ")}`;
					logs.push(output.substring(0, maxLogLength));
				}
			},
			info: (...args) => {
				if (logs.length < maxLogs) {
					const output = `ℹ️ ${args.map(a => formatValue(a)).join(" ")}`;
					logs.push(output.substring(0, maxLogLength));
				}
			},
		},
		Math,
		JSON,
		Date,
		Array,
		Object,
		String,
		Number,
		Boolean,
		RegExp,
		Map,
		Set,
		parseInt,
		parseFloat,
		isNaN,
		isFinite,
		encodeURI,
		decodeURI,
		encodeURIComponent,
		decodeURIComponent,
		// Safe utility functions
		setTimeout: undefined,
		setInterval: undefined,
		setImmediate: undefined,
		clearTimeout: undefined,
		clearInterval: undefined,
		clearImmediate: undefined,
		process: undefined,
		require: undefined,
		module: undefined,
		exports: undefined,
		global: undefined,
		globalThis: undefined,
		Buffer: undefined,
		__dirname: undefined,
		__filename: undefined,
	};

	const context = vm.createContext(sandbox);

	// Execute code with timeout
	const startTime = Date.now();
	let result;
	let executionError = null;

	try {
		const script = new vm.Script(code, {
			filename: "user-code.js",
			timeout: 3000, // 3 second timeout
		});

		result = script.runInContext(context, {
			timeout: 3000,
			breakOnSigint: true,
		});
	} catch (err) {
		executionError = err;
	}

	const executionTime = Date.now() - startTime;

	// Format result
	const fields = [];

	if (logs.length > 0) {
		const logOutput = logs.join("\n");
		fields.push({
			name: "📝 Console Output",
			value: `\`\`\`\n${logOutput.substring(0, 900)}${logOutput.length > 900 ? "\n..." : ""}\n\`\`\``,
			inline: false,
		});
	}

	if (errors.length > 0) {
		const errorOutput = errors.join("\n");
		fields.push({
			name: "⚠️ Console Errors",
			value: `\`\`\`\n${errorOutput.substring(0, 500)}\n\`\`\``,
			inline: false,
		});
	}

	if (executionError) {
		let errorMessage = executionError.message || String(executionError);

		// Clean up error message
		if (executionError.name === "SyntaxError") {
			errorMessage = `SyntaxError: ${errorMessage}`;
		} else if (errorMessage.includes("Script execution timed out")) {
			errorMessage = "⏰ Execution timed out (3 second limit)";
		}

		return msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "❌ Execution Error",
				description: `\`\`\`\n${errorMessage.substring(0, 1000)}\n\`\`\``,
				fields: fields.length > 0 ? fields : undefined,
				footer: { text: `Execution time: ${executionTime}ms` },
			}],
		});
	}

	// Format return value
	const formattedResult = formatValue(result);
	const truncatedResult = formattedResult.length > 1500 ?
		`${formattedResult.substring(0, 1500)}...` :
		formattedResult;

	if (result !== undefined) {
		fields.unshift({
			name: "📤 Return Value",
			value: `\`\`\`js\n${truncatedResult}\n\`\`\``,
			inline: false,
		});
	}

	if (fields.length === 0) {
		fields.push({
			name: "Result",
			value: "`undefined` (no output)",
			inline: false,
		});
	}

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "▶️ Code Executed",
			fields,
			footer: { text: `Execution time: ${executionTime}ms | JavaScript (Node.js sandbox)` },
		}],
	});
};

/**
 * Format a value for display
 */
function formatValue (value) {
	if (value === undefined) return "undefined";
	if (value === null) return "null";
	if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
	if (typeof value === "symbol") return value.toString();
	if (typeof value === "bigint") return `${value}n`;

	if (Array.isArray(value)) {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return `[Array(${value.length})]`;
		}
	}

	if (typeof value === "object") {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return `[Object ${value.constructor?.name || "Object"}]`;
		}
	}

	return String(value);
}
