const Schema = require("../Schema");

// Site-wide settings stored in MongoDB
// This schema contains ALL runtime-configurable settings (migrated from config.json)
module.exports = new Schema({
	_id: {
		type: String,
		default: "main",
	},

	// ============================================
	// MAINTAINER & ACCESS CONTROL (migrated from config.json)
	// ============================================

	// Sudo maintainers have highest privileges (level 2)
	sudoMaintainers: {
		type: Array,
		default: [],
	},
	// Regular maintainers (level 1)
	maintainers: {
		type: Array,
		default: [],
	},
	// Wiki contributors can edit wiki pages
	wikiContributors: {
		type: Array,
		default: [],
	},

	// ============================================
	// BLOCKLISTS (migrated from config.json)
	// ============================================

	// Globally blocked users - cannot use bot commands
	userBlocklist: {
		type: Array,
		default: [],
	},
	// Blocked guilds - bot will leave if added
	guildBlocklist: {
		type: Array,
		default: [],
	},
	// Servers excluded from activity rankings
	activityBlocklist: {
		type: Array,
		default: [],
	},

	// ============================================
	// BOT PRESENCE (migrated from config.json)
	// ============================================

	// Bot status: online, idle, dnd, invisible
	botStatus: {
		type: String,
		default: "online",
		enum: ["online", "idle", "dnd", "invisible"],
	},
	// Bot activity settings
	botActivity: new Schema({
		name: {
			type: String,
			default: "default",
		},
		type: {
			type: String,
			default: "PLAYING",
			enum: ["PLAYING", "STREAMING", "LISTENING", "WATCHING", "COMPETING"],
		},
		twitchURL: {
			type: String,
			default: "",
		},
	}),

	// ============================================
	// PERMISSION LEVELS (migrated from config.json)
	// Levels: 0 = Host only, 1 = All maintainers, 2 = Sudo maintainers only
	// ============================================

	perms: new Schema({
		eval: {
			type: Number,
			default: 0,
			min: 0,
			max: 2,
		},
		sudo: {
			type: Number,
			default: 2,
			min: 0,
			max: 2,
		},
		management: {
			type: Number,
			default: 2,
			min: 0,
			max: 2,
		},
		administration: {
			type: Number,
			default: 1,
			min: 0,
			max: 2,
		},
		shutdown: {
			type: Number,
			default: 2,
			min: 0,
			max: 2,
		},
	}),

	// ============================================
	// MISCELLANEOUS BOT SETTINGS (migrated from config.json)
	// ============================================

	// Forward DMs to maintainers
	pmForward: {
		type: Boolean,
		default: false,
	},

	// ============================================
	// WEBSITE CUSTOMIZATION
	// ============================================

	donateSubtitle: {
		type: String,
		default: "",
	},
	charities: [new Schema({
		name: {
			type: String,
			required: true,
		},
		country: {
			type: String,
			default: "",
		},
		donate_url: {
			type: String,
			required: true,
		},
		icon_url: {
			type: String,
			required: true,
		},
	})],
	vote_sites: [new Schema({
		name: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		icon_url: {
			type: String,
			default: "",
		},
	})],
	homepageMessageHTML: {
		type: String,
		default: "",
	},
	headerImage: {
		type: String,
		default: "header.png",
	},
	injection: new Schema({
		headScript: {
			type: String,
			default: "",
		},
		footerHTML: {
			type: String,
			default: "",
		},
	}),

	// ============================================
	// TIERED MEMBERSHIP SYSTEM
	// ============================================

	// Feature Registry - all gateable features in the system
	features: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		description: String,
		category: {
			type: String,
			default: "general",
		},
		isEnabled: {
			type: Boolean,
			default: true,
		},
	})],

	// Dynamic Tiers - configurable from maintainer console
	tiers: [new Schema({
		_id: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		level: {
			type: Number,
			default: 0,
		},
		description: String,
		features: [String],
		badge_icon: String,
		color: String,
		price_monthly: Number,
		price_yearly: Number,
		yearly_discount: {
			type: Number,
			default: 0,
		},
		is_purchasable: {
			type: Boolean,
			default: false,
		},
		is_default: {
			type: Boolean,
			default: false,
		},
	})],

	// OAuth Provider Configuration
	oauth_providers: new Schema({
		google: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
		}),
		github: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
		}),
		twitch: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
		}),
		patreon: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
			tier_mapping: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				local_tier_id: {
					type: String,
					required: true,
				},
			})],
		}),
	}),

	// ============================================
	// BOT LIST INTEGRATIONS
	// ============================================

	bot_lists: new Schema({
		topgg: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			webhook_secret: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
		}),
		discordbotlist: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			webhook_secret: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
			sync_commands: {
				type: Boolean,
				default: false,
			},
		}),
		discordbotsgg: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
		}),
		discordlistgg: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
		}),
		botsondiscord: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
		}),
		topbotlist: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			api_token: String,
			webhook_secret: String,
			auto_post_stats: {
				type: Boolean,
				default: true,
			},
			sync_commands: {
				type: Boolean,
				default: false,
			},
		}),
	}),

	// Vote reward settings
	vote_rewards: new Schema({
		isEnabled: {
			type: Boolean,
			default: false,
		},
		points_per_vote: {
			type: Number,
			default: 100,
		},
		weekend_multiplier: {
			type: Number,
			default: 2,
		},
		notification_channel_id: String,
		// Point redemption settings
		redemption: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			points_per_dollar: {
				type: Number,
				default: 1000, // 1000 points = $1
			},
			redeemable_tier_id: String, // Which tier can be purchased with points
			min_redemption_days: {
				type: Number,
				default: 7, // Minimum days to redeem at once
			},
			max_redemption_days: {
				type: Number,
				default: 365, // Maximum days per redemption
			},
		}),
		// Point purchase settings (buy points with money)
		purchase: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			min_purchase_amount: {
				type: Number,
				default: 5, // Minimum $5
			},
			max_purchase_amount: {
				type: Number,
				default: 100, // Maximum $100
			},
			// Point packages for quick purchase
			packages: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				name: String,
				points: {
					type: Number,
					required: true,
				},
				price: {
					type: Number,
					required: true,
				},
				bonus_points: {
					type: Number,
					default: 0,
				},
				is_featured: {
					type: Boolean,
					default: false,
				},
			})],
		}),
	}),

	premium_extensions: new Schema({
		isEnabled: {
			type: Boolean,
			default: false,
		},
		default_revenue_share: {
			type: Number,
			default: 70,
			min: 0,
			max: 100,
		},
		min_price_points: {
			type: Number,
			default: 100,
			min: 0,
		},
		max_price_points: {
			type: Number,
			default: 100000,
			min: 0,
		},
		approval_required: {
			type: Boolean,
			default: true,
		},
	}),

	// ============================================
	// EXTENSION SANDBOX SETTINGS
	// ============================================

	extension_sandbox: new Schema({
		// HTTP allowlist for extension network requests
		// Extensions can only make HTTP requests to these domains
		http_allowlist: {
			type: Array,
			default: [
				"api.jikan.moe",
				"api.mojang.com",
				"sessionserver.mojang.com",
				"api.steampowered.com",
				"steamcommunity.com",
				"mc-heads.net",
				"api.mcsrvstat.us",
				"api.henrikdev.xyz",
				"fortnite-api.com",
				"ddragon.leagueoflegends.com",
				"raw.communitydragon.org",
			],
		},
		// Maximum memory limit for extension isolates (in MB)
		memory_limit_mb: {
			type: Number,
			default: 128,
			min: 32,
			max: 512,
		},
		// Maximum execution timeout (in milliseconds)
		execution_timeout_ms: {
			type: Number,
			default: 30000,
			min: 1000,
			max: 120000,
		},
		// Maximum HTTP requests per extension execution
		max_http_requests: {
			type: Number,
			default: 10,
			min: 1,
			max: 50,
		},
		// Enable/disable network access for extensions entirely
		network_enabled: {
			type: Boolean,
			default: true,
		},
	}),

	// Email Configuration
	email: new Schema({
		isEnabled: {
			type: Boolean,
			default: false,
		},
		provider: {
			type: String,
			default: "smtp",
			enum: ["smtp", "sendgrid", "mailgun", "ses"],
		},
		from_name: {
			type: String,
			default: "",
		},
		from_email: {
			type: String,
			default: "",
		},
		admin_email: {
			type: String,
			default: "",
		},
		brand_color: {
			type: String,
			default: "#3273dc",
		},
		logo_url: {
			type: String,
			default: "",
		},
		footer_text: {
			type: String,
			default: "",
		},
		// Email notification preferences
		notifications: new Schema({
			send_receipts: {
				type: Boolean,
				default: true,
			},
			send_subscription_alerts: {
				type: Boolean,
				default: true,
			},
			send_expiry_reminders: {
				type: Boolean,
				default: true,
			},
			expiry_reminder_days: {
				type: Number,
				default: 7,
			},
			send_admin_alerts: {
				type: Boolean,
				default: true,
			},
		}),
	}),

	// Payment Provider Configuration
	payment_providers: new Schema({
		stripe: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			publishable_key: String,
			product_mapping: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				stripe_price_id: {
					type: String,
					required: true,
				},
				tier_id: {
					type: String,
					required: true,
				},
			})],
		}),
		paypal: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			client_id: String,
			plan_mapping: [new Schema({
				_id: {
					type: String,
					required: true,
				},
				tier_id: {
					type: String,
					required: true,
				},
			})],
		}),
		btcpay: new Schema({
			isEnabled: {
				type: Boolean,
				default: false,
			},
			server_url: String,
			store_id: String,
		}),
	}),
});
