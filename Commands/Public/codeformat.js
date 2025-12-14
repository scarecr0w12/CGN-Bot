const TierManager = require("../../Modules/TierManager");

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

	// Supported languages for syntax highlighting
	const supportedLanguages = [
		"js", "javascript", "ts", "typescript", "py", "python",
		"java", "c", "cpp", "cs", "csharp", "go", "rust", "rb", "ruby",
		"php", "swift", "kotlin", "scala", "html", "css", "scss", "sass",
		"json", "xml", "yaml", "yml", "sql", "bash", "sh", "shell",
		"md", "markdown", "diff", "lua", "perl", "r", "matlab",
	];

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "📝 Code Formatter",
				description: "Format and highlight code snippets.",
				fields: [
					{
						name: "Usage",
						value: [
							`\`${commandData.name} <language>\``,
							"Then paste your code in the next message",
							"",
							`Or: \`${commandData.name} <language> | <code>\``,
						].join("\n"),
						inline: false,
					},
					{
						name: "Supported Languages",
						value: `${supportedLanguages.slice(0, 20).map(l => `\`${l}\``).join(", ")}...`,
						inline: false,
					},
					{
						name: "Example",
						value: `\`${commandData.name} js | const x = 1;\``,
						inline: false,
					},
				],
			}],
		});
	}

	// Check if code is inline with pipe separator
	const pipeIndex = msg.suffix.indexOf("|");

	let language;
	let code;

	if (pipeIndex !== -1) {
		language = msg.suffix.substring(0, pipeIndex).trim().toLowerCase();
		code = msg.suffix.substring(pipeIndex + 1).trim();
	} else {
		// Check if entire suffix is just language - await next message
		const potentialLang = msg.suffix.trim().toLowerCase();
		if (supportedLanguages.includes(potentialLang) || potentialLang.length <= 10) {
			language = potentialLang;

			// Ask for code
			await msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "📝 Paste Your Code",
					description: `Language: \`${language}\`\n\nSend your code in the next message (within 60 seconds).`,
				}],
			});

			// Wait for follow-up message
			try {
				const filter = m => m.author.id === msg.author.id && m.channel.id === msg.channel.id;
				const collected = await msg.channel.awaitMessages({
					filter,
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const response = collected.first();
				code = response.content;

				// Extract from code block if present
				const codeBlockMatch = code.match(/```(?:\w+)?\s*([\s\S]*?)```/);
				if (codeBlockMatch) {
					code = codeBlockMatch[1];
				}
			} catch {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						title: "⏰ Timed Out",
						description: "No code received within 60 seconds.",
					}],
				});
			}
		} else {
			// Assume suffix is code, try to detect language
			code = msg.suffix;

			// Extract from code block if present
			const codeBlockMatch = code.match(/```(\w+)?\s*([\s\S]*?)```/);
			if (codeBlockMatch) {
				language = codeBlockMatch[1] || "txt";
				code = codeBlockMatch[2];
			} else {
				language = detectLanguage(code);
			}
		}
	}

	// Normalize language aliases
	const languageAliases = {
		js: "javascript",
		ts: "typescript",
		py: "python",
		rb: "ruby",
		cs: "csharp",
		sh: "bash",
		shell: "bash",
		yml: "yaml",
		md: "markdown",
	};
	const normalizedLang = languageAliases[language] || language;

	// Clean up code
	code = code.trim();

	if (!code) {
		return msg.sendInvalidUsage(commandData, "No code provided.", "Please provide code to format.");
	}

	// Format output
	const lines = code.split("\n");
	const lineCount = lines.length;
	const charCount = code.length;

	// Add line numbers
	const maxLineNumWidth = String(lineCount).length;
	const numberedCode = lines.map((line, i) => {
		const lineNum = String(i + 1).padStart(maxLineNumWidth, " ");
		return `${lineNum} │ ${line}`;
	}).join("\n");

	// Check length
	if (numberedCode.length > 1900) {
		// Send as file
		const buffer = Buffer.from(code, "utf-8");
		const extension = getFileExtension(normalizedLang);
		return msg.send({
			content: `📝 Code formatted (${lineCount} lines, ${charCount} chars):`,
			files: [{
				attachment: buffer,
				name: `code.${extension}`,
			}],
		});
	}

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: "📝 Formatted Code",
			description: `\`\`\`${normalizedLang}\n${code}\n\`\`\``,
			fields: [
				{ name: "Language", value: `\`${normalizedLang}\``, inline: true },
				{ name: "Lines", value: `${lineCount}`, inline: true },
				{ name: "Characters", value: `${charCount}`, inline: true },
			],
		}],
	});
};

// Simple language detection heuristics
function detectLanguage (code) {
	const patterns = [
		{ lang: "javascript", patterns: [/\bconst\b/, /\blet\b/, /\b=>\b/, /\bconsole\.log\b/] },
		{ lang: "typescript", patterns: [/:\s*(string|number|boolean|any)\b/, /interface\s+\w+/] },
		{ lang: "python", patterns: [/\bdef\s+\w+\(/, /\bimport\s+\w+/, /:\s*$/, /\bprint\s*\(/] },
		{ lang: "java", patterns: [/\bpublic\s+(static\s+)?class\b/, /\bSystem\.out\./] },
		{ lang: "html", patterns: [/<\/?[a-z][\s\S]*>/i, /<!DOCTYPE/i] },
		{ lang: "css", patterns: [/[.#][\w-]+\s*\{/, /@media\s*\(/, /:\s*[\w-]+;/] },
		{ lang: "sql", patterns: [/\bSELECT\b/i, /\bFROM\b/i, /\bWHERE\b/i, /\bINSERT\b/i] },
		{ lang: "json", patterns: [/^\s*[[{]/, /"\w+":\s*["\d[{]/] },
		{ lang: "bash", patterns: [/^#!/, /\$\(/, /\becho\b/, /\bif\s+\[\s*/] },
		{ lang: "rust", patterns: [/\bfn\s+\w+/, /\blet\s+mut\b/, /\b->\s*\w+/] },
		{ lang: "go", patterns: [/\bfunc\s+\w+/, /\bpackage\s+\w+/, /\bimport\s+"/] },
		{ lang: "ruby", patterns: [/\bdef\s+\w+/, /\bend\b/, /\bputs\b/, /\brequire\b/] },
		{ lang: "php", patterns: [/<\?php/, /\$\w+\s*=/, /\becho\b/] },
	];

	for (const { lang, patterns: langPatterns } of patterns) {
		const matches = langPatterns.filter(p => p.test(code)).length;
		if (matches >= 2) return lang;
	}

	return "txt";
}

function getFileExtension (lang) {
	const extensions = {
		javascript: "js",
		typescript: "ts",
		python: "py",
		ruby: "rb",
		csharp: "cs",
		bash: "sh",
		markdown: "md",
	};
	return extensions[lang] || lang;
}
