/**
 * Profile Controller
 * Handles user profile viewing and editing
 */

const { GetGuild } = require("../../Modules/GetGuild");
const GameActivityTracker = require("../../Modules/GameActivityTracker");
const CacheManager = require("../../Modules/CacheManager");
const { renderError } = require("../helpers");

/**
 * Get user data for profile display
 * @param {Object} client - Discord client
 * @param {string} userId - User ID to look up
 * @returns {Object|null} User data or null
 */
const getUserData = async (client, userId) => {
	try {
		const user = await client.users.fetch(userId).catch(() => null);
		if (!user) return null;

		const userDocument = await CacheManager.getUser(userId);

		// Determine if user has premium (non-default) tier
		let isPremium = false;
		if (userDocument?.subscription?.tier_id) {
			const TierManager = require("../../Modules/TierManager");
			const tier = await TierManager.getTier(userDocument.subscription.tier_id);
			// It is premium if it's not the default tier
			if (tier && !tier.is_default) {
				isPremium = true;
			}
		}

		return {
			id: user.id,
			username: user.username,
			displayName: user.displayName || user.username,
			discriminator: user.discriminator || "0",
			avatar: user.displayAvatarURL({ size: 256, dynamic: true }),
			banner: user.bannerURL?.({ size: 1024 }) || null,
			accentColor: user.accentColor ? `#${user.accentColor.toString(16).padStart(6, "0")}` : null,
			createdAt: user.createdAt,
			bot: user.bot,
			document: userDocument,
			isPremium,
		};
	} catch (err) {
		logger.debug("Error fetching user data", { userId }, err);
		return null;
	}
};

/**
 * Calculate account age string
 * @param {Date} createdAt - Account creation date
 * @returns {Object} Account age info
 */
const getAccountAge = createdAt => {
	const now = Date.now();
	const created = new Date(createdAt).getTime();
	const diff = now - created;

	const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
	const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
	const days = Math.floor(diff / (24 * 60 * 60 * 1000));

	let text;
	if (years >= 1) {
		text = `${years} year${years !== 1 ? "s" : ""}`;
	} else if (months >= 1) {
		text = `${months} month${months !== 1 ? "s" : ""}`;
	} else {
		text = `${days} day${days !== 1 ? "s" : ""}`;
	}

	return {
		text,
		raw: new Date(createdAt).toISOString(),
		years,
		months,
		days,
	};
};

/**
 * Get mutual servers between user and viewer
 * @param {Object} client - Discord client
 * @param {string} targetUserId - Profile user ID
 * @param {string} viewerUserId - Viewer user ID (optional)
 * @returns {Array} Array of mutual server objects
 */
const getMutualServers = async (client, targetUserId, viewerUserId = null) => {
	try {
		const servers = await GetGuild.getAll(client, {
			mutualOnlyTo: targetUserId,
			fullResolveMembers: ["OWNER"],
			parse: "noKeys",
		});

		const mutualServers = [];

		for (const svr of servers) {
			// If viewer is provided, only include servers where viewer is also a member
			if (viewerUserId && viewerUserId !== targetUserId) {
				const viewerInServer = svr.members?.[viewerUserId];
				if (!viewerInServer) continue;
			}

			const serverDocument = await CacheManager.getServer(svr.id);
			const memberDocument = serverDocument?.members?.[targetUserId];

			mutualServers.push({
				id: svr.id,
				name: svr.name,
				icon: client.getAvatarURL(svr.id, svr.icon, "icons"),
				memberCount: svr.memberCount,
				owner: svr.members?.[svr.ownerId]?.username || "Unknown",
				ownerId: svr.ownerId,
				memberData: memberDocument ? {
					messages: memberDocument.messages || 0,
					voice: memberDocument.voice || 0,
					rank: memberDocument.rank || "No Rank",
					rankScore: memberDocument.rank_score || 0,
					joinedAt: memberDocument.joined_at,
					bio: memberDocument.server_profile?.bio,
					visibility: memberDocument.server_profile?.visibility || "public",
				} : null,
			});
		}

		return mutualServers.sort((a, b) => a.name.localeCompare(b.name));
	} catch (err) {
		logger.debug("Error fetching mutual servers", { targetUserId }, err);
		return [];
	}
};

