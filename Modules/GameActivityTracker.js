/**
 * Game Activity Tracker Module
 * Tracks user game playtime based on Discord presence updates
 */

// Common non-game applications to filter out by default
const NON_GAME_APPS = [
	"spotify",
	"visual studio code",
	"vscode",
	"code",
	"discord",
	"chrome",
	"firefox",
	"edge",
	"safari",
	"slack",
	"zoom",
	"teams",
	"obs",
	"obs studio",
	"streamlabs",
	"notion",
	"figma",
	"photoshop",
	"illustrator",
	"premiere",
	"after effects",
	"terminal",
	"iterm",
	"hyper",
	"sublime text",
	"atom",
	"intellij",
	"webstorm",
	"pycharm",
	"android studio",
	"xcode",
];

/**
 * Normalize game name for consistent tracking
 * @param {string} name - Game name
 * @returns {string} Normalized game name (lowercase, trimmed)
 */
const normalizeGameName = name => {
	if (!name) return "";
	return name.toLowerCase().trim();
};

/**
 * Check if an activity is likely a non-game application
 * @param {string} name - Activity name
 * @returns {boolean}
 */
const isNonGame = name => {
	if (!name) return true;
	const normalized = normalizeGameName(name);
	return NON_GAME_APPS.some(app => normalized.includes(app));
};

/**
 * Start tracking a game session
 * @param {Object} serverDocument - Server document
 * @param {string} userId - User ID
 * @param {string} gameName - Game name
 */
const startSession = async (serverDocument, userId, gameName) => {
	if (!serverDocument || !userId || !gameName) return;

	// Check if session already exists - handle both array and Map/object formats
	const gameSessions = serverDocument.game_sessions;
	let existingSession = null;

	if (Array.isArray(gameSessions)) {
		existingSession = gameSessions.find(s => s._id === userId);
	} else if (gameSessions && typeof gameSessions === "object") {
		// Map-like object access
		existingSession = gameSessions[userId] || (gameSessions.id ? gameSessions.id(userId) : null);
	}

	if (existingSession) {
		// End existing session first if game changed
		if (existingSession.game_name !== gameName) {
			await endSession(serverDocument, userId);
		} else {
			// Same game, already tracking
			return;
		}
	}

	// Start new session - only if game_sessions exists as an array
	if (!Array.isArray(serverDocument.game_sessions)) {
		// game_sessions not initialized as array, skip tracking for this server
		return;
	}

	logger.verbose(`Starting game session for ${userId}: ${gameName}`, { svrid: serverDocument._id });
	serverDocument.query.push("game_sessions", {
		_id: userId,
		game_name: gameName,
		started_at: new Date(),
	});

	await serverDocument.save().catch(err => {
		logger.debug(`Failed to save game session start`, { svrid: serverDocument._id, usrid: userId }, err);
	});
};

/**
 * End a game session and record playtime
 * @param {Object} serverDocument - Server document
 * @param {string} userId - User ID
 * @returns {Object|null} Session data with duration, or null if no session
 */
const endSession = async (serverDocument, userId) => {
	if (!serverDocument || !userId) return null;

	// Handle both array and Map/object formats
	const gameSessions = serverDocument.game_sessions;
	let session = null;

	if (Array.isArray(gameSessions)) {
		session = gameSessions.find(s => s._id === userId);
	} else if (gameSessions && typeof gameSessions === "object") {
		// Map-like object access
		session = gameSessions[userId] || (gameSessions.id ? gameSessions.id(userId) : null);
	}

	if (!session) return null;

	const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000);
	const gameName = session.game_name;
	const normalizedName = normalizeGameName(gameName);

	logger.verbose(`Ending game session for ${userId}: ${gameName} (${duration} minutes)`, { svrid: serverDocument._id });

	// Remove session from server - only if game_sessions is an array
	if (Array.isArray(serverDocument.game_sessions)) {
		serverDocument.query.pull("game_sessions", userId);
		await serverDocument.save().catch(err => {
			logger.debug(`Failed to save game session end`, { svrid: serverDocument._id, usrid: userId }, err);
		});
	}

	// Update user's game activity stats
	if (duration > 0) {
		try {
			const userDocument = await Users.findOne(userId);
			if (userDocument) {
				// Check if user has game tracking enabled
				if (userDocument.game_tracking?.enabled === false) {
					return { gameName, duration, recorded: false };
				}

				// Find or create game activity entry
				const gameActivity = userDocument.game_activity?.find(g => g._id === normalizedName);

				if (gameActivity) {
					// Update existing game
					userDocument.query.id("game_activity", normalizedName).set("total_minutes", (gameActivity.total_minutes || 0) + duration);
					userDocument.query.id("game_activity", normalizedName).set("session_count", (gameActivity.session_count || 0) + 1);
					userDocument.query.id("game_activity", normalizedName).set("last_played", new Date());
				} else {
					// Add new game
					userDocument.query.push("game_activity", {
						_id: normalizedName,
						display_name: gameName,
						total_minutes: duration,
						session_count: 1,
						first_played: new Date(),
						last_played: new Date(),
					});
				}

				await userDocument.save().catch(err => {
					logger.debug(`Failed to save user game activity`, { usrid: userId }, err);
				});

				return { gameName, duration, recorded: true };
			}
		} catch (err) {
			logger.debug(`Error updating game activity`, { usrid: userId }, err);
		}
	}

	return { gameName, duration, recorded: duration > 0 };
};

