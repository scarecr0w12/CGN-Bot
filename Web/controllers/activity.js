const { getGuild, Utils } = require("../../Modules");
const { GetGuild } = getGuild;
const parsers = require("../parsers");

module.exports = async (req, { res }) => {
	const result = await Servers.aggregate([{
		$group: {
			_id: null,
			total: {
				$sum: {
					$add: ["$messages_today"],
				},
			},
			active: {
				$sum: {
					$cond: [
						{ $gt: ["$messages_today", 0] },
						1,
						0,
					],
				},
			},
		},
	}]);
	const guildAmount = req.app.client.guilds.cache.size;
	const userAmount = req.app.client.users.cache.size;
	let messageCount = 0;
	let activeServers = guildAmount;
	if (result && result.length > 0) {
		messageCount = result[0].total;
		activeServers = result[0].active;
	}

	const renderPage = data => {
		res.setPageData({
			page: "activity.ejs",
			rawServerCount: guildAmount,
			rawUserCount: userAmount,
			totalMessageCount: messageCount,
			numActiveServers: activeServers,
			activeSearchQuery: req.query.q,
			mode: req.path.substring(req.path.lastIndexOf("/") + 1),
			...data,
		});
		res.render();
	};

	if (req.path === "/activity/servers") {
		if (!req.query.q) {
			req.query.q = "";
		}
		let count;
		if (!req.query.count || isNaN(req.query.count) || req.query.count > 64) {
			count = 16;
		} else {
			count = parseInt(req.query.count) || guildAmount;
		}
		let page;
		if (!req.query.page || isNaN(req.query.page)) {
			page = 1;
		} else {
			page = parseInt(req.query.page);
		}
		if (!req.query.sort) {
			req.query.sort = "activity-des";
		}
		if (!req.query.category) {
			req.query.category = "All";
		}
		if (!req.query.publiconly) {
			req.query.publiconly = false;
		}

		const matchCriteria = {
			"config.public_data.isShown": true,
		};
		if (req.query.q) {
			const query = req.query.q.toLowerCase();
			const servers = (await GetGuild.getAll(req.app.client, { strict: true, resolve: "id", parse: "noKeys", findFilter: query })).filter(svrid => !configJSON.activityBlocklist.includes(svrid));
			matchCriteria._id = {
				$in: servers,
			};
		} else {
			matchCriteria._id = {
				$in: (await Utils.GetValue(req.app.client, "guilds.cache.keys()", "arr", "Array.from")).filter(svrid => !configJSON.activityBlocklist.includes(svrid)),
			};
		}
		if (req.query.category !== "All") {
			matchCriteria["config.public_data.server_listing.category"] = req.query.category;
		}
		if (req.query.publiconly === "true") {
			matchCriteria["config.public_data.server_listing.isEnabled"] = true;
		}

		let sortParams;
		switch (req.query.sort) {
			case "members-asc":
				sortParams = {
					member_count: 1,
					added_timestamp: 1,
				};
				break;
			case "members-des":
				sortParams = {
					member_count: -1,
					added_timestamp: -1,
				};
				break;
			case "messages-asc":
				sortParams = {
					messages_today: 1,
					added_timestamp: 1,
				};
				break;
			case "messages-des":
				sortParams = {
					messages_today: -1,
					added_timestamp: -1,
				};
				break;
			case "activity-des":
			default:
				sortParams = {
					activity_score: -1,
				};
				break;
		}

		let rawCount = await Servers.count(matchCriteria);
		if (rawCount === null) {
			rawCount = guildAmount;
		}

		// Use simple find() for SQL compatibility, then process in JS
		let allServerDocs = await Servers.find(matchCriteria).exec();

		// Calculate member_count and activity_score in JavaScript
		allServerDocs = allServerDocs.map(doc => {
			const memberCount = doc.members ? Object.keys(doc.members).length : 0;
			const messagesCount = doc.messages_today || 0;
			const activityScore = (1.5 * memberCount) + (0.5 * messagesCount * (0.005 * memberCount));
			return {
				...doc,
				member_count: memberCount,
				activity_score: activityScore,
			};
		});

		// Sort in JavaScript
		const sortField = Object.keys(sortParams)[0];
		const sortDir = sortParams[sortField];
		allServerDocs.sort((a, b) => {
			const aVal = a[sortField] || 0;
			const bVal = b[sortField] || 0;
			return sortDir === 1 ? aVal - bVal : bVal - aVal;
		});

		// Paginate
		const serverDocuments = allServerDocs.slice(count * (page - 1), count * page);
		let serverData = [];
		if (serverDocuments) {
			const webp = req.accepts("image/webp") === "image/webp";
			serverData = serverDocuments.map(serverDocument => parsers.serverData(req, serverDocument, webp));
		}
		serverData = await Promise.all(serverData);
		let pageTitle = "Servers";
		if (req.query.q) {
			pageTitle = `Search for server "${req.query.q}"`;
		}

		renderPage({
			pageTitle,
			itemsPerPage: req.query.count === 0 ? "0" : count.toString(),
			currentPage: page,
			numPages: Math.ceil(rawCount / (count === 0 ? rawCount : count)),
			serverData,
			selectedCategory: req.query.category,
			isPublicOnly: req.query.publiconly,
			sortOrder: req.query.sort,
		});
	} else if (req.path === "/activity/users") {
		if (!req.query.q) {
			req.query.q = "";
		}
		if (req.query.q) {
			// Search for matching users - check exact ID first, then partial username match
			let userDocuments = [];

			// Try exact ID match first
			const exactIdMatch = await Users.findOne({ _id: req.query.q });
			if (exactIdMatch) {
				userDocuments = [exactIdMatch];
			} else {
				// Try partial match using LIKE pattern (SQL compatible)
				const searchPattern = `%${req.query.q.replace(/[%_]/g, "\\$&")}%`;
				userDocuments = await Users.find({ username: { $like: searchPattern } }).limit(50).exec();
			}


			if (userDocuments.length === 1) {
				// Single result - show profile directly
				const usr = await req.app.client.users.fetch(userDocuments[0]._id, true).catch(() => null);
				if (usr) {
					const userProfile = await parsers.userData(req, usr, userDocuments[0]);
					renderPage({
						pageTitle: `${userProfile.username}'s Profile`,
						userProfile,
					});
				} else {
					renderPage({ pageTitle: `Lookup for user "${req.query.q}"`, searchResults: [] });
				}
			} else if (userDocuments.length > 1) {
				// Multiple results - show list
				const searchResults = [];
				for (const doc of userDocuments) {
					const usr = await req.app.client.users.fetch(doc._id, true).catch(() => null);
					if (usr) {
						searchResults.push({
							id: usr.id,
							username: usr.username,
							avatar: usr.displayAvatarURL() || "/static/img/discord-icon.png",
							points: doc.points || 0,
						});
					}
				}
				renderPage({
					pageTitle: `Search results for "${req.query.q}"`,
					searchResults,
				});
			} else {
				renderPage({ pageTitle: `Lookup for user "${req.query.q}"`, searchResults: [] });
			}
		} else {
			const userResult = await Users.aggregate([{
				$group: {
					_id: null,
					totalPoints: {
						$sum: {
							$add: "$points",
						},
					},
					publicProfilesCount: {
						$sum: {
							$cond: [
								{ $ne: ["$isProfilePublic", false] },
								1,
								0,
							],
						},
					},
					reminderCount: {
						$sum: {
							$size: "$reminders",
						},
					},
				},
			}]);
			let totalPoints = 0;
			let publicProfilesCount = 0;
			let reminderCount = 0;
			if (userResult && userResult.length > 0) {
				[{ totalPoints }] = userResult;
				[{ publicProfilesCount }] = userResult;
				[{ reminderCount }] = userResult;
			}

			renderPage({
				pageTitle: "Users",
				totalPoints,
				publicProfilesCount,
				reminderCount,
			});
		}
	}
};
