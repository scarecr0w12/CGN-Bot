/**
 * Game Update Announcer Module
 * Monitors game updates and posts announcements to configured Discord channels.
 *
 * Supported Games:
 * - Minecraft (Java & Bedrock)
 * - Rust
 * - Terraria
 * - Valheim
 * - ARK: Survival Evolved
 * - 7 Days to Die
 * - Counter-Strike 2
 * - Palworld
 */

const fetch = require("node-fetch");
const { EmbedBuilder } = require("discord.js");

// Game configuration with API sources and metadata
const GAMES = {
	minecraft_java: {
		id: "minecraft_java",
		name: "Minecraft: Java Edition",
		icon: "https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/img/minecraft-creeper-face.jpg",
		color: 0x62B47A,
		fetchUpdates: fetchMinecraftJavaUpdates,
		changelogUrl: "https://www.minecraft.net/en-us/article/minecraft-java-edition-",
	},
	minecraft_bedrock: {
		id: "minecraft_bedrock",
		name: "Minecraft: Bedrock Edition",
		icon: "https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/img/minecraft-creeper-face.jpg",
		color: 0x62B47A,
		fetchUpdates: fetchMinecraftBedrockUpdates,
		changelogUrl: "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs",
	},
	rust: {
		id: "rust",
		name: "Rust",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg",
		color: 0xCD412B,
		fetchUpdates: fetchRustUpdates,
		changelogUrl: "https://rust.facepunch.com/changes/",
		steamAppId: 252490,
	},
	terraria: {
		id: "terraria",
		name: "Terraria",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg",
		color: 0x2ECC71,
		fetchUpdates: fetchSteamUpdates,
		steamAppId: 105600,
		changelogUrl: "https://terraria.org/news",
	},
	valheim: {
		id: "valheim",
		name: "Valheim",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/892970/header.jpg",
		color: 0x4A90D9,
		fetchUpdates: fetchSteamUpdates,
		steamAppId: 892970,
		changelogUrl: "https://store.steampowered.com/news/app/892970",
	},
	ark: {
		id: "ark",
		name: "ARK: Survival Evolved",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/346110/header.jpg",
		color: 0x1B2838,
		fetchUpdates: fetchSteamUpdates,
		steamAppId: 346110,
		changelogUrl: "https://store.steampowered.com/news/app/346110",
	},
	sevendaystodie: {
		id: "sevendaystodie",
		name: "7 Days to Die",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/251570/header.jpg",
		color: 0x8B0000,
		fetchUpdates: fetchSteamUpdates,
		steamAppId: 251570,
		changelogUrl: "https://store.steampowered.com/news/app/251570",
	},
	cs2: {
		id: "cs2",
		name: "Counter-Strike 2",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
		color: 0xDE9B35,
		fetchUpdates: fetchSteamUpdates,
		steamAppId: 730,
		changelogUrl: "https://store.steampowered.com/news/app/730",
	},
	palworld: {
		id: "palworld",
		name: "Palworld",
		icon: "https://cdn.cloudflare.steamstatic.com/steam/apps/1623730/header.jpg",
		color: 0x5DADE2,
		fetchUpdates: fetchSteamUpdates,
		steamAppId: 1623730,
		changelogUrl: "https://store.steampowered.com/news/app/1623730",
	},
};

// Cache for last known versions (global across all servers)
const versionCache = new Map();

// Rate limiting for API calls
const lastFetchTime = new Map();
const FETCH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between fetches per game

/**
 * Fetch Minecraft Java Edition updates from Mojang's version manifest
 */
async function fetchMinecraftJavaUpdates () {
	try {
		const response = await fetchWithRetry("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json", {
			timeout: 30000,
			headers: { "User-Agent": "SkynetBot/1.0 GameUpdateAnnouncer" },
		});
		if (!response.ok) return null;

		const data = await response.json();
		const latestRelease = data.versions.find(v => v.type === "release");
		const latestSnapshot = data.versions.find(v => v.type === "snapshot");

		if (!latestRelease) return null;

		// Fetch release details for changelog
		let releaseDetails = null;
		try {
			const detailsResponse = await fetchWithRetry(latestRelease.url, {
				timeout: 30000,
				headers: { "User-Agent": "SkynetBot/1.0 GameUpdateAnnouncer" },
			});
			if (detailsResponse.ok) {
				releaseDetails = await detailsResponse.json();
			}
		} catch (_) {
			// Ignore details fetch errors
		}

		return {
			version: latestRelease.id,
			releaseDate: new Date(latestRelease.releaseTime),
			type: "release",
			snapshot: latestSnapshot ? latestSnapshot.id : null,
			description: `Minecraft Java Edition ${latestRelease.id} is now available!`,
			changelogUrl: `https://www.minecraft.net/en-us/article/minecraft-java-edition-${latestRelease.id.replace(/\./g, "-")}`,
			details: releaseDetails,
		};
	} catch (err) {
		logger.debug("Failed to fetch Minecraft Java updates", {}, err);
		return null;
	}
}

