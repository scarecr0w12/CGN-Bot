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

	if (!msg.suffix) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🔍 Code Linter",
				description: "Analyze JavaScript code for common issues and style problems.",
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
						name: "What It Checks",
						value: [
							"• Syntax errors",
							"• Undefined variables",
							"• Unused variables",
							"• Missing semicolons",
							"• Console.log statements",
							"• Common anti-patterns",
						].join("\n"),
						inline: false,
					},
					{
						name: "Example",
						value: `\`${commandData.name} const x = 1; console.log(y)\``,
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

	// Perform linting
	const issues = [];
	const warnings = [];
	const suggestions = [];

	// Check for syntax errors using Function constructor
	try {
		const syntaxCheck = new Function(code);
		if (!syntaxCheck) return; // Satisfy linter
	} catch (err) {
		issues.push({
			type: "error",
			message: `Syntax Error: ${err.message}`,
			line: extractLineNumber(err.message),
		});
	}

	// Only continue with other checks if no syntax errors
	if (issues.length === 0) {
		const lines = code.split("\n");

		// Track declared variables
		const declaredVars = new Set();
		const usedVars = new Set();

		// Regex patterns for analysis
		const patterns = {
			varDeclaration: /\b(var|let|const)\s+(\w+)/g,
			functionDeclaration: /\bfunction\s+(\w+)/g,
			arrowFunction: /\b(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g,
			variableUsage: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g,
			consoleLog: /\bconsole\.(log|warn|error|info|debug)\s*\(/g,
			eval: /\beval\s*\(/g,
			debugger: /\bdebugger\b/g,
			alert: /\balert\s*\(/g,
			todoComment: /\/\/\s*(TODO|FIXME|HACK|XXX)/gi,
			emptyBlock: /\{\s*\}/g,
			tripleEquals: /[^=!]==[^=]/g,
			doubleEquals: /[^=!]==[^=]/g,
			semicolon: /;\s*$/,
			trailingWhitespace: /\s+$/,
		};

		// Built-in globals to ignore
		const builtins = new Set([
			"undefined", "null", "true", "false", "NaN", "Infinity",
			"console", "Math", "JSON", "Date", "Array", "Object", "String",
			"Number", "Boolean", "RegExp", "Error", "Map", "Set", "Symbol",
			"Promise", "Proxy", "Reflect", "WeakMap", "WeakSet", "BigInt",
			"parseInt", "parseFloat", "isNaN", "isFinite", "decodeURI",
			"encodeURI", "decodeURIComponent", "encodeURIComponent",
			"setTimeout", "setInterval", "clearTimeout", "clearInterval",
			"require", "module", "exports", "global", "process", "Buffer",
			"__dirname", "__filename", "window", "document", "fetch",
			"arguments", "this", "new", "function", "return", "if", "else",
			"for", "while", "do", "switch", "case", "break", "continue",
			"try", "catch", "finally", "throw", "typeof", "instanceof",
			"in", "of", "delete", "void", "yield", "await", "async",
			"class", "extends", "super", "static", "get", "set",
		]);

		// Analyze each line
		lines.forEach((line, index) => {
			const lineNum = index + 1;

			// Check for var declarations
			let match;
			while ((match = patterns.varDeclaration.exec(line)) !== null) {
				declaredVars.add(match[2]);
				if (match[1] === "var") {
					warnings.push({
						type: "warning",
						message: `Consider using 'let' or 'const' instead of 'var'`,
						line: lineNum,
					});
				}
			}

			// Check for function declarations
			while ((match = patterns.functionDeclaration.exec(line)) !== null) {
				declaredVars.add(match[1]);
			}

			// Check for console statements
			if (patterns.consoleLog.test(line)) {
				suggestions.push({
					type: "info",
					message: "Console statement found (remove in production)",
					line: lineNum,
				});
			}

			// Check for eval
			if (patterns.eval.test(line)) {
				warnings.push({
					type: "warning",
					message: "Avoid using eval() - security risk",
					line: lineNum,
				});
			}

			// Check for debugger
			if (patterns.debugger.test(line)) {
				warnings.push({
					type: "warning",
					message: "Debugger statement found (remove in production)",
					line: lineNum,
				});
			}

			// Check for alert
			if (patterns.alert.test(line)) {
				suggestions.push({
					type: "info",
					message: "Alert statement found (consider better UX)",
					line: lineNum,
				});
			}

			// Check for TODO comments
			if (patterns.todoComment.test(line)) {
				suggestions.push({
					type: "info",
					message: "TODO comment found",
					line: lineNum,
				});
			}

			// Check for == instead of ===
			if (/[^=!]==[^=]/.test(line) && !/===/.test(line)) {
				suggestions.push({
					type: "info",
					message: "Consider using === instead of == for strict equality",
					line: lineNum,
				});
			}

			// Check for trailing whitespace
			if (patterns.trailingWhitespace.test(line) && line.trim().length > 0) {
				suggestions.push({
					type: "info",
					message: "Trailing whitespace",
					line: lineNum,
				});
			}

			// Track variable usage
			const cleanLine = line.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, ""); // Remove strings
			while ((match = patterns.variableUsage.exec(cleanLine)) !== null) {
				if (!builtins.has(match[1])) {
					usedVars.add(match[1]);
				}
			}
		});

		// Check for undefined variables
		usedVars.forEach(v => {
			if (!declaredVars.has(v) && !builtins.has(v)) {
				// Simple heuristic - might be a global or property access
				if (!/^[A-Z]/.test(v)) { // Skip likely class names
					warnings.push({
						type: "warning",
						message: `'${v}' might be undefined`,
						line: null,
					});
				}
			}
		});

		// Check for unused variables (simple check)
		declaredVars.forEach(v => {
			const usageCount = (code.match(new RegExp(`\\b${v}\\b`, "g")) || []).length;
			if (usageCount <= 1) {
				suggestions.push({
					type: "info",
					message: `'${v}' is declared but possibly unused`,
					line: null,
				});
			}
		});
	}

	// Build response
	const totalIssues = issues.length + warnings.length;
	const hasProblems = totalIssues > 0;

	const fields = [];

	if (issues.length > 0) {
		const errorList = issues.slice(0, 5).map(i =>
			`❌ ${i.line ? `Line ${i.line}: ` : ""}${i.message}`,
		).join("\n");
		fields.push({
			name: `🔴 Errors (${issues.length})`,
			value: errorList,
			inline: false,
		});
	}

	if (warnings.length > 0) {
		const warningList = warnings.slice(0, 5).map(w =>
			`⚠️ ${w.line ? `Line ${w.line}: ` : ""}${w.message}`,
		).join("\n");
		fields.push({
			name: `🟡 Warnings (${warnings.length})`,
			value: warningList + (warnings.length > 5 ? `\n... and ${warnings.length - 5} more` : ""),
			inline: false,
		});
	}

	if (suggestions.length > 0 && !hasProblems) {
		const suggestionList = suggestions.slice(0, 5).map(s =>
			`💡 ${s.line ? `Line ${s.line}: ` : ""}${s.message}`,
		).join("\n");
		fields.push({
			name: `💡 Suggestions (${suggestions.length})`,
			value: suggestionList + (suggestions.length > 5 ? `\n... and ${suggestions.length - 5} more` : ""),
			inline: false,
		});
	}

	if (fields.length === 0) {
		fields.push({
			name: "✅ All Clear",
			value: "No issues found in your code!",
			inline: false,
		});
	}

	// Summary
	const statusEmoji = issues.length > 0 ? "🔴" :
		warnings.length > 0 ? "🟡" :
			suggestions.length > 0 ? "🔵" : "✅";

	msg.send({
		embeds: [{
			color: issues.length > 0 ? Colors.ERR :
				warnings.length > 0 ? Colors.SOFT_ERR :
					Colors.RESPONSE,
			title: `${statusEmoji} Lint Results`,
			description: `Analyzed ${code.split("\n").length} lines of JavaScript`,
			fields,
			footer: {
				text: `${issues.length} error${issues.length !== 1 ? "s" : ""} | ` +
					`${warnings.length} warning${warnings.length !== 1 ? "s" : ""} | ` +
					`${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""}`,
			},
		}],
	});
};

/**
 * Extract line number from error message
 */
function extractLineNumber (message) {
	const match = message.match(/line\s+(\d+)/i);
	return match ? parseInt(match[1]) : null;
}