/**
 * Handle presence update for game tracking
 * @param {Object} oldPresence - Old presence
 * @param {Object} newPresence - New presence
 */
const handlePresenceUpdate = async (oldPresence, newPresence) => {
	if (!newPresence?.guild?.id || !newPresence?.user?.id) return;

	const userId = newPresence.user.id;
	const guildId = newPresence.guild.id;

	// Get current and old game activities (type 0 = Playing)
	const oldGame = oldPresence?.activities?.find(a => a.type === 0);
	const newGame = newPresence?.activities?.find(a => a.type === 0);

	const oldGameName = oldGame?.name;
	const newGameName = newGame?.name;

	// No change in game
	if (oldGameName === newGameName) return;

	// Get server document
	const serverDocument = await Servers.findOne(guildId);
	if (!serverDocument) return;

	// Check user's tracking settings
	const userDocument = await Users.findOne(userId);
	if (userDocument?.game_tracking?.enabled === false) return;

	// Check if we should filter non-games
	const showNonGames = userDocument?.game_tracking?.show_non_games ?? false;

	// Game ended
	if (oldGameName && !newGameName) {
		await endSession(serverDocument, userId);
	} else if (!oldGameName && newGameName) {
		// Game started - Filter non-games if setting is disabled
		if (!showNonGames && isNonGame(newGameName)) return;
		// Check if game is hidden
		if (userDocument?.game_tracking?.hidden_games?.includes(normalizeGameName(newGameName))) return;
		await startSession(serverDocument, userId, newGameName);
	} else if (oldGameName !== newGameName) {
		// Game changed
		await endSession(serverDocument, userId);
		// Filter non-games if setting is disabled
		if (!showNonGames && isNonGame(newGameName)) return;
		// Check if game is hidden
		if (userDocument?.game_tracking?.hidden_games?.includes(normalizeGameName(newGameName))) return;
		await startSession(serverDocument, userId, newGameName);
	}
};

/**
 * Get user's game activity for profile display
 * @param {string} userId - User ID
 * @param {number} limit - Max number of games to return
 * @returns {Array} Sorted game activity array
 */
const getUserGameActivity = async (userId, limit = 10) => {
	const userDocument = await Users.findOne(userId);
	if (!userDocument) return [];

	// Check if game tracking is enabled and visible
	if (userDocument.game_tracking?.enabled === false) return [];
	if (userDocument.game_tracking?.show_on_profile === false) return [];

	const games = userDocument.game_activity || [];
	const hiddenGames = userDocument.game_tracking?.hidden_games || [];
	const showNonGames = userDocument.game_tracking?.show_non_games ?? false;

	// Filter and sort games
	return games
		.filter(g => !hiddenGames.includes(g._id))
		.filter(g => showNonGames || !isNonGame(g._id))
		.sort((a, b) => (b.total_minutes || 0) - (a.total_minutes || 0))
		.slice(0, limit)
		.map(g => ({
			id: g._id,
			name: g.display_name || g._id,
			totalMinutes: g.total_minutes || 0,
			totalHours: Math.floor((g.total_minutes || 0) / 60),
			sessionCount: g.session_count || 0,
			lastPlayed: g.last_played,
			firstPlayed: g.first_played,
		}));
};

/**
 * Format playtime for display
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted time string
 */
const formatPlaytime = minutes => {
	if (!minutes || minutes < 1) return "< 1 min";
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""}`;
	const days = Math.floor(hours / 24);
	const remainingHours = hours % 24;
	if (remainingHours === 0) return `${days} day${days !== 1 ? "s" : ""}`;
	return `${days}d ${remainingHours}h`;
};

/**
 * Get relative time string for last played
 * @param {Date} date - Last played date
 * @returns {string} Relative time string
 */
const getLastPlayedText = date => {
	if (!date) return "Never";
	const now = Date.now();
	const then = new Date(date).getTime();
	const diff = now - then;

	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
	if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} ago`;
	return new Date(date).toLocaleDateString();
};

module.exports = {
	normalizeGameName,
	isNonGame,
	startSession,
	endSession,
	handlePresenceUpdate,
	getUserGameActivity,
	formatPlaytime,
	getLastPlayedText,
	NON_GAME_APPS,
};
