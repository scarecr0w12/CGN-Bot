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

const loadConfigs = () => {
	const fileConfigJS = safeRequire("./config.js");
	const fileConfigJSON = safeRequire("./config.json");
	const templateConfigJSON = Object.keys(fileConfigJSON).length ? fileConfigJSON : safeRequire("./config.template.json");
	const fileAuth = safeRequire("./auth.js");

	const configJS = {
		...fileConfigJS,
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
		},
		consoleLevel: pick("LOG_LEVEL", fileConfigJS.consoleLevel ?? "info"),
		fileLevel: pick("LOG_FILE_LEVEL", fileConfigJS.fileLevel ?? "info"),
		secret: pick("SESSION_SECRET", fileConfigJS.secret),
		encryptionPassword: pick("ENCRYPTION_PASSWORD", fileConfigJS.encryptionPassword),
		encryptionIv: pick("ENCRYPTION_IV", fileConfigJS.encryptionIv),
	};

	const baseConfigJSON = Object.keys(fileConfigJSON).length ? fileConfigJSON : templateConfigJSON;
	const configJSON = {
		...baseConfigJSON,
		status: pick("BOT_STATUS", baseConfigJSON.status),
		branch: pick("BOT_BRANCH", baseConfigJSON.branch),
		version: pick("BOT_VERSION", baseConfigJSON.version),
		activity: {
			...baseConfigJSON.activity,
			name: pick("BOT_ACTIVITY_NAME", baseConfigJSON.activity?.name),
			type: pick("BOT_ACTIVITY_TYPE", baseConfigJSON.activity?.type),
			twitchURL: pick("BOT_ACTIVITY_TWITCH_URL", baseConfigJSON.activity?.twitchURL),
		},
	};

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
