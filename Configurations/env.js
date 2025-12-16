const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const safeRequire = relativePath => {
	try {
		return require(relativePath);
	} catch (err) {
		return {};
	}
};

const pick = (envKey, fallback) => process.env[envKey] ?? fallback;
const pickNumber = (envKey, fallback) => {
	if (process.env[envKey] === undefined) return fallback;
	const parsed = Number(process.env[envKey]);
	return Number.isNaN(parsed) ? fallback : parsed;
};

// Parse comma-separated list from env
const parseList = (envKey, fallback) => {
	const envVal = process.env[envKey];
	if (envVal) return envVal.split(",").map(s => s.trim()).filter(Boolean);
	return fallback || [];
};

const loadConfigs = () => {
	// config.js contains static server configuration (not runtime-changeable)
	const fileConfigJS = safeRequire("./config.js");
	// auth.js contains API tokens and secrets
	const fileAuth = safeRequire("./auth.js");

	// configJS: Static server configuration from env + config.js fallback
	const configJS = {
		...fileConfigJS,
		disableExternalScripts: pick("DISABLE_EXTERNAL_SCRIPTS", fileConfigJS.disableExternalScripts ?? "false") === "true",
		shardTotal: pick("SHARD_TOTAL", fileConfigJS.shardTotal ?? "auto"),
		hostingURL: pick("HOSTING_URL", fileConfigJS.hostingURL),
		serverIP: pick("SERVER_IP", fileConfigJS.serverIP ?? "0.0.0.0"),
		httpPort: pickNumber("HTTP_PORT", fileConfigJS.httpPort ?? 80),
		httpsPort: pickNumber("HTTPS_PORT", fileConfigJS.httpsPort ?? 443),
		oauthLink: pick("OAUTH_LINK", fileConfigJS.oauthLink),
		database: {
			URL: pick("DATABASE_URL", fileConfigJS.database?.URL),
			db: pick("DATABASE_NAME", fileConfigJS.database?.db),
		},
		sentry: {
			dsn: pick("SENTRY_DSN", fileConfigJS.sentry?.dsn),
			environment: pick("SENTRY_ENVIRONMENT", fileConfigJS.sentry?.environment),
			tracesSampleRate: parseFloat(pick("SENTRY_TRACES_SAMPLE_RATE", fileConfigJS.sentry?.tracesSampleRate)) || 1.0,
		},
		cloudflare: {
			apiToken: pick("CLOUDFLARE_API_TOKEN", fileConfigJS.cloudflare?.apiToken),
			zoneId: pick("CLOUDFLARE_ZONE_ID", fileConfigJS.cloudflare?.zoneId),
			accountId: pick("CLOUDFLARE_ACCOUNT_ID", fileConfigJS.cloudflare?.accountId),
			proxyEnabled: pick("CLOUDFLARE_PROXY_ENABLED", fileConfigJS.cloudflare?.proxyEnabled ?? "true") === "true",
			requireProxy: pick("CLOUDFLARE_REQUIRE_PROXY", fileConfigJS.cloudflare?.requireProxy ?? "false") === "true",
			blockedCountries: parseList("CLOUDFLARE_BLOCKED_COUNTRIES", fileConfigJS.cloudflare?.blockedCountries),
		},
		consoleLevel: pick("LOG_LEVEL", fileConfigJS.consoleLevel ?? "info"),
		fileLevel: pick("LOG_FILE_LEVEL", fileConfigJS.fileLevel ?? "info"),
		secret: pick("SESSION_SECRET", fileConfigJS.secret),
		encryptionPassword: pick("ENCRYPTION_PASSWORD", fileConfigJS.encryptionPassword),
		encryptionIv: pick("ENCRYPTION_IV", fileConfigJS.encryptionIv),
	};

	// configJSON: MINIMAL - only version/branch info from env
	// All other runtime settings are now in the database (SiteSettings collection)
	// and managed via ConfigManager module
	//
	// MIGRATION NOTE: The following fields have been moved to SiteSettings:
	// - maintainers, sudoMaintainers, wikiContributors -> ConfigManager.get().maintainers, etc.
	// - userBlocklist, guildBlocklist, activityBlocklist -> ConfigManager.get().userBlocklist, etc.
	// - activity (name, type, twitchURL) -> ConfigManager.get().botActivity
	// - status -> ConfigManager.get().botStatus
	// - perms -> ConfigManager.get().perms
	// - pmForward -> ConfigManager.get().pmForward
	// - homepageMessageHTML, headerImage -> SiteSettings.homepageMessageHTML, etc.
	// - injection -> SiteSettings.injection
	const configJSON = {
		// Version info - still from env (static per deployment)
		version: pick("BOT_VERSION", "1.6.0"),
		branch: pick("BOT_BRANCH", "production"),
	};

	// Token configuration from env + auth.js fallback
	const tokenEnvMap = {
		discordBotsOrg: "DISCORD_BOTS_ORG_TOKEN",
		discordList: "DISCORD_LIST_TOKEN",
		discordBots: "DISCORD_BOTS_TOKEN",
		giphyAPI: "GIPHY_API_KEY",
		googleCSEID: "GOOGLE_CSE_ID",
		googleAPI: "GOOGLE_API_KEY",
		imgurClientID: "IMGUR_CLIENT_ID",
		microsoftTranslation: "MS_TRANSLATE_KEY",
		twitchClientID: "TWITCH_CLIENT_ID",
		wolframAppID: "WOLFRAM_APP_ID",
		openExchangeRatesKey: "OPEN_EXCHANGE_RATES_KEY",
		omdbAPI: "OMDB_API_KEY",
		gistKey: "GIST_KEY",
		openWeatherMap: "OPENWEATHERMAP_KEY",
	};

	const tokens = Object.keys(tokenEnvMap).reduce((acc, tokenKey) => {
		const envKey = tokenEnvMap[tokenKey];
		acc[tokenKey] = pick(envKey, fileAuth.tokens ? fileAuth.tokens[tokenKey] : undefined);
		return acc;
	}, {});

	const auth = {
		discord: {
			clientID: pick("DISCORD_CLIENT_ID", fileAuth.discord?.clientID),
			clientSecret: pick("DISCORD_CLIENT_SECRET", fileAuth.discord?.clientSecret),
			clientToken: pick("DISCORD_CLIENT_TOKEN", fileAuth.discord?.clientToken),
		},
		tokens,
	};

	return { configJS, configJSON, auth };
};

module.exports = { loadConfigs };
