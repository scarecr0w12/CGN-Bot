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
const passport = require("passport");
const discordStrategy = require("passport-discord").Strategy;
const discordOAuthScopes = ["identify", "guilds", "email"];
const toobusy = require("toobusy-js");
const fsn = require("fs-nextra");
const reload = require("require-reload")(require);
const Sentry = require("@sentry/node");

const middleware = require("./middleware");
const cloudflareMiddleware = require("./middleware/cloudflare");
const { initialize: initCloudflare } = require("../Modules/CloudflareService");
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

	// Security headers with helmet (configured for dashboard compatibility)
	app.use(helmet({
		contentSecurityPolicy: false, // Disable CSP for now due to inline scripts in dashboard
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
		delete user.email;
		done(null, user);
	});
	passport.deserializeUser((id, done) => {
		done(null, id);
	});

	// connect-mongo v5 uses a different API
	const sessionStore = MongoStore.create({
		client: Database.mongoClient,
		dbName: Database.mongoClient.options?.dbName || "skynet",
		stringify: false,
	});

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

	// (Horribly) serve public dir
	const staticRouter = express.static(`${__dirname}/public/`, { maxAge: 86400000 });
	app.use("/static", (req, res, next) => {
		const fileExtension = req.path.substring(req.path.lastIndexOf("."));
		if (req.get("Accept") && req.get("Accept").includes("image/webp") && req.path.startsWith("/img") && ![".gif", ".webp"].includes(fileExtension)) {
			res.redirect(`/static${req.path.substring(0, req.path.lastIndexOf("."))}.webp`);
		} else {
			return staticRouter(req, res, next);
		}
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
			next();
		} else {
			next(new Error("Unauthorized"));
		}
	});

	client.IPC.on("dashboardUpdate", msg => {
		const { namespace } = msg;
		const param = msg.location;
		try {
			io.of(namespace).emit("update", { location: param, author: msg.author });
			if (param === "maintainer") global.configJSON = reload("../Configurations/config.json");
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
			error_line: "An internal error occurred" 
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
