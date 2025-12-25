/**
 * ServerTemplates - Pre-configured setup templates for new servers
 * Allows one-click setup of common server configurations
 */

// Template definitions with their configurations
const TEMPLATES = {
	gaming: {
		id: "gaming",
		name: "Gaming Server",
		description: "Perfect for gaming communities. Includes music, game stats tracking, and LFG features.",
		icon: "fa-gamepad",
		color: "#9b59b6",
		config: {
			// Enable game activity tracking
			moderation: {
				status_messages: {
					member_game_updated_message: {
						isEnabled: true,
					},
				},
			},
			// Enable tag reaction for fun interactions
			tag_reaction: {
				isEnabled: true,
			},
		},
		// Extensions to auto-install (by slug or ID)
		extensions: [
			// These would be extension IDs from the gallery
			// "music-player",
			// "game-stats",
			// "lfg-system",
		],
		// Commands to enable by default
		commands: {
			play: { isEnabled: true },
			queue: { isEnabled: true },
			skip: { isEnabled: true },
			"8ball": { isEnabled: true },
			roll: { isEnabled: true },
		},
	},

	support: {
		id: "support",
		name: "Support Server",
		description: "Ideal for customer support and help desks. Includes ticket system and moderation logging.",
		icon: "fa-headset",
		color: "#3498db",
		config: {
			// Enable moderation features
			moderation: {
				isEnabled: true,
				filters: {
					spam_filter: {
						isEnabled: true,
						action: "mute",
					},
					mention_filter: {
						isEnabled: true,
						action: "block",
					},
				},
				status_messages: {
					new_member_message: {
						isEnabled: true,
					},
					member_removed_message: {
						isEnabled: true,
					},
				},
			},
		},
		extensions: [
			// "ticket-system",
			// "auto-mod",
		],
		commands: {
			warn: { isEnabled: true },
			mute: { isEnabled: true },
			kick: { isEnabled: true },
			ban: { isEnabled: true },
			modlog: { isEnabled: true },
		},
	},

	community: {
		id: "community",
		name: "Community Server",
		description: "Great for general communities. Includes leveling, welcome messages, and social features.",
		icon: "fa-users",
		color: "#2ecc71",
		config: {
			moderation: {
				status_messages: {
					new_member_message: {
						isEnabled: true,
					},
					member_rank_updated_message: {
						isEnabled: true,
					},
				},
			},
			// Enable public listing
			public_data: {
				isShown: true,
				server_listing: {
					isEnabled: true,
				},
			},
		},
		extensions: [],
		commands: {
			rank: { isEnabled: true },
			profile: { isEnabled: true },
			leaderboard: { isEnabled: true },
			poll: { isEnabled: true },
		},
	},

	crypto: {
		id: "crypto",
		name: "Crypto/Finance",
		description: "For cryptocurrency and finance communities. Includes price tickers and alerts.",
		icon: "fa-bitcoin",
		color: "#f39c12",
		config: {
			// Basic config
			moderation: {
				isEnabled: true,
				filters: {
					spam_filter: {
						isEnabled: true,
					},
				},
			},
		},
		extensions: [
			// "crypto-ticker",
			// "price-alerts",
		],
		commands: {
			crypto: { isEnabled: true },
		},
	},

	minimal: {
		id: "minimal",
		name: "Minimal Setup",
		description: "Clean slate with just the essentials. Configure everything yourself.",
		icon: "fa-feather",
		color: "#95a5a6",
		config: {},
		extensions: [],
		commands: {},
	},
};

const ServerTemplates = module.exports;

/**
 * Get all available templates
 * @returns {Array} List of template summaries
 */
ServerTemplates.getTemplates = () => Object.values(TEMPLATES).map(t => ({
	id: t.id,
	name: t.name,
	description: t.description,
	icon: t.icon,
	color: t.color,
}));

/**
 * Get a specific template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
ServerTemplates.getTemplate = templateId => TEMPLATES[templateId] || null;

/**
 * Apply a template to a server document
 * @param {Object} serverDocument - The server document to configure
 * @param {string} templateId - Template ID to apply
 * @param {Object} client - Discord client for extension installation
 * @returns {Object} The modified server document
 */
ServerTemplates.applyTemplate = async (serverDocument, templateId, client) => {
	const template = TEMPLATES[templateId];
	if (!template) {
		logger.warn("Invalid template ID", { templateId });
		return serverDocument;
	}

	logger.info("Applying server template", { svrid: serverDocument._id, templateId });

	const serverConfigQuery = serverDocument.query.prop("config");

	// Apply configuration settings
	if (template.config) {
		applyConfigRecursively(serverConfigQuery, template.config, "");
	}

	// Enable/configure commands
	if (template.commands) {
		for (const [cmdName, cmdConfig] of Object.entries(template.commands)) {
			if (serverDocument.config.commands?.[cmdName]) {
				for (const [key, value] of Object.entries(cmdConfig)) {
					serverConfigQuery.set(`commands.${cmdName}.${key}`, value);
				}
			}
		}
	}

	// Install extensions (if any are specified and available)
	if (template.extensions && template.extensions.length > 0 && client) {
		for (const extId of template.extensions) {
			try {
				// Find extension in gallery
				const extDoc = await Gallery.findOne({
					$or: [
						{ _id: extId },
						{ slug: extId },
					],
					state: "gallery",
				});

				if (extDoc && !serverDocument.extensions?.find(e => e._id === extDoc._id.toString())) {
					// Add extension to server
					const versionDoc = extDoc.versions.id(extDoc.published_version);
					if (versionDoc) {
						serverDocument.query.push("extensions", {
							_id: extDoc._id.toString(),
							version: extDoc.published_version,
							admin_level: 0,
						});
						logger.debug("Auto-installed extension from template", {
							svrid: serverDocument._id,
							extId: extDoc._id,
							extName: extDoc.name,
						});
					}
				}
			} catch (err) {
				logger.debug("Failed to auto-install template extension", { extId }, err);
			}
		}
	}

	// Store which template was applied
	serverConfigQuery.set("applied_template", templateId);

	return serverDocument;
};

/**
 * Recursively apply config object to server document
 */
function applyConfigRecursively (query, config, path) {
	for (const [key, value] of Object.entries(config)) {
		const fullPath = path ? `${path}.${key}` : key;
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			applyConfigRecursively(query, value, fullPath);
		} else {
			query.set(fullPath, value);
		}
	}
}

/**
 * Check if a template is valid
 * @param {string} templateId - Template ID
 * @returns {boolean} True if valid
 */
ServerTemplates.isValidTemplate = templateId => !!TEMPLATES[templateId];