/**
 * Fetch Minecraft Bedrock Edition updates
 * Uses the Xbox/Microsoft API for Bedrock version info
 */
async function fetchMinecraftBedrockUpdates () {
	try {
		// Bedrock versions are harder to track - we use a community API
		const response = await fetchWithRetry("https://raw.githubusercontent.com/nicholasgrose/mcbeinfo/master/versions/bedrock.json", {
			timeout: 30000,
			headers: { "User-Agent": "SkynetBot/1.0 GameUpdateAnnouncer" },
		});
		if (!response.ok) return null;

		const data = await response.json();
		const versions = Object.entries(data).sort((a, b) => new Date(b[1].date) - new Date(a[1].date));

		if (!versions.length) return null;
		const [version, info] = versions[0];

		return {
			version,
			releaseDate: new Date(info.date),
			type: "release",
			description: `Minecraft Bedrock Edition ${version} is now available!`,
			changelogUrl: "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs",
		};
	} catch (err) {
		logger.debug("Failed to fetch Minecraft Bedrock updates", {}, err);
		return null;
	}
}

/**
 * Fetch with retry logic for transient failures
 */
async function fetchWithRetry (url, options = {}, retries = 2) {
	for (let i = 0; i <= retries; i++) {
		try {
			const response = await fetch(url, options);
			return response;
		} catch (err) {
			if (i === retries) throw err;
			// Wait before retry: 2s, 4s
			await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
		}
	}
}

/**
 * Fetch Rust updates from Facepunch's changelog
 */
async function fetchRustUpdates () {
	try {
		// Use Steam API for Rust updates
		const response = await fetchWithRetry("https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=252490&count=5&maxlength=500&format=json", {
			timeout: 30000,
			headers: { "User-Agent": "SkynetBot/1.0 GameUpdateAnnouncer" },
		});
		if (!response.ok) return null;

		const data = await response.json();
		const news = data?.appnews?.newsitems;
		if (!news || !news.length) return null;

		// Find update posts (usually contain "update" or version numbers)
		const updatePost = news.find(n =>
			n.title.toLowerCase().includes("update") ||
			n.title.toLowerCase().includes("patch") ||
			/\d+\.\d+/.test(n.title),
		);

		if (!updatePost) return null;

		// Extract version from title if possible
		const versionMatch = updatePost.title.match(/(\d+(?:\.\d+)*)/);
		const version = versionMatch ? versionMatch[1] : updatePost.gid;

		return {
			version,
			title: updatePost.title,
			releaseDate: new Date(updatePost.date * 1000),
			type: "update",
			description: updatePost.contents?.substring(0, 500) || updatePost.title,
			changelogUrl: updatePost.url || "https://rust.facepunch.com/changes/",
		};
	} catch (err) {
		logger.debug("Failed to fetch Rust updates", {}, err);
		return null;
	}
}

/**
 * Generic Steam game update fetcher
 * Uses Steam's news API to get latest updates
 */
