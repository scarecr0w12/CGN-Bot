/* eslint node/exports-style: ["error", "exports"] */

// Must be required before express to catch async errors from route handlers
require("express-async-errors");
const express = require("express");
const http = require("http");
const https = require("https");
const compression = require("compression");
const helmet = require("helmet");
const { Server: SocketIOServer } = require("socket.io");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const MySQLStore = require("express-mysql-session")(session);
// Lazy-load Redis session store to prevent crash if dependencies are missing
let RedisStore = null;
let Redis = null;
try {
	RedisStore = require("connect-redis").default;
	Redis = require("../Database/Redis");
} catch (err) {
	// Redis session store not available - will use default session store
}
const passport = require("passport");
const discordStrategy = require("passport-discord").Strategy;
const discordOAuthScopes = ["identify", "guilds", "email"];
const toobusy = require("toobusy-js");
const fsn = require("fs-nextra");
const Sentry = require("@sentry/node");

const crypto = require("crypto");
const middleware = require("./middleware");
const cloudflareMiddleware = require("./middleware/cloudflare");
const securityMiddleware = require("./middleware/security");
const { initialize: initCloudflare } = require("../Modules/CloudflareService");
const metrics = require("../Modules/Metrics");
const I18n = require("../Modules/I18n");
const app = express();

const listen = async configJS => {
	const servers = {};

	if (configJS.cert && configJS.privateKey && configJS.httpsPort) {
		if (configJS.httpsRedirect) {
			app.use(middleware.enforceProtocol);
		}
		let credentials;
		try {
			const privateKey = await fsn.readFile(configJS.privateKey, "utf8");
			const cert = await fsn.readFile(configJS.cert, "utf8");
			credentials = {
				key: privateKey,
				cert: cert,
			};
		} catch (err) {
			logger.error("Something went wrong while reading the given HTTPS Private Key and Certificate *0*", {}, err);
		}

		const httpsServer = servers.httpsServer = https.createServer(credentials, app);
		httpsServer.on("error", err => {
			logger.error("Something went wrong while starting the HTTPS Web Interface x/", {}, err);
		});
		httpsServer.listen(configJS.httpsPort, configJS.serverIP, () => {
			logger.info(`Opened https web interface on ${configJS.serverIP}:${configJS.httpsPort}`);
		});
	}

	const server = servers.server = http.createServer(app);
	server.on("error", err => {
		logger.error("Something went wrong while starting the HTTP Web Interface x/", {}, err);
	});
	server.listen(configJS.httpPort, configJS.serverIP, () => {
		logger.info(`Opened http web interface on ${configJS.serverIP}:${configJS.httpPort}`);
		process.setMaxListeners(0);
	});

	return servers;
};

