const { renderError } = require("../helpers");
const { GetGuild } = require("../../Modules").getGuild;
const ConfigManager = require("../../Modules/ConfigManager");

module.exports = middleware => {
	// Middleware

	// Populate a request with Authorization details
	middleware.authorizeGuildAccess = async (req, res, next) => {
		console.log("[AUTH] authorizeGuildAccess started");
		// Do not populate request if authorization is not required
		if (!req.params.svrid && !req.query.svrid) return next();
		// Confirm user is authenticated
		if (req.isAuthenticated()) {
			console.log("[AUTH] User is authenticated:", req.user.id);
			// Fetch user data from Discord
			const usr = await req.app.client.users.fetch(req.user.id, true);
			console.log("[AUTH] User fetched:", !!usr);
			if (usr) {
				// Legacy URL support
				if (!req.params.svrid && req.query.svrid) req.params.svrid = req.query.svrid;
				// Get server data from shard that has said server cached
				console.log("[AUTH] Creating GetGuild for:", req.params.svrid);
				const svr = new GetGuild(req.app.client, req.params.svrid);
				await svr.initialize([usr.id, "OWNER", req.app.client.user.id]);
				console.log("[AUTH] GetGuild initialized, success:", svr.success);
				// Confirm the svr and usr exist
				if (svr.success) {
					// Get server data from Database
					console.log("[AUTH] Fetching server document");
					let serverDocument;
					try {
						serverDocument = await Servers.findOne(svr.id);
						console.log("[AUTH] Server document fetched:", !!serverDocument);
					} catch (err) {
						console.error("[AUTH] Error fetching server document:", err);
						if (req.isAPI) return res.sendStatus(500);
						renderError(res, "Something went wrong while fetching your server data.");
					}
					if (!serverDocument) {
						console.log("[AUTH] No server document found, creating one...");
						try {
							// Create a basic server document without full initialization
							const newServerDocument = Servers.new({ _id: svr.id });
							await newServerDocument.save();
							serverDocument = await Servers.findOne(svr.id);
							console.log("[AUTH] Server document created:", !!serverDocument);
						} catch (createErr) {
							console.error("[AUTH] Failed to create server document:", createErr);
							if (req.isAPI) return res.sendStatus(500);
							return renderError(res, "Something went wrong while creating your server data.");
						}
						if (!serverDocument) {
							if (req.isAPI) return res.sendStatus(500);
							return renderError(res, "Something went wrong while fetching your server data.");
						}
					}
					// Authorize the user's request
					const member = svr.members[usr.id];
					console.log("[AUTH] Member found:", !!member);
					const adminLevel = req.app.client.getUserBotAdmin(svr, serverDocument, member);
					console.log("[AUTH] Admin level:", adminLevel);
					if (adminLevel >= 3 || await ConfigManager.checkSudoMode(usr.id)) {
						// Populate the request object with Authorization details
						try {
							console.log("[AUTH] Populating request object");
							req.isAuthorized = true;
							req.isSudo = adminLevel !== 3;
							req.consolemember = member;
							req.consolemember.level = adminLevel;
							req.svr = svr;
							req.svr.document = serverDocument;
							req.svr.queryDocument = serverDocument.query;
							// Only call populateDashboard for page requests, not API
							if (res.res && res.res.populateDashboard) {
								console.log("[AUTH] Calling populateDashboard");
								res.res.populateDashboard(req);
								console.log("[AUTH] populateDashboard completed, calling next()");
							} else {
								console.log("[AUTH] API request, skipping populateDashboard");
							}
							return next();
						} catch (err) {
							console.error(`[AUTH ERROR] ${req.method} ${req.path}:`, err);
							logger.warn(`An error occurred during a ${req.protocol} ${req.method} request on ${req.path} 0.0`, {
								params: req.params,
								query: req.query,
							}, err);
							if (req.isAPI) return res.sendStatus(500);
							renderError(res, "An unknown error occurred.");
						}
					} else {
						if (req.isAPI) return res.sendStatus(403);
						res.redirect("/dashboard");
					}
				} else {
					if (req.isAPI) return res.sendStatus(404);
					renderError(res, "Wait a second, that server doesn't exist!<br>We failed to fetch your server from Discord.");
				}
			} else {
				if (req.isAPI) return res.sendStatus(500);
				renderError(res, "Wait, do you exist?<br>We failed to fetch your user from Discord.");
			}
		} else {
			if (req.isAPI) return res.sendStatus(401);
			res.redirect("/login");
		}
	};

	middleware.authorizeConsoleAccess = async (req, res, next) => {
		console.log("[CONSOLE AUTH] authorizeConsoleAccess called for:", req.path);
		console.log("[CONSOLE AUTH] User authenticated:", req.isAuthenticated());
		if (req.isAuthenticated()) {
			const settings = await ConfigManager.get();
			console.log("[CONSOLE AUTH] User ID:", req.user.id);
			console.log("[CONSOLE AUTH] Maintainers list:", settings.maintainers);
			console.log("[CONSOLE AUTH] Is maintainer:", settings.maintainers.includes(req.user.id));
			if (settings.maintainers.includes(req.user.id)) {
				const { perm } = req;
				console.log("[CONSOLE AUTH] Permission required:", perm);
				if (perm === "maintainer" || await ConfigManager.canDo(perm, req.user.id)) {
					req.isAuthorized = true;
					req.level = process.env.SKYNET_HOST !== req.user.id ? settings.sudoMaintainers.includes(req.user.id) ? 2 : 1 : 0;
					// Only set template properties for non-API requests
					if (res.res && res.res.template) {
						res.res.template.isSudoMaintainer = req.level === 2 || req.level === 0;
						res.res.template.isHost = req.level === 0;
					}
					console.log("[CONSOLE AUTH] Access granted, level:", req.level);
					return next();
				} else {
					console.log("[CONSOLE AUTH] Permission denied for perm:", perm);
					if (req.isAPI) return res.sendStatus(403);
					res.redirect("/dashboard");
				}
			} else {
				console.log("[CONSOLE AUTH] User is not a maintainer, redirecting");
				if (req.isAPI) return res.sendStatus(403);
				res.redirect("/dashboard");
			}
		} else {
			console.log("[CONSOLE AUTH] User not authenticated, redirecting to login");
			if (req.isAPI) return res.sendStatus(401);
			res.redirect("/login");
		}
	};

	middleware.authorizeDashboardAccess = (req, res, next) => {
		console.log("[AUTH] authorizeDashboardAccess called for:", req.path);
		if (!req.params.svrid && !req.query.svrid) {
			console.log("[AUTH] No svrid found, redirecting");
			if (req.isAPI) return res.sendStatus(400);
			return res.redirect("/dashboard");
		}
		console.log("[AUTH] Calling authorizeGuildAccess for svrid:", req.params.svrid);
		middleware.authorizeGuildAccess(req, res, next);
	};

	middleware.authenticateResourceRequest = (req, res, next) => {
		if (req.isAuthenticated()) return next();
		else res.sendStatus(401);
	};

	middleware.authorizeResourceRequest = async (req, res, next) => {
		if (req.params.usrid && req.params.usrid === req.user.id) return next();
		else if (req.params.svrid) return middleware.authorizeGuildAccess(req, res, next);
		else res.sendStatus(403);
	};

	middleware.authorizeWikiAccess = async (req, res, next) => {
		if (req.isAuthenticated()) {
			const settings = await ConfigManager.get();
			if (settings.wikiContributors.includes(req.user.id) || settings.maintainers.includes(req.user.id)) {
				return next();
			} else {
				renderError(res, "You are not authorized to access this page.", "<strong>You</strong> shall not pass!");
			}
		} else {
			res.redirect("/login");
		}
	};

	middleware.authorizeBlogAccess = async (req, res, next) => {
		if (req.isAuthenticated()) {
			const settings = await ConfigManager.get();
			if (settings.maintainers.includes(req.user.id)) {
				return next();
			} else {
				renderError(res, "You are not authorized to access this page.", "<strong>You</strong> shall not pass!");
			}
		} else {
			res.redirect("/login");
		}
	};

	middleware.authorizeConsoleSocketAccess = async socket => {
		if (socket.request.user && socket.request.user.logged_in) {
			const settings = await ConfigManager.get();
			if (settings.maintainers.includes(socket.request.user.id)) {
				const { perm } = socket.request;
				if (perm === "maintainer" || await ConfigManager.canDo(perm, socket.request.user.id)) {
					socket.request.isAuthorized = true;
					socket.request.level = process.env.SKYNET_HOST !== socket.request.user.id ? settings.sudoMaintainers.includes(socket.request.user.id) ? 2 : 1 : 0;
					return true;
				} else {
					socket.emit("err", { error: 403, fatal: true });
					socket.disconnect();
					return false;
				}
			} else {
				socket.emit("err", { error: 403, fatal: true });
				socket.disconnect();
				return false;
			}
		} else {
			socket.emit("err", { error: 401, fatal: true });
			socket.disconnect();
			return false;
		}
	};

	// Builders
	middleware.buildAuthenticateMiddleware = router => router.app.passport.authenticate("discord", {
		failureRedirect: "/error?err=discord",
	});
};