async function fetchSteamUpdates (gameConfig) {
	try {
		const appId = gameConfig.steamAppId;
		if (!appId) return null;

		const response = await fetchWithRetry(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=10&maxlength=500&format=json`, {
			timeout: 30000,
			headers: { "User-Agent": "SkynetBot/1.0 GameUpdateAnnouncer" },
		});
		if (!response.ok) return null;

		const data = await response.json();
		const news = data?.appnews?.newsitems;
		if (!news || !news.length) return null;

		// Filter for update/patch posts
		const updatePost = news.find(n => {
			const title = n.title.toLowerCase();
			return title.includes("update") ||
				title.includes("patch") ||
				title.includes("hotfix") ||
				title.includes("release") ||
				title.includes("changelog") ||
				/v?\d+\.\d+/.test(n.title);
		});

		if (!updatePost) return null;

		// Try to extract version number from title
		const versionMatch = updatePost.title.match(/v?(\d+(?:\.\d+)+)/i);
		const version = versionMatch ? versionMatch[1] : `${updatePost.gid}`;

		// Clean up description (remove HTML, BBCode)
		let description = updatePost.contents || "";
		description = description
			.replace(/\[.*?\]/g, "") // Remove BBCode
			.replace(/<[^>]*>/g, "") // Remove HTML
			.replace(/\{STEAM_CLAN_IMAGE\}[^\s]*/g, "") // Remove Steam image refs
			.trim()
			.substring(0, 400);

		return {
			version,
			title: updatePost.title,
			releaseDate: new Date(updatePost.date * 1000),
			type: "update",
			description: description || updatePost.title,
			changelogUrl: updatePost.url || gameConfig.changelogUrl,
			postId: updatePost.gid,
		};
	} catch (err) {
		logger.debug(`Failed to fetch Steam updates for ${gameConfig.name}`, {}, err);
		return null;
	}
}

/**
 * Main Game Update Announcer class
 */
class GameUpdateAnnouncer {
	constructor (client) {
		this.client = client;
		this.checkInterval = null;
		this.isRunning = false;
	}

	/**
	 * Initialize the announcer - start hourly checks
	 */
	async init () {
		if (this.isRunning) return;
		this.isRunning = true;

		// Only run on shard 0 to avoid duplicate announcements
		if (this.client.shardID !== "0") {
			logger.debug("GameUpdateAnnouncer: Skipping init on non-primary shard");
			return;
		}

		logger.info("GameUpdateAnnouncer: Initializing game update monitoring");

		// Initial check after 30 seconds (let bot fully start)
		setTimeout(() => this.checkAllGames(), 30000);

		// Then check every hour
		this.checkInterval = setInterval(() => this.checkAllGames(), 60 * 60 * 1000);
	}

	/**
	 * Check all games for updates
	 */
	async checkAllGames () {
		logger.debug("GameUpdateAnnouncer: Starting hourly game update check");

		for (const [gameId, gameConfig] of Object.entries(GAMES)) {
			try {
				await this.checkGameUpdates(gameId, gameConfig);
			} catch (err) {
				logger.warn(`GameUpdateAnnouncer: Error checking ${gameId}`, {}, err);
			}
			// Small delay between games to avoid rate limits
			await new Promise(resolve => setTimeout(resolve, 2000));
		}

		logger.debug("GameUpdateAnnouncer: Completed hourly game update check");
	}

	/**
	 * Check a specific game for updates
	 */
	async checkGameUpdates (gameId, gameConfig) {
		// Rate limit check
		const lastFetch = lastFetchTime.get(gameId) || 0;
		if (Date.now() - lastFetch < FETCH_COOLDOWN_MS) {
			return;
		}
		lastFetchTime.set(gameId, Date.now());

		// Fetch latest version info
		const updateInfo = await gameConfig.fetchUpdates(gameConfig);
		if (!updateInfo) {
			logger.debug(`GameUpdateAnnouncer: No update info for ${gameId}`);
			return;
		}

		// Check if this is a new version
		const cachedVersion = versionCache.get(gameId);
		const currentVersion = updateInfo.version || updateInfo.postId;

		// First run - just cache the version, don't announce
		if (!cachedVersion) {
			versionCache.set(gameId, currentVersion);
			logger.debug(`GameUpdateAnnouncer: Cached initial version for ${gameId}: ${currentVersion}`);
			return;
		}

		// Same version - no update
		if (cachedVersion === currentVersion) {
			return;
		}

		// New version detected!
		versionCache.set(gameId, currentVersion);
		logger.info(`GameUpdateAnnouncer: New ${gameId} version detected: ${currentVersion}`);

		// Find all servers subscribed to this game and announce
		await this.announceUpdate(gameId, gameConfig, updateInfo);
	}

	/**
	 * Announce an update to all subscribed channels
	 */
	async announceUpdate (gameId, gameConfig, updateInfo) {
		try {
			// Get all servers with game update subscriptions for this game
			const serverDocuments = await Servers.find({
				"config.game_updates.subscriptions": {
					$elemMatch: {
						game_id: gameId,
						isEnabled: true,
					},
				},
			}).exec();

			if (!serverDocuments || !serverDocuments.length) {
				logger.debug(`GameUpdateAnnouncer: No subscriptions for ${gameId}`);
				return;
			}

			const embed = this.buildUpdateEmbed(gameConfig, updateInfo);

			for (const serverDoc of serverDocuments) {
				const guild = this.client.guilds.cache.get(serverDoc._id);
				if (!guild) continue;

				const subscription = serverDoc.config.game_updates?.subscriptions?.find(s => s.game_id === gameId);
				if (!subscription || !subscription.channel_id) continue;

				try {
					const channel = guild.channels.cache.get(subscription.channel_id);
					if (!channel || !channel.isTextBased()) continue;

					// Check bot permissions
					const permissions = channel.permissionsFor(guild.members.me);
					if (!permissions?.has(["SendMessages", "EmbedLinks"])) continue;

					// Build mention string if role is configured
					let mentionContent = "";
					if (subscription.mention_role_id) {
						if (subscription.mention_role_id === "everyone") {
							mentionContent = "@everyone";
						} else if (subscription.mention_role_id === "here") {
							mentionContent = "@here";
						} else {
							mentionContent = `<@&${subscription.mention_role_id}>`;
						}
					}

					await channel.send({
						content: mentionContent || undefined,
						embeds: [embed],
					});

					logger.debug(`GameUpdateAnnouncer: Announced ${gameId} update to ${guild.name}`, { svrid: guild.id });
				} catch (err) {
					logger.debug(`GameUpdateAnnouncer: Failed to announce to channel`, { svrid: serverDoc._id, chid: subscription.channel_id }, err);
				}
			}
		} catch (err) {
			logger.warn(`GameUpdateAnnouncer: Failed to announce ${gameId} update`, {}, err);
		}
	}

	/**
	 * Build the update announcement embed
	 */
	buildUpdateEmbed (gameConfig, updateInfo) {
		const embed = new EmbedBuilder()
			.setColor(gameConfig.color)
			.setTitle(`🎮 ${gameConfig.name} Update`)
			.setThumbnail(gameConfig.icon)
			.setTimestamp(updateInfo.releaseDate || new Date());

		// Version info
		if (updateInfo.version) {
			embed.addFields({ name: "Version", value: updateInfo.version, inline: true });
		}

		// Title (for Steam news posts)
		if (updateInfo.title && updateInfo.title !== updateInfo.version) {
			embed.setDescription(`**${updateInfo.title}**`);
		}

		// Description/summary
		if (updateInfo.description) {
			const desc = updateInfo.description.length > 400 ?
				`${updateInfo.description.substring(0, 400)}...` :
				updateInfo.description;

			if (embed.data.description) {
				embed.setDescription(`${embed.data.description}\n\n${desc}`);
			} else {
				embed.setDescription(desc);
			}
		}

		// Changelog link
		if (updateInfo.changelogUrl) {
			embed.addFields({
				name: "📝 Full Changelog",
				value: `[View Details](${updateInfo.changelogUrl})`,
				inline: true,
			});
		}

		// Snapshot info for Minecraft
		if (updateInfo.snapshot) {
			embed.addFields({ name: "Latest Snapshot", value: updateInfo.snapshot, inline: true });
		}

		embed.setFooter({ text: "Game Update Announcer • Update your servers!" });

		return embed;
	}

	/**
	 * Get list of available games
	 */
	static getAvailableGames () {
		return Object.entries(GAMES).map(([id, config]) => ({
			id,
			name: config.name,
			icon: config.icon,
			color: config.color,
		}));
	}

	/**
	 * Get game info by ID
	 */
	static getGameInfo (gameId) {
		return GAMES[gameId] || null;
	}

	/**
	 * Manually trigger a check for a specific game (for testing)
	 */
	async forceCheck (gameId) {
		const gameConfig = GAMES[gameId];
		if (!gameConfig) return null;

		// Clear rate limit for this game
		lastFetchTime.delete(gameId);

		const updateInfo = await gameConfig.fetchUpdates(gameConfig);
		return updateInfo;
	}

	/**
	 * Get current cached versions
	 */
	getCachedVersions () {
		const versions = {};
		for (const [gameId, version] of versionCache) {
			versions[gameId] = version;
		}
		return versions;
	}

	/**
	 * Clean up on shutdown
	 */
	destroy () {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
		this.isRunning = false;
	}
}

module.exports = GameUpdateAnnouncer;
module.exports.GAMES = GAMES;