// Setup the web server
exports.open = async (client, auth, configJS, logger) => {
	// Setup Express App object
	app.bot = app.client = client;
	app.auth = auth;
	app.toobusy = toobusy;
	app.toobusy.maxLag(200);
	app.routes = [];

	// We always recommend using a reverse proxy like nginx, so unless you're on port 80, always run Skynet with the --proxy option!
	if (process.argv.includes("-p") || process.argv.includes("--proxy")) app.enable("trust proxy");

	// Initialize Cloudflare service and middleware
	if (configJS.cloudflare?.apiToken && configJS.cloudflare?.zoneId) {
		initCloudflare(configJS.cloudflare);
		logger.info("Cloudflare integration initialized");
	}

	// Initialize BotLists module for vote webhooks and stats posting
	const BotLists = require("../Modules/BotLists");
	const botLists = new BotLists(client);
	app.set("botLists", botLists);
	botLists.init().catch(err => logger.warn("Failed to initialize BotLists module", {}, err));

	// Initialize IndexNow module for search engine URL notifications
	const IndexNow = require("../Modules/IndexNow");
	const indexNow = new IndexNow(client);
	app.set("indexNow", indexNow);
	if (indexNow.enabled) {
		logger.info("IndexNow integration initialized");
	}

	// Apply Cloudflare middleware if proxy is enabled
	if (configJS.cloudflare?.proxyEnabled) {
		app.use(cloudflareMiddleware.cloudflareData);
		app.use(cloudflareMiddleware.securityHeaders);

		// Optionally require Cloudflare proxy (blocks direct access)
		if (configJS.cloudflare?.requireProxy) {
			app.use(cloudflareMiddleware.requireCloudflare);
		}

		// Block specific countries if configured
		if (configJS.cloudflare?.blockedCountries?.length > 0) {
			app.use(cloudflareMiddleware.blockCountries(configJS.cloudflare.blockedCountries));
		}

		logger.info("Cloudflare middleware enabled", {
			requireProxy: configJS.cloudflare?.requireProxy,
			blockedCountries: configJS.cloudflare?.blockedCountries?.length || 0,
		});
	} else {
		// Fallback: Always extract real IP from common proxy headers
		app.use((req, res, next) => {
			req.realIP = req.headers["cf-connecting-ip"] ||
				req.headers["x-real-ip"] ||
				(req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : null) ||
				req.ip;
			next();
		});
	}

	// Configure global middleware & Server properties
	app.use(compression());

	// Prometheus metrics middleware - track HTTP request metrics
	app.use(metrics.metricsMiddleware);

	// Metrics endpoint for Prometheus scraping
	app.get("/metrics", metrics.getMetrics);

	// Generate nonce for CSP inline scripts
	app.use((req, res, next) => {
		res.locals.nonce = crypto.randomBytes(16).toString("base64");
		next();
	});

	// Security headers with helmet
	// Note: 'unsafe-inline' and 'unsafe-eval' required for legacy scripts (morris.js, etc.)
	// TODO: Migrate to modern charting library and add nonces to inline scripts
	app.use(helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: [
					"'self'",
					"'unsafe-inline'",
					"'unsafe-eval'",
					// CDN sources
					"https://cdnjs.cloudflare.com",
					"cdnjs.cloudflare.com",
					"https://unpkg.com",
					"unpkg.com",
					"https://maxcdn.bootstrapcdn.com",
					"maxcdn.bootstrapcdn.com",
					// Analytics (internal)
					"https://analytics.thecorehosting.net",
					"https://static.cloudflareinsights.com",
					// Google Tag Manager
					"https://*.googletagmanager.com",
					"https://googletagmanager.com",
					"https://tagmanager.google.com",
					// Google Analytics
					"https://*.google-analytics.com",
					"https://www.google-analytics.com",
					"https://ssl.google-analytics.com",
					// Google Ads & AdSense
					"https://pagead2.googlesyndication.com",
					"https://*.googlesyndication.com",
					"https://googleads.g.doubleclick.net",
					"https://*.googleadservices.com",
					"https://partner.googleadservices.com",
					"https://www.googletagservices.com",
					"https://tpc.googlesyndication.com",
					// Google Static Resources
					"https://*.gstatic.com",
					"https://www.gstatic.com",
					"https://ssl.gstatic.com",
					// Google Core & SODAR
					"https://*.google.com",
					"https://www.google.com",
					"https://*.google",
					// DoubleClick
					"https://*.doubleclick.net",
					"https://static.doubleclick.net",
				],
				scriptSrcAttr: ["'unsafe-hashes'", "'unsafe-inline'"],
				styleSrc: [
					"'self'",
					"'unsafe-inline'",
					"https://cdnjs.cloudflare.com",
					"cdnjs.cloudflare.com",
					"https://fonts.googleapis.com",
					"fonts.googleapis.com",
					"https://maxcdn.bootstrapcdn.com",
					"maxcdn.bootstrapcdn.com",
					"https://analytics.thecorehosting.net",
					"https://*.googleadservices.com",
				],
				fontSrc: [
					"'self'",
					"https://fonts.gstatic.com",
					"fonts.gstatic.com",
					"https://maxcdn.bootstrapcdn.com",
					"maxcdn.bootstrapcdn.com",
					"https://analytics.thecorehosting.net",
					"data:",
				],
				imgSrc: [
					"'self'",
					"data:",
					"https:",
					"http:",
					"blob:",
					// Note: Already allowing all https/http for broad compatibility
					// This covers Google Analytics pixels, AdSense, GTM, and other tracking images
				],
				connectSrc: [
					"'self'",
					"wss:",
					"ws:",
					"https://discord.com",
					// Analytics (internal)
					"https://analytics.thecorehosting.net",
					"https://cdnjs.cloudflare.com",
					"https://static.cloudflareinsights.com",
					// Google Tag Manager
					"https://*.googletagmanager.com",
					"https://www.googletagmanager.com",
					"https://googletagmanager.com",
					// Google Analytics
					"https://*.google-analytics.com",
					"https://www.google-analytics.com",
					"https://ssl.google-analytics.com",
					"https://analytics.google.com",
					"https://*.g.doubleclick.net",
					"https://stats.g.doubleclick.net",
					// Google Ads & AdSense
					"https://pagead2.googlesyndication.com",
					"https://*.googlesyndication.com",
					"https://googleads.g.doubleclick.net",
					"https://*.googleadservices.com",
					"https://www.googleadservices.com",
					// Google Core & SODAR
					"https://*.google.com",
					"https://www.google.com",
					"https://*.google",
					// DoubleClick
					"https://*.doubleclick.net",
					"https://ad.doubleclick.net",
					// Google Static Resources
					"https://*.gstatic.com",
				],
				frameSrc: [
					"'self'",
					"https://discord.com",
					// Google Ads & AdSense iframes
					"https://googleads.g.doubleclick.net",
					"https://tpc.googlesyndication.com",
					"https://pagead2.googlesyndication.com",
					"https://*.googlesyndication.com",
					// DoubleClick Ad serving
					"https://*.doubleclick.net",
					"https://td.doubleclick.net",
					"https://bid.g.doubleclick.net",
					// Google Tag Manager
					"https://*.googletagmanager.com",
					"https://googletagmanager.com",
					// Google Core & SODAR
					"https://*.google.com",
					"https://www.google.com",
					"https://*.google",
					// Google Services
					"https://*.googleadservices.com",
					"https://*.gstatic.com",
				],
				objectSrc: ["'none'"],
				baseUri: ["'self'", "https://analytics.thecorehosting.net"],
				formAction: ["'self'"],
				frameAncestors: ["'self'"],
			},
		},
		crossOriginEmbedderPolicy: false,
	}));

	// Use Express built-in body parsers (body-parser is deprecated)
	app.use(express.urlencoded({
		extended: true,
		parameterLimit: 10000,
		limit: "5mb",
	}));

	// JSON parser with raw body capture for webhook signature verification
	app.use(express.json({
		limit: "5mb",
		verify: (req, res, buf) => {
			// Store raw body for webhook signature verification (Stripe, Patreon)
			if (req.originalUrl.startsWith("/webhooks/")) {
				req.rawBody = buf.toString();
			}
		},
	}));
	app.use(cookieParser());

	// Apply security middleware for input sanitization
	app.use(securityMiddleware.sanitizeJsonResponse);
	app.use(securityMiddleware.apiSecurityHeaders);

	app.set("json spaces", 2);

	app.engine("ejs", ejs.renderFile);
	app.set("views", `${__dirname}/views`);
	app.set("view engine", "ejs");

	app.set("debug mode", process.argv.includes("--debug"));

	// Set the clientID and clientSecret from argv if needed
	if (process.argv.includes("--CID")) {
		auth.discord.clientID = process.argv[process.argv.indexOf("--CID") + 1];
		auth.discord.clientSecret = process.argv[process.argv.indexOf("--CID") + 2];
	}

	// Setup passport and express-session
	passport.use(new discordStrategy({
		clientID: auth.discord.clientID,
		clientSecret: auth.discord.clientSecret,
		callbackURL: `${configJS.hostingURL}login/callback`,
		scope: discordOAuthScopes,
	}, (accessToken, refreshToken, profile, done) => {
		process.nextTick(() => done(null, profile));
	}));

	passport.serializeUser((user, done) => {
		// Serialize the full user profile to preserve guilds array
		done(null, user);
	});
	passport.deserializeUser((obj, done) => {
		// Return the full user object from session
		done(null, obj);
	});

	// Session store priority: Redis > MongoDB > MariaDB > Memory
	const databaseType = process.env.DATABASE_TYPE || "mongodb";
	let sessionStore;

	if (Redis && RedisStore && Redis.isEnabled() && Redis.isReady()) {
		// Use Redis for sessions (fastest, cross-shard)
		sessionStore = new RedisStore({
			client: Redis.getClient(),
			prefix: "sess:",
			ttl: 604800, // 1 week in seconds
		});
		logger.info("Using Redis session store");
	} else if (databaseType === "mongodb" && Database.mongoClient) {
		// Fallback to MongoDB
		sessionStore = MongoStore.create({
			client: Database.mongoClient,
			dbName: Database.mongoClient.options?.dbName || "skynet",
			stringify: false,
		});
		logger.info("Using MongoDB session store");
	} else if (databaseType === "mariadb") {
		// Fallback to MariaDB
		const mysqlOptions = {
			host: process.env.MARIADB_HOST || "127.0.0.1",
			port: parseInt(process.env.MARIADB_PORT, 10) || 3306,
			user: process.env.MARIADB_USER || "root",
			password: process.env.MARIADB_PASSWORD || "",
			database: process.env.MARIADB_DATABASE || "skynet",
			clearExpired: true,
			checkExpirationInterval: 900000, // 15 minutes
			expiration: 604800000, // 1 week
			createDatabaseTable: true,
			schema: {
				tableName: "sessions",
				columnNames: {
					session_id: "session_id",
					expires: "expires",
					data: "data",
				},
			},
		};
		sessionStore = new MySQLStore(mysqlOptions);
		logger.info("Using MariaDB session store");
	} else {
		// Fallback to memory store
		logger.warn("Using memory session store - sessions will not persist across restarts");
		sessionStore = new session.MemoryStore();
	}

	const sessionMiddleware = session({
		secret: configJS.secret,
		resave: false,
		saveUninitialized: false,
		store: sessionStore,
		cookie: {
			secure: configJS.httpsRedirect || false,
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
		},
	});

	app.use(sessionMiddleware);
	app.use(passport.initialize());
	app.use(passport.session());
	app.passport = passport;

	// Sentry user context middleware - adds user info to Sentry errors
	app.use((req, res, next) => {
		if (Sentry.isInitialized() && req.isAuthenticated && req.isAuthenticated() && req.user) {
			Sentry.setUser({
				id: req.user.id,
				username: req.user.username,
			});
		}
		next();
	});

	// Initialize additional OAuth strategies (Google, GitHub, Twitch, Patreon)
	require("./passport-strategies")(passport, configJS).catch(err => {
		logger.warn("Failed to initialize some OAuth strategies", {}, err);
	});

	app.use(middleware.setHeaders);

	app.use(middleware.logRequest);

	// Initialize i18n for multilingual support
	await I18n.initialize();
	app.use(I18n.middleware());

	// Load injection settings from database (cached)
	app.use(middleware.loadInjection);

	// Serve specific root-level files (SEO, ad verification, etc.)
	const rootLevelFiles = ["ads.txt", "robots.txt", "sitemap.xml"];
	rootLevelFiles.forEach(file => {
		app.get(`/${file}`, (req, res, next) => {
			const filePath = `${__dirname}/public/${file}`;
			res.sendFile(filePath, err => {
				if (err) {
					return next(); // File doesn't exist, continue to next handler
				}
			});
		});
	});

	// Serve static files with WebP conversion for images
	const staticOptions = {
		maxAge: 86400000, // 1 day cache
		etag: true,
		lastModified: true,
	};
	const staticRouter = express.static(`${__dirname}/public/`, staticOptions);

	app.use("/static", (req, res, next) => {
		const fileExtension = req.path.substring(req.path.lastIndexOf("."));
		const acceptsWebP = req.get("Accept")?.includes("image/webp");

		// Convert to WebP if supported and not already WebP/GIF
		if (acceptsWebP && req.path.startsWith("/img") && ![".gif", ".webp"].includes(fileExtension)) {
			const webpPath = `${req.path.substring(0, req.path.lastIndexOf("."))}.webp`;
			return res.redirect(`/static${webpPath}`);
		}

		return staticRouter(req, res, next);
	});

	// Listen for incoming connections
	const { server, httpsServer } = await listen(configJS);

	// Setup socket.io v4 for dashboard
	const io = app.io = new SocketIOServer(typeof httpsServer !== "undefined" ? httpsServer : server, {
		cors: {
			origin: configJS.hostingURL,
			credentials: true,
		},
	});

	// Socket.io v4 session middleware (replaces passport.socketio)
	io.use((socket, next) => {
		sessionMiddleware(socket.request, {}, next);
	});

	// Verify user is authenticated for socket connections
	io.use((socket, next) => {
		if (socket.request.session?.passport?.user) {
			socket.user = socket.request.session.passport.user;
			return next();
		} else {
			return next(new Error("Unauthorized"));
		}
	});

	client.IPC.on("dashboardUpdate", msg => {
		const { namespace } = msg;
		const param = msg.location;
		try {
			io.of(namespace).emit("update", { location: param, author: msg.author });
			// Clear injection cache when maintainer settings change
			if (param === "maintainer") {
				const { clearInjectionCache } = require("./middleware");
				clearInjectionCache();
			}
		} catch (err) {
			logger.warn("An error occurred while handling a dashboard WebSocket!", {}, err);
		}
	});

	require("./routes")(app);

	// Sentry error handler - must be before custom error handler
	// This captures unhandled errors and sends them to Sentry with request context
	if (Sentry.isInitialized()) {
		Sentry.setupExpressErrorHandler(app);
		logger.info("Sentry Express error handler initialized for web error tracking");
	} else {
		logger.warn("Sentry is not initialized - web errors will not be sent to Sentry");
	}

	// Global error handler - must be last
	app.use((err, req, res, next) => {
		console.error(`[EXPRESS ERROR] ${req.method} ${req.path}:`, err);
		logger.error(`Unhandled error on ${req.method} ${req.path}`, { params: req.params, query: req.query }, err);
		if (res.headersSent) {
			return next(err);
		}
		res.status(500).render("pages/error.ejs", {
			error_text: "Something went wrong!",
			error_line: "An internal error occurred",
		});
	});

	return { server, httpsServer };
};

exports.close = servers => {
	if (typeof servers.forEach !== "function") servers = Object.values(servers);
	logger.info("Closing Web Interface...");
	servers.forEach(server => server.close());
	logger.warn("This shard is no longer hosting a Web Interface.");
};