/**
 * Check if viewer can see profile
 * @param {Object} userDocument - User document
 * @param {string} viewerId - Viewer user ID
 * @param {string} targetUserId - Target user ID
 * @returns {boolean}
 */
const canViewProfile = (userDocument, viewerId, targetUserId) => {
	// Own profile is always visible
	if (viewerId === targetUserId) return true;
	// Check public setting
	return userDocument?.isProfilePublic !== false;
};

/**
 * Check if viewer can see server profile
 * @param {Object} memberDocument - Member document
 * @param {string} viewerId - Viewer user ID
 * @param {string} targetUserId - Target user ID
 * @param {boolean} viewerInServer - Whether viewer is in the server
 * @param {boolean} viewerIsAdmin - Whether viewer is server admin
 * @returns {boolean}
 */
const canViewServerProfile = (memberDocument, viewerId, targetUserId, viewerInServer, viewerIsAdmin) => {
	// Own profile always visible
	if (viewerId === targetUserId) return true;
	// Admins can always see
	if (viewerIsAdmin) return true;

	const visibility = memberDocument?.server_profile?.visibility || "public";

	if (visibility === "private") return false;
	if (visibility === "members_only") return viewerInServer;
	return true;
};

/**
 * Primary profile page handler
 */
const primaryProfile = async (req, res) => {
	const { userId } = req.params;
	const client = req.app.client;
	const viewerId = req.user?.id;

	// Handle "me" shortcut
	const targetUserId = userId === "me" ? viewerId : userId;

	if (!targetUserId) {
		return res.redirect("/login?redirect=/profile/me");
	}

	// Get user data
	const userData = await getUserData(client, targetUserId);
	if (!userData) {
		return res.status(404).render("pages/error.ejs", {
			authUser: req.user,
			currentPage: "/profile",
			error_line: "User not found",
			error_text: "The user you're looking for doesn't exist or couldn't be found.",
		});
	}

	// Check visibility
	if (!canViewProfile(userData.document, viewerId, targetUserId)) {
		return res.status(403).render("pages/error.ejs", {
			authUser: req.user,
			currentPage: "/profile",
			error_line: "Private Profile",
			error_text: "This user's profile is set to private.",
		});
	}

	// Get mutual servers
	const mutualServers = await getMutualServers(client, targetUserId, viewerId);

	// Get game activity
	const gameActivity = await GameActivityTracker.getUserGameActivity(targetUserId, 8);

	// Calculate total stats across servers
	let totalMessages = 0;
	let totalVoice = 0;
	let topRankCount = 0;

	mutualServers.forEach(svr => {
		if (svr.memberData) {
			totalMessages += svr.memberData.messages || 0;
			totalVoice += svr.memberData.voice || 0;
			if (svr.memberData.rank && svr.memberData.rank !== "No Rank") {
				topRankCount++;
			}
		}
	});

	// Build profile data
	const profile = {
		user: userData,
		isOwnProfile: viewerId === targetUserId,
		accountAge: getAccountAge(userData.createdAt),
		primaryProfile: userData.document?.primary_profile || {},
		profileFields: userData.document?.profile_fields || {},
		points: userData.document?.points || 0,
		gameActivity: gameActivity.map(g => ({
			...g,
			formattedTime: GameActivityTracker.formatPlaytime(g.totalMinutes),
			lastPlayedText: GameActivityTracker.getLastPlayedText(g.lastPlayed),
			percentOfMax: gameActivity.length > 0 ? Math.round((g.totalMinutes / gameActivity[0].totalMinutes) * 100) : 0,
		})),
		gameTrackingEnabled: userData.document?.game_tracking?.show_on_profile !== false,
		stats: {
			totalServers: mutualServers.length,
			totalMessages,
			totalVoice,
			totalVoiceHours: Math.floor(totalVoice / 60),
			topRankCount,
		},
		mutualServers: mutualServers.slice(0, 6),
		allMutualServers: mutualServers,
		featuredServers: (userData.document?.primary_profile?.featured_servers || [])
			.map(svrId => mutualServers.find(s => s.id === svrId))
			.filter(Boolean)
			.slice(0, 3),
		socialLinks: userData.document?.primary_profile?.social_links || {},
	};

	res.render("pages/profile-primary.ejs", {
		authUser: req.user,
		currentPage: "/profile",
		profile,
	});
};

