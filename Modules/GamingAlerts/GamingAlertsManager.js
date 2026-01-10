const Logger = require("../../Internals/Logger");
const logger = new Logger("GamingAlertsManager");
const fetch = require("node-fetch");

class GamingAlertsManager {
	constructor (client) {
		this.client = client;
		this.epicGamesAPI = "https://store-site-backend-static.ak.epigcdn.com/freeGamesPromotions";
		this.steamAPI = "https://store.steampowered.com/api";
		this.checkInterval = 3600000; // 1 hour
		this.intervalId = null;
	}

	async initialize () {
		logger.info("Initializing Gaming Alerts Manager...");
		// Start periodic checks
		this.startPeriodicChecks();
		logger.info("Gaming Alerts Manager initialized!");
	}

	startPeriodicChecks () {
		// Run initial check after 5 minutes
		setTimeout(() => this.checkAllAlerts(), 300000);

		// Then run every hour
		this.intervalId = setInterval(() => {
			this.checkAllAlerts();
		}, this.checkInterval);
	}

	async checkAllAlerts () {
		try {
			logger.debug("Running periodic gaming alerts check...");

			const GamingAlerts = this.client.database.models.gamingAlerts;
			const alerts = await GamingAlerts.find({ enabled: true }).exec();

			if (!alerts || alerts.length === 0) {
				return;
			}

			// Fetch Epic Games free games
			const epicGames = await this.fetchEpicFreeGames();

			// Fetch Steam data (free games and top sales)
			const steamData = await this.fetchSteamDeals();

			// Process each alert
			for (const alert of alerts) {
				try {
					await this.processAlert(alert, epicGames, steamData);
				} catch (err) {
					logger.error(`Error processing alert for server ${alert.server_id}:`, err);
				}
			}

			logger.debug(`Processed ${alerts.length} gaming alerts`);
		} catch (err) {
			logger.error("Error in checkAllAlerts:", err);
		}
	}

	async fetchEpicFreeGames () {
		try {
			const response = await fetch(`${this.epicGamesAPI}?locale=en-US&country=US&allowCountries=US`);
			if (!response.ok) {
				throw new Error(`Epic API returned ${response.status}`);
			}

			const data = await response.json();
			const freeGames = [];

			if (data.data?.Catalog?.searchStore?.elements) {
				const now = new Date();
				for (const game of data.data.Catalog.searchStore.elements) {
					// Check if game is currently free
					const hasPromotion = game.promotions?.promotionalOffers?.length > 0;
					if (hasPromotion) {
						const promo = game.promotions.promotionalOffers[0].promotionalOffers[0];
						const startDate = new Date(promo.startDate);
						const endDate = new Date(promo.endDate);

						if (now >= startDate && now <= endDate && promo.discountSetting?.discountPercentage === 0) {
							freeGames.push({
								id: game.id,
								title: game.title,
								description: game.description || "No description available",
								imageUrl: game.keyImages?.find(img => img.type === "OfferImageWide")?.url ||
									game.keyImages?.[0]?.url,
								url: `https://store.epicgames.com/en-US/p/${game.urlSlug || game.productSlug}`,
								endDate,
							});
						}
					}
				}
			}

			return freeGames;
		} catch (err) {
			logger.error("Error fetching Epic free games:", err);
			return [];
		}
	}

	async fetchSteamDeals () {
		try {
			// Steam doesn't have an official "free games" API, but we can check featured and specials
			const response = await fetch("https://store.steampowered.com/api/featured");
			if (!response.ok) {
				throw new Error(`Steam API returned ${response.status}`);
			}

			const data = await response.json();
			const deals = [];

			// Process featured items and specials
			const items = [
				...data.featured_win || [],
				...data.large_capsules || [],
			];

			for (const item of items) {
				if (item.discount_percent > 0) {
					const finalPrice = item.final_price / 100;
					const originalPrice = item.original_price / 100;

					deals.push({
						id: item.id?.toString(),
						title: item.name,
						discount: item.discount_percent,
						originalPrice,
						finalPrice,
						isFree: finalPrice === 0,
						url: `https://store.steampowered.com/app/${item.id}`,
						imageUrl: item.large_capsule_image || item.small_capsule_image,
					});
				}
			}

			return deals;
		} catch (err) {
			logger.error("Error fetching Steam deals:", err);
			return [];
		}
	}

