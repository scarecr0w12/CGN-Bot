const TierManager = require("../../Modules/TierManager");
const crypto = require("crypto");

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

	const Snippets = client.database.Snippets;

	if (!msg.suffix) {
		// List user's snippets
		const snippets = await Snippets.find({ user_id: msg.author.id, server_id: msg.guild.id }).limit(25).exec();

		if (!snippets || snippets.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "📋 Code Snippets",
					description: "You don't have any saved snippets yet.",
					fields: [
						{
							name: "Usage",
							value: [
								`\`${commandData.name} save <name> | <code>\` - Save a snippet`,
								`\`${commandData.name} <name>\` - Retrieve a snippet`,
								`\`${commandData.name} list\` - List your snippets`,
								`\`${commandData.name} delete <name>\` - Delete a snippet`,
								`\`${commandData.name} public <name>\` - Toggle public visibility`,
							].join("\n"),
							inline: false,
						},
					],
				}],
			});
		}

		const snippetList = snippets.map((s, i) =>
			`${i + 1}. **${s.name}** (\`${s.language}\`) ${s.is_public ? "🌐" : "🔒"}`,
		).join("\n");

		return msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "📋 Your Snippets",
				description: snippetList,
				footer: { text: `${snippets.length} snippet${snippets.length !== 1 ? "s" : ""} | Use ${commandData.name} <name> to view` },
			}],
		});
	}

	const args = msg.suffix.split(/\s+/);
	const action = args[0].toLowerCase();

	// Save snippet
	if (action === "save" || action === "add" || action === "create") {
		const rest = args.slice(1).join(" ");
		const pipeIndex = rest.indexOf("|");

		if (pipeIndex === -1) {
			return msg.sendInvalidUsage(commandData, "Please separate name and code with `|`", `Example: \`${commandData.name} save mysnippet | console.log("hello")\``);
		}

		let name = rest.substring(0, pipeIndex).trim().toLowerCase();
		let code = rest.substring(pipeIndex + 1).trim();

		// Parse optional language from name (name:lang)
		let language = "txt";
		if (name.includes(":")) {
			const parts = name.split(":");
			name = parts[0].trim();
			language = parts[1].trim();
		}

		if (!name || name.length > 32) {
			return msg.sendInvalidUsage(commandData, "Snippet name must be 1-32 characters.");
		}

		if (!code) {
			return msg.sendInvalidUsage(commandData, "No code provided.");
		}

		// Extract from code block if present
		const codeBlockMatch = code.match(/```(\w+)?\s*([\s\S]*?)```/);
		if (codeBlockMatch) {
			if (codeBlockMatch[1]) language = codeBlockMatch[1];
			code = codeBlockMatch[2];
		}

		// Check if snippet exists
		const existing = await Snippets.findOne({ user_id: msg.author.id, server_id: msg.guild.id, name });

		if (existing) {
			// Update existing
			existing.query.set("code", code);
			existing.query.set("language", language);
			existing.query.set("updated_at", new Date());
			await existing.save();

			return msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: "✏️ Snippet Updated",
					description: `Updated snippet **${name}**`,
					fields: [
						{ name: "Language", value: `\`${language}\``, inline: true },
						{ name: "Size", value: `${code.length} chars`, inline: true },
					],
				}],
			});
		}

		// Check snippet limit (max 50 per user per server)
		const count = await Snippets.find({ user_id: msg.author.id, server_id: msg.guild.id }).exec();
		if (count && count.length >= 50) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "❌ Limit Reached",
					description: "You've reached the maximum of 50 snippets per server.",
				}],
			});
		}

		// Create new snippet
		const snippet = Snippets.new({
			_id: crypto.randomBytes(8).toString("hex"),
			user_id: msg.author.id,
			server_id: msg.guild.id,
			name,
			language,
			code,
			created_at: new Date(),
			updated_at: new Date(),
		});
		await snippet.save();

		return msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "💾 Snippet Saved",
				description: `Saved snippet **${name}**`,
				fields: [
					{ name: "Language", value: `\`${language}\``, inline: true },
					{ name: "Size", value: `${code.length} chars`, inline: true },
				],
				footer: { text: `Retrieve with: ${commandData.name} ${name}` },
			}],
		});
	}

	// Delete snippet
	if (action === "delete" || action === "remove" || action === "del") {
		const name = args.slice(1).join(" ").toLowerCase();

		if (!name) {
			return msg.sendInvalidUsage(commandData, "Please provide a snippet name to delete.");
		}

		const snippet = await Snippets.findOne({ user_id: msg.author.id, server_id: msg.guild.id, name });

		if (!snippet) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "❌ Not Found",
					description: `No snippet named **${name}** found.`,
				}],
			});
		}

		await Snippets.delete({ _id: snippet._id });

		return msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "🗑️ Snippet Deleted",
				description: `Deleted snippet **${name}**`,
			}],
		});
	}

	// Toggle public visibility
	if (action === "public" || action === "share") {
		const name = args.slice(1).join(" ").toLowerCase();

		if (!name) {
			return msg.sendInvalidUsage(commandData, "Please provide a snippet name.");
		}

		const snippet = await Snippets.findOne({ user_id: msg.author.id, server_id: msg.guild.id, name });

		if (!snippet) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "❌ Not Found",
					description: `No snippet named **${name}** found.`,
				}],
			});
		}

		const newPublic = !snippet.is_public;
		snippet.query.set("is_public", newPublic);
		await snippet.save();

		return msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: newPublic ? "🌐 Snippet Public" : "🔒 Snippet Private",
				description: `**${name}** is now ${newPublic ? "public - anyone in this server can view it" : "private - only you can view it"}`,
			}],
		});
	}

	// List snippets
	if (action === "list" || action === "ls") {
		const snippets = await Snippets.find({ user_id: msg.author.id, server_id: msg.guild.id }).limit(50).exec();

		if (!snippets || snippets.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "📋 Your Snippets",
					description: "You don't have any saved snippets.",
				}],
			});
		}

		const snippetList = snippets.map((s, i) =>
			`${i + 1}. **${s.name}** (\`${s.language}\`) ${s.is_public ? "🌐" : "🔒"} - ${s.code.length} chars`,
		).join("\n");

		return msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "📋 Your Snippets",
				description: snippetList,
				footer: { text: `${snippets.length} snippet${snippets.length !== 1 ? "s" : ""}` },
			}],
		});
	}

	// Retrieve snippet by name
	const name = msg.suffix.toLowerCase();
	let snippet = await Snippets.findOne({ user_id: msg.author.id, server_id: msg.guild.id, name });

	// If not found, check public snippets
	if (!snippet) {
		snippet = await Snippets.findOne({ server_id: msg.guild.id, name, is_public: true });
	}

	if (!snippet) {
		return msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "❌ Not Found",
				description: `No snippet named **${name}** found.`,
				footer: { text: `Use ${commandData.name} save ${name} | <code> to create it` },
			}],
		});
	}

	// Display snippet
	const code = snippet.code;

	if (code.length > 1900) {
		const buffer = Buffer.from(code, "utf-8");
		const ext = snippet.language === "txt" ? "txt" : snippet.language;
		return msg.send({
			content: `📋 Snippet **${snippet.name}** (\`${snippet.language}\`):`,
			files: [{
				attachment: buffer,
				name: `${snippet.name}.${ext}`,
			}],
		});
	}

	msg.send({
		embeds: [{
			color: Colors.RESPONSE,
			title: `📋 ${snippet.name}`,
			description: `\`\`\`${snippet.language}\n${code}\n\`\`\``,
			fields: [
				{ name: "Language", value: `\`${snippet.language}\``, inline: true },
				{ name: "Size", value: `${code.length} chars`, inline: true },
				{ name: "Visibility", value: snippet.is_public ? "🌐 Public" : "🔒 Private", inline: true },
			],
			footer: { text: `Created by ${snippet.user_id === msg.author.id ? "you" : "another user"}` },
		}],
	});
};