/**
 * Server profile page handler
 */
const serverProfile = async (req, res) => {
	const { userId, serverId } = req.params;
	const client = req.app.client;
	const viewerId = req.user?.id;

	// Handle "me" shortcut
	const targetUserId = userId === "me" ? viewerId : userId;

	if (!targetUserId) {
		return res.redirect(`/login?redirect=/profile/me/${serverId}`);
	}

	// Get user data
	const userData = await getUserData(client, targetUserId);
	if (!userData) {
		return res.status(404).render("pages/error.ejs", {
			authUser: req.user,
			currentPage: "/profile",
			error_line: "User not found",
		});
	}

	// Get server data
	let server;
	try {
		const svr = new GetGuild(client, serverId);
		await svr.initialize(targetUserId, targetUserId);
		if (!svr.success) {
			return res.status(404).render("pages/error.ejs", {
				authUser: req.user,
				currentPage: "/profile",
				error_line: "Server not found",
				error_text: "The server doesn't exist or the user is not a member.",
			});
		}
		server = svr;
	} catch (err) {
		return res.status(404).render("pages/error.ejs", {
			authUser: req.user,
			currentPage: "/profile",
			error_line: "Server not found",
		});
	}

	// Get server document
	const serverDocument = await CacheManager.getServer(serverId);
	const memberDocument = serverDocument?.members?.[targetUserId];

	// Check if viewer is in server
	let viewerInServer = false;
	let viewerIsAdmin = false;
	if (viewerId) {
		try {
			const viewerCheck = new GetGuild(client, serverId);
			await viewerCheck.initialize(viewerId, viewerId);
			viewerInServer = viewerCheck.success;
			if (viewerInServer && serverDocument) {
				const viewerMember = serverDocument.members?.[viewerId];
				viewerIsAdmin = viewerMember?.admin_level > 0 || server.ownerId === viewerId;
			}
		} catch (err) {
			// Viewer not in server
		}
	}

	// Check visibility
	if (!canViewServerProfile(memberDocument, viewerId, targetUserId, viewerInServer, viewerIsAdmin)) {
		return res.status(403).render("pages/error.ejs", {
			authUser: req.user,
			currentPage: "/profile",
			error_line: "Private Profile",
			error_text: "This user's server profile is not visible to you.",
		});
	}

	// Get leaderboard position
	let leaderboardPosition = null;
	let leaderboardData = [];
	if (serverDocument?.members) {
		const membersArray = Object.entries(serverDocument.members)
			.map(([id, m]) => ({ id, rankScore: m.rank_score || 0 }))
			.filter(m => m.rankScore > 0)
			.sort((a, b) => b.rankScore - a.rankScore);

		const userIndex = membersArray.findIndex(m => m.id === targetUserId);
		if (userIndex !== -1) {
			leaderboardPosition = userIndex + 1;
		}

		// Get top 5 for display
		leaderboardData = await Promise.all(
			membersArray.slice(0, 5).map(async (m, idx) => {
				const memberUser = await client.users.fetch(m.id).catch(() => null);
				return {
					position: idx + 1,
					id: m.id,
					username: memberUser?.username || "Unknown",
					avatar: memberUser?.displayAvatarURL({ size: 64 }) || "/static/img/discord-icon.png",
					rankScore: m.rankScore,
					isCurrent: m.id === targetUserId,
				};
			}),
		);
	}

	// Get rank progress
	let rankProgress = null;
	if (serverDocument?.config?.ranks_list?.length > 0 && memberDocument) {
		const currentScore = memberDocument.rank_score || 0;
		const sortedRanks = [...serverDocument.config.ranks_list].sort((a, b) => a.max_score - b.max_score);

		// Find next rank
		const nextRank = sortedRanks.find(r => r.max_score > currentScore);
		if (nextRank) {
			const prevRank = sortedRanks.filter(r => r.max_score <= currentScore).pop();
			const prevScore = prevRank?.max_score || 0;
			const progress = Math.min(100, Math.round(((currentScore - prevScore) / (nextRank.max_score - prevScore)) * 100));

			rankProgress = {
				currentRank: memberDocument.rank || "No Rank",
				nextRank: nextRank._id,
				currentScore,
				nextScore: nextRank.max_score,
				progress,
			};
		}
	}

	const profile = {
		user: userData,
		isOwnProfile: viewerId === targetUserId,
		server: {
			id: server.id,
			name: server.name,
			icon: client.getAvatarURL(server.id, server.icon, "icons"),
			memberCount: server.memberCount,
			owner: server.members?.[server.ownerId]?.username || "Unknown",
		},
		memberData: {
			messages: memberDocument?.messages || 0,
			voice: memberDocument?.voice || 0,
			voiceHours: Math.floor((memberDocument?.voice || 0) / 60),
			rank: memberDocument?.rank || "No Rank",
			rankScore: memberDocument?.rank_score || 0,
			joinedAt: memberDocument?.joined_at,
			lastActive: memberDocument?.last_active,
		},
		serverProfile: memberDocument?.server_profile || {},
		profileFields: memberDocument?.profile_fields || {},
		leaderboardPosition,
		leaderboardData,
		rankProgress,
		viewerInServer,
		viewerIsAdmin,
	};

	res.render("pages/profile-server.ejs", {
		authUser: req.user,
		currentPage: "/profile",
		profile,
	});
};