	async processAlert (alert, epicGames, steamDeals) {
		const guild = this.client.guilds.cache.get(alert.server_id);
		if (!guild) {
			return;
		}

		const channel = guild.channels.cache.get(alert.channel_id);
		if (!channel || !channel.isTextBased()) {
			logger.warn(`Alert channel ${alert.channel_id} not found or not text-based for guild ${guild.id}`);
			return;
		}

		const notifiedGames = new Set(alert.notified_games || []);
		const newNotifications = [];

		// Check Epic Games
		if (alert.epic_free_games && epicGames.length > 0) {
			for (const game of epicGames) {
				const gameKey = `epic-${game.id}`;
				if (!notifiedGames.has(gameKey)) {
					await this.sendEpicGameAlert(channel, game, alert);
					notifiedGames.add(gameKey);
					newNotifications.push(gameKey);

					// Log to history
					await this.logAlertHistory(alert.server_id, game.id, game.title, "epic", "free");
				}
			}
		}

		// Check Steam deals
		if ((alert.steam_sales || alert.steam_free_games) && steamDeals.length > 0) {
			for (const deal of steamDeals) {
				// Skip if below minimum discount
				if (deal.discount < alert.min_discount) {
					continue;
				}

				// Skip if above max price (if set)
				if (alert.price_filters?.max_price && deal.finalPrice > alert.price_filters.max_price) {
					continue;
				}

				// Check free-only filter
				if (alert.price_filters?.free_only && !deal.isFree) {
					continue;
				}

				// Check if free game alert is enabled
				if (deal.isFree && !alert.steam_free_games) {
					continue;
				}

				// Check if sale alert is enabled
				if (!deal.isFree && !alert.steam_sales) {
					continue;
				}

				const gameKey = `steam-${deal.id}`;
				if (!notifiedGames.has(gameKey)) {
					await this.sendSteamDealAlert(channel, deal, alert);
					notifiedGames.add(gameKey);
					newNotifications.push(gameKey);

					// Log to history
					await this.logAlertHistory(
						alert.server_id,
						deal.id,
						deal.title,
						"steam",
						deal.isFree ? "free" : "sale",
						deal.discount,
						deal.originalPrice,
						deal.finalPrice,
					);
				}
			}
		}

		// Update alert with new notified games (keep last 100)
		if (newNotifications.length > 0) {
			const updatedNotified = Array.from(notifiedGames).slice(-100);
			const GamingAlerts = this.client.database.models.gamingAlerts;
			await GamingAlerts.update(
				{ _id: alert._id },
				{
					notified_games: updatedNotified,
					updated_at: new Date(),
				},
			);
		}
	}

	async sendEpicGameAlert (channel, game, alert) {
		try {
			const embed = {
				color: 0x000000,
				title: `🎮 Free Game on Epic Games Store!`,
				description: `**${game.title}** is now FREE!`,
				fields: [
					{
						name: "Description",
						value: game.description.substring(0, 1024),
					},
					{
						name: "Available Until",
						value: `<t:${Math.floor(game.endDate.getTime() / 1000)}:R>`,
						inline: true,
					},
				],
				image: game.imageUrl ? { url: game.imageUrl } : undefined,
				footer: {
					text: "Epic Games Store",
					icon_url: "https://cdn2.unrealengine.com/Epic+Games+Node%2Fxlarge_whitetext_blackback_epiclogo_504x512_1529964470588-503x512-ac795e81c54b27aaa2e196456dd307bfe4ca3ca4.jpg",
				},
				timestamp: new Date().toISOString(),
			};

			const content = alert.custom_message || "";
			const mention = alert.role_mention ? `<@&${alert.role_mention}>` : "";

			await channel.send({
				content: `${mention} ${content}`.trim(),
				embeds: [embed],
				components: [{
					type: 1,
					components: [{
						type: 2,
						style: 5,
						label: "Claim on Epic Games",
						url: game.url,
					}],
				}],
			});
		} catch (err) {
			logger.error("Error sending Epic game alert:", err);
		}
	}

