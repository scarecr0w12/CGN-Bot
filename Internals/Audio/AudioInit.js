/**
 * AudioInit - Initializes play-dl with YouTube cookies for proper functionality
 * YouTube requires cookies to work correctly with play-dl
 */
const playDl = require("play-dl");
const fs = require("fs");
const path = require("path");

class AudioInit {
	static async initialize () {
		try {
			// Check for YouTube cookies file
			const cookiePath = path.join(__dirname, "../../.youtube-cookies.json");

			if (fs.existsSync(cookiePath)) {
				const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
				await playDl.setToken({
					youtube: {
						cookie: cookies.cookie || cookies,
					},
				});
				logger.info("YouTube cookies loaded for play-dl");
				return true;
			} else {
				logger.warn("No YouTube cookies found at .youtube-cookies.json - Music commands may not work properly");
				logger.warn("See https://github.com/play-dl/play-dl/tree/main/instructions for setup instructions");
				return false;
			}
		} catch (error) {
			logger.error("Failed to initialize play-dl with YouTube cookies", {}, error);
			return false;
		}
	}

	static async refreshCookies () {
		// Re-initialize with fresh cookies
		return AudioInit.initialize();
	}
}

module.exports = AudioInit;