/**
 * Edit primary profile page
 */
const editPrimaryProfile = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.redirect("/login?redirect=/profile/me/edit");
	}

	const client = req.app.client;
	const userId = req.user.id;

	const userData = await getUserData(client, userId);
	const userDocument = userData?.document;

	const mutualServers = await getMutualServers(client, userId);

	res.render("pages/profile-edit.ejs", {
		authUser: req.user,
		currentPage: "/profile",
		editType: "primary",
		profile: {
			user: userData,
			primaryProfile: userDocument?.primary_profile || {},
			profileFields: userDocument?.profile_fields || {},
			isProfilePublic: userDocument?.isProfilePublic !== false,
			gameTracking: userDocument?.game_tracking || { enabled: true, show_on_profile: true },
			backgroundImage: userDocument?.profile_background_image,
		},
		mutualServers,
	});
};

/**
 * Edit server profile page
 */
const editServerProfile = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.redirect(`/login?redirect=/profile/me/${req.params.serverId}/edit`);
	}

	const { serverId } = req.params;
	const client = req.app.client;
	const userId = req.user.id;

	// Verify user is in server
	const svr = new GetGuild(client, serverId);
	await svr.initialize(userId, userId);

	if (!svr.success) {
		return res.status(403).render("pages/error.ejs", {
			authUser: req.user,
			currentPage: "/profile",
			error_line: "Not a Member",
			error_text: "You are not a member of this server.",
		});
	}

	const serverDocument = await CacheManager.getServer(serverId);
	const memberDocument = serverDocument?.members?.[userId];

	res.render("pages/profile-edit.ejs", {
		authUser: req.user,
		currentPage: "/profile",
		editType: "server",
		server: {
			id: svr.id,
			name: svr.name,
			icon: client.getAvatarURL(svr.id, svr.icon, "icons"),
		},
		profile: {
			serverProfile: memberDocument?.server_profile || {},
			profileFields: memberDocument?.profile_fields || {},
		},
	});
};

/**
 * API: Update primary profile
 */