	async sendSteamDealAlert (channel, deal, alert) {
		try {
			const isFree = deal.finalPrice === 0;
			const embed = {
				color: isFree ? 0x2ecc71 : 0x1b2838,
				title: `${isFree ? "🎁 Free Game" : "🔥 Sale"} on Steam!`,
				description: `**${deal.title}** - ${deal.discount}% OFF${isFree ? " (FREE!)" : ""}`,
				fields: [],
				thumbnail: deal.imageUrl ? { url: deal.imageUrl } : undefined,
				footer: {
					text: "Steam",
					icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png",
				},
				timestamp: new Date().toISOString(),
			};

			if (!isFree) {
				embed.fields.push({
					name: "Price",
					value: `~~$${deal.originalPrice.toFixed(2)}~~ **$${deal.finalPrice.toFixed(2)}**`,
					inline: true,
				});
			}

			const content = alert.custom_message || "";
			const mention = alert.role_mention ? `<@&${alert.role_mention}>` : "";

			await channel.send({
				content: `${mention} ${content}`.trim(),
				embeds: [embed],
				components: [{
					type: 1,
					components: [{
						type: 2,
						style: 5,
						label: isFree ? "Get for Free" : "View on Steam",
						url: deal.url,
					}],
				}],
			});
		} catch (err) {
			logger.error("Error sending Steam deal alert:", err);
		}
	}

	async logAlertHistory (serverId, gameId, gameTitle, store, alertType, discount = null, originalPrice = null, salePrice = null) {
		try {
			const GamingAlertHistory = this.client.database.models.gamingAlertHistory;
			await GamingAlertHistory.create({
				server_id: serverId,
				game_id: gameId,
				game_title: gameTitle,
				store,
				alert_type: alertType,
				discount_percentage: discount,
				original_price: originalPrice,
				sale_price: salePrice,
			});
		} catch (err) {
			logger.error("Error logging alert history:", err);
		}
	}

	async testAlert (serverId) {
		try {
			const GamingAlerts = this.client.database.models.gamingAlerts;
			const alert = await GamingAlerts.findOne({ server_id: serverId }).exec();

			if (!alert || !alert.enabled) {
				throw new Error("Gaming alerts not configured or not enabled");
			}

			const epicGames = await this.fetchEpicFreeGames();
			const steamDeals = await this.fetchSteamDeals();

			// Send first available game as test
			const guild = this.client.guilds.cache.get(alert.server_id);
			const channel = guild?.channels.cache.get(alert.channel_id);

			if (!channel) {
				throw new Error("Alert channel not found");
			}

			if (epicGames.length > 0 && alert.epic_free_games) {
				await this.sendEpicGameAlert(channel, epicGames[0], { ...alert, role_mention: null });
				return { success: true, type: "epic", game: epicGames[0].title };
			}

			if (steamDeals.length > 0 && (alert.steam_sales || alert.steam_free_games)) {
				await this.sendSteamDealAlert(channel, steamDeals[0], { ...alert, role_mention: null });
				return { success: true, type: "steam", game: steamDeals[0].title };
			}

			throw new Error("No games available to test with");
		} catch (err) {
			logger.error("Error testing alert:", err);
			throw err;
		}
	}

	shutdown () {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		logger.info("Gaming Alerts Manager shut down");
	}
}

module.exports = GamingAlertsManager;
