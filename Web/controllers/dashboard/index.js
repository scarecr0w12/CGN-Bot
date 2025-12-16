const { GetGuild } = require("../../../Modules").getGuild;
const { canDo } = require("../../helpers");

const controllers = module.exports;

controllers.home = async (req, { res }) => {
	if (!req.isAuthenticated()) {
		res.redirect("/login");
	} else {
		const serverData = [];
		const usr = await req.app.client.users.fetch(req.user.id, true);
		const addServerData = async (i, callback) => {
			if (req.user.guilds && i < req.user.guilds.length) {
				if (!usr) return addServerData(++i, callback);
				const svr = new GetGuild(req.app.client, req.user.guilds[i].id);
				await svr.initialize(usr.id);
				if (!svr.success && !((parseInt(req.user.guilds[i].permissions) >> 5) & 1)) {
					addServerData(++i, callback);
					return;
				}
				const data = {
					name: req.user.guilds[i].name,
					id: req.user.guilds[i].id,
					icon: req.user.guilds[i].icon ? `https://cdn.discordapp.com/icons/${req.user.guilds[i].id}/${req.user.guilds[i].icon}.jpg` : "/static/img/discord-icon.png",
					botJoined: svr.success,
					isAdmin: false,
				};
				if (svr.success) {
					const serverDocument = await Servers.findOne(req.user.guilds[i].id);
					// SKYNET_HOST always gets admin access
					if (process.env.SKYNET_HOST === usr.id) {
						data.isAdmin = true;
					} else if (serverDocument) {
						const member = svr.members[usr.id];
						if (req.app.client.getUserBotAdmin(svr, serverDocument, member) >= 3 || canDo("sudo", usr.id)) {
							data.isAdmin = true;
						}
					}
					serverData.push(data);
					addServerData(++i, callback);
				} else {
					serverData.push(data);
					addServerData(++i, callback);
				}
			} else {
				return callback();
			}
		};
		addServerData(0, () => {
			serverData.sort((a, b) => a.name.localeCompare(b.name));
			const dashSettings = require("../../../Modules/ConfigManager").getCached();
			if (dashSettings.maintainers.includes(req.user.id) || process.env.SKYNET_HOST === req.user.id) {
				serverData.push({
					name: "Maintainer Console",
					id: "maintainer",
					icon: "/static/img/transparent.png",
					botJoined: true,
					isAdmin: true,
				});
			}

			res.setServerData(serverData);
			res.setPageData({
				page: "dashboard.ejs",
				rawJoinLink: `https://discordapp.com/oauth2/authorize?&client_id=${req.app.auth.discord.clientID}&scope=bot&permissions=470019135`,
			});
			res.render();
		});
	}
};

controllers.overview = async (req, { res }) => {
	console.log("[OVERVIEW] Starting overview controller");
	try {
		// Redirect to maintainer console if necessary
		if (!req.svr && req.isAuthorized) {
			console.log("[OVERVIEW] Redirecting to maintainer console");
			res.redirect("/dashboard/maintainer/maintainer");
		} else {
			console.log("[OVERVIEW] Processing server overview for:", req.svr && req.svr.id);
			console.log("[OVERVIEW] req.svr exists:", !!req.svr);
			console.log("[OVERVIEW] req.svr.document exists:", !!(req.svr && req.svr.document));

			let topCommand;
			let topCommandUsage = 0;
			const commandUsage = req.svr.document.command_usage || {};
			for (const cmd in commandUsage) {
				if (commandUsage[cmd] > topCommandUsage) {
					topCommand = cmd;
					topCommandUsage = commandUsage[cmd];
				}
			}

			const documentMembers = req.svr.document.members || {};
			const topMemberID = Object.values(documentMembers).sort((a, b) => (b.messages || 0) - (a.messages || 0))[0];
			let topMember = topMemberID ? topMemberID._id : null;
			const memberIDs = Object.keys(req.svr.members || {});

			const userDocuments = await Users.find({
				_id: {
					$in: memberIDs,
				},
			}).sort({
				points: -1,
			}).limit(1)
				.exec();

			let richestMember;
			if (userDocuments && userDocuments.length > 0) {
				richestMember = userDocuments[0]._id;
			}
			await req.svr.fetchMember([richestMember ? richestMember : undefined, topMember ? topMember : undefined]);
			richestMember = req.svr.members[richestMember];
			topMember = req.svr.members[topMember];

			res.setPageData({
				page: "admin-overview.ejs",
				messagesToday: req.svr.document.messages_today,
				topCommand,
				memberCount: req.svr.memberCount,
				topMember: topMember ? {
					username: topMember.user.username,
					id: topMember.user.id,
					avatar: req.app.client.getAvatarURL(topMember.user.id, topMember.user.avatar) || "/static/img/discord-icon.png",
				} : null,
				richestMember: richestMember ? {
					username: richestMember.user.username,
					id: richestMember.user.id,
					avatar: req.app.client.getAvatarURL(richestMember.user.id, richestMember.user.avatar) || "/static/img/discord-icon.png",
				} : null,
			});

			res.render();
		}
	} catch (err) {
		console.error("[OVERVIEW ERROR]", err);
		throw err;
	}
};

controllers.commands = require("./commands");
controllers.stats = require("./stats");
controllers.administration = require("./administration");
controllers.other = require("./other");
controllers.ai = require("./ai");
controllers.subscription = require("./subscription");
controllers.tickets = require("./tickets");