const updatePrimaryProfile = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const userId = req.user.id;
	const { bio, banner_color, social_links, featured_servers, profile_fields, is_public, game_tracking } = req.body;

	try {
		const userDocument = await CacheManager.getUser(userId);
		if (!userDocument) {
			return res.status(404).json({ error: "User not found" });
		}

		// Validate bio length
		if (bio && bio.length > 1000) {
			return res.status(400).json({ error: "Bio must be 1000 characters or less" });
		}

		// Validate social links
		if (social_links && typeof social_links !== "object") {
			return res.status(400).json({ error: "Invalid social links format" });
		}

		// Validate profile fields
		if (profile_fields) {
			const keys = Object.keys(profile_fields);
			if (keys.length > 10) {
				return res.status(400).json({ error: "Maximum 10 profile fields allowed" });
			}
			for (const key of keys) {
				if (key.length > 100) {
					return res.status(400).json({ error: "Field name must be 100 characters or less" });
				}
				if (typeof profile_fields[key] !== "string" || profile_fields[key].length > 500) {
					return res.status(400).json({ error: "Field value must be 500 characters or less" });
				}
			}
		}

		// Update primary profile
		const updatedPrimaryProfile = {
			bio: bio || "",
			banner_color: banner_color || "#5865F2",
			social_links: social_links || {},
			featured_servers: (featured_servers || []).slice(0, 3),
		};

		userDocument.query.set("primary_profile", updatedPrimaryProfile);

		if (profile_fields !== undefined) {
			userDocument.query.set("profile_fields", profile_fields || {});
		}

		if (is_public !== undefined) {
			userDocument.query.set("isProfilePublic", is_public !== false);
		}

		if (game_tracking !== undefined) {
			userDocument.query.set("game_tracking", {
				enabled: game_tracking.enabled !== false,
				show_on_profile: game_tracking.show_on_profile !== false,
				hidden_games: game_tracking.hidden_games || [],
				show_non_games: game_tracking.show_non_games || false,
			});
		}

		await userDocument.save();

		res.json({ success: true, message: "Profile updated successfully" });
	} catch (err) {
		logger.error("Error updating primary profile", { userId }, err);
		res.status(500).json({ error: "Failed to update profile" });
	}
};

/**
 * API: Update server profile
 */
const updateServerProfile = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const { serverId } = req.params;
	const userId = req.user.id;
	const { bio, banner_color, visibility, profile_fields } = req.body;

	try {
		// Verify user is in server
		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize(userId, userId);

		if (!svr.success) {
			return res.status(403).json({ error: "Not a member of this server" });
		}

		const serverDocument = await CacheManager.getServer(serverId);
		if (!serverDocument) {
			return renderError(res, "Server not found", undefined, 404);
		}

		// Validate bio length
		if (bio && bio.length > 500) {
			return res.status(400).json({ error: "Bio must be 500 characters or less" });
		}

		// Validate visibility
		const validVisibilities = ["public", "members_only", "private"];
		if (visibility && !validVisibilities.includes(visibility)) {
			return res.status(400).json({ error: "Invalid visibility setting" });
		}

		// Validate profile fields
		if (profile_fields) {
			const keys = Object.keys(profile_fields);
			if (keys.length > 10) {
				return res.status(400).json({ error: "Maximum 10 profile fields allowed" });
			}
			for (const key of keys) {
				if (key.length > 100) {
					return res.status(400).json({ error: "Field name must be 100 characters or less" });
				}
				if (typeof profile_fields[key] !== "string" || profile_fields[key].length > 500) {
					return res.status(400).json({ error: "Field value must be 500 characters or less" });
				}
			}
		}

		// Ensure member document exists
		const memberDocument = serverDocument.members?.[userId];
		if (!memberDocument) {
			serverDocument.query.prop("members").push({ _id: userId });
		}

		// Update server profile
		const updatedServerProfile = {
			bio: bio || "",
			banner_color: banner_color || "#5865F2",
			visibility: visibility || "public",
		};

		serverDocument.query.id("members", userId).set("server_profile", updatedServerProfile);

		if (profile_fields !== undefined) {
			serverDocument.query.id("members", userId).set("profile_fields", profile_fields || {});
		}

		await serverDocument.save();

		res.json({ success: true, message: "Server profile updated successfully" });
	} catch (err) {
		logger.error("Error updating server profile", { userId, serverId }, err);
		res.status(500).json({ error: "Failed to update profile" });
	}
};

module.exports = {
	primaryProfile,
	serverProfile,
	editPrimaryProfile,
	editServerProfile,
	updatePrimaryProfile,
	updateServerProfile,
	getUserData,
	getAccountAge,
	getMutualServers,
};
