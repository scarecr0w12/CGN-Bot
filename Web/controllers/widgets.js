/**
 * Widgets Controller
 * Generates embeddable widgets for server stats, leaderboards, etc.
 */

const { GetGuild } = require("../../Modules").getGuild;
const { renderError } = require("../helpers");

const controllers = module.exports;

// Widget themes
const THEMES = {
	dark: {
		bg: "#1a1a2e",
		bgSecondary: "#16213e",
		text: "#ffffff",
		textMuted: "#a0a0a0",
		accent: "#14b8a6",
		border: "#2d2d44",
	},
	light: {
		bg: "#ffffff",
		bgSecondary: "#f5f5f5",
		text: "#1a1a2e",
		textMuted: "#666666",
		accent: "#14b8a6",
		border: "#e0e0e0",
	},
	discord: {
		bg: "#36393f",
		bgSecondary: "#2f3136",
		text: "#ffffff",
		textMuted: "#b9bbbe",
		accent: "#5865f2",
		border: "#42454a",
	},
};

/**
 * Generate server stats widget as SVG
 * GET /widgets/server/:serverId/stats.svg
 */
controllers.serverStatsSvg = async (req, res) => {
	const { serverId } = req.params;
	const theme = THEMES[req.query.theme] || THEMES.dark;
	const width = Math.min(parseInt(req.query.width, 10) || 400, 800);
	const showIcon = req.query.icon !== "false";

	try {
		const serverDocument = await Servers.findOne(serverId);
		if (!serverDocument) {
			return res.status(404).type("image/svg+xml").send(generateErrorSvg("Server not found", theme));
		}

		// Check if public listing is enabled
		if (!serverDocument.config?.public_data?.isShown) {
			return res.status(403).type("image/svg+xml").send(generateErrorSvg("Widget not available", theme));
		}

		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize();

		if (!svr.success) {
			return res.status(404).type("image/svg+xml").send(generateErrorSvg("Server unavailable", theme));
		}

		const stats = {
			name: svr.name,
			memberCount: svr.memberCount || 0,
			messagesCount: serverDocument.messages_today || 0,
			icon: svr.icon ? `https://cdn.discordapp.com/icons/${svr.id}/${svr.icon}.png?size=64` : null,
		};

		const svg = generateServerStatsSvg(stats, theme, width, showIcon);

		res.set({
			"Content-Type": "image/svg+xml",
			"Cache-Control": "public, max-age=300", // Cache for 5 minutes
		});
		res.send(svg);
	} catch (err) {
		logger.warn("Failed to generate widget", { serverId }, err);
		res.status(500).type("image/svg+xml").send(generateErrorSvg("Error loading widget", theme));
	}
};

/**
 * Generate leaderboard widget as SVG
 * GET /widgets/server/:serverId/leaderboard.svg
 */
controllers.leaderboardSvg = async (req, res) => {
	const { serverId } = req.params;
	const theme = THEMES[req.query.theme] || THEMES.dark;
	const width = Math.min(parseInt(req.query.width, 10) || 400, 800);
	const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);

	try {
		const serverDocument = await Servers.findOne(serverId);
		if (!serverDocument) {
			return res.status(404).type("image/svg+xml").send(generateErrorSvg("Server not found", theme));
		}

		if (!serverDocument.config?.public_data?.isShown) {
			return res.status(403).type("image/svg+xml").send(generateErrorSvg("Widget not available", theme));
		}

		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize();

		if (!svr.success) {
			return res.status(404).type("image/svg+xml").send(generateErrorSvg("Server unavailable", theme));
		}

		// Get top members by points
		const members = serverDocument.members || {};
		const leaderboard = Object.entries(members)
			.filter(([, data]) => data.points > 0)
			.sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
			.slice(0, limit)
			.map(([id, data], index) => ({
				rank: index + 1,
				id,
				points: data.points || 0,
				username: svr.members[id]?.username || `User ${id.slice(-4)}`,
			}));

		const svg = generateLeaderboardSvg(svr.name, leaderboard, theme, width);

		res.set({
			"Content-Type": "image/svg+xml",
			"Cache-Control": "public, max-age=300",
		});
		res.send(svg);
	} catch (err) {
		logger.warn("Failed to generate leaderboard widget", { serverId }, err);
		res.status(500).type("image/svg+xml").send(generateErrorSvg("Error loading widget", theme));
	}
};

/**
 * Widget iframe page
 * GET /widgets/server/:serverId/embed
 */
controllers.embedPage = async (req, { res }) => {
	const { serverId } = req.params;
	const widgetType = req.query.type || "stats";
	const theme = req.query.theme || "dark";

	try {
		const serverDocument = await Servers.findOne(serverId);
		if (!serverDocument) {
			return renderError(res, "Server not found", undefined, 404);
		}

		if (!serverDocument.config?.public_data?.isShown) {
			return renderError(res, "Widget not available for this server", undefined, 403);
		}

		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize();

		if (!svr.success) {
			return renderError(res, "Server unavailable", undefined, 404);
		}

		const webp = req.accepts("image/webp") === "image/webp";

		res.setPageData({
			page: "widget-embed.ejs",
			pageTitle: `${svr.name} Widget`,
			minimal: true, // Don't include full header/footer
			serverData: {
				id: svr.id,
				name: svr.name,
				icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons", webp),
				memberCount: svr.memberCount || 0,
				messagesCount: serverDocument.messages_today || 0,
			},
			widgetType,
			theme,
		});

		res.render();
	} catch (err) {
		logger.warn("Failed to load widget embed", { serverId }, err);
		renderError(res, "Failed to load widget");
	}
};

/**
 * Widget configuration/generator page (for dashboard)
 * GET /dashboard/:serverId/widgets
 */
controllers.widgetGenerator = async (req, { res }) => {
	if (!req.isAuthenticated()) {
		return res.redirect("/login");
	}

	const { serverId } = req.params;

	try {
		const svr = new GetGuild(req.app.client, serverId);
		await svr.initialize(req.user.id);

		if (!svr.success) {
			return renderError(res, "Server not found", undefined, 404);
		}

		const serverDocument = await Servers.findOne(serverId);
		if (!serverDocument) {
			return renderError(res, "Server not found", undefined, 404);
		}

		const member = svr.members[req.user.id];
		if (req.app.client.getUserBotAdmin(svr, serverDocument, member) < 1) {
			return renderError(res, "Insufficient permissions", undefined, 403);
		}

		const webp = req.accepts("image/webp") === "image/webp";
		const hostingURL = configJS.hostingURL.replace(/\/$/, "");

		res.setPageData({
			page: "admin-widgets.ejs",
			pageTitle: "Widget Generator",
			serverData: {
				id: svr.id,
				name: svr.name,
				icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons", webp),
			},
			hostingURL,
			isPublic: serverDocument.config?.public_data?.isShown || false,
		});

		res.render();
	} catch (err) {
		logger.warn("Failed to load widget generator", { serverId }, err);
		renderError(res, "Failed to load widget generator");
	}
};

/**
 * Generate error SVG
 */
function generateErrorSvg (message, theme) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
		<rect width="100%" height="100%" fill="${theme.bg}"/>
		<text x="200" y="55" text-anchor="middle" fill="${theme.textMuted}" font-family="Arial, sans-serif" font-size="14">${escapeXml(message)}</text>
	</svg>`;
}

/**
 * Generate server stats SVG widget
 */
function generateServerStatsSvg (stats, theme, width, showIcon) {
	const height = 120;
	const iconSize = 64;
	const padding = 16;

	const iconSection = showIcon && stats.icon ? `
		<defs>
			<clipPath id="iconClip">
				<circle cx="${padding + iconSize / 2}" cy="${height / 2}" r="${iconSize / 2 - 2}"/>
			</clipPath>
		</defs>
		<circle cx="${padding + iconSize / 2}" cy="${height / 2}" r="${iconSize / 2}" fill="${theme.bgSecondary}" stroke="${theme.border}" stroke-width="2"/>
		<image href="${escapeXml(stats.icon)}" x="${padding}" y="${height / 2 - iconSize / 2}" width="${iconSize}" height="${iconSize}" clip-path="url(#iconClip)"/>
	` : "";

	const textX = showIcon && stats.icon ? padding + iconSize + 16 : padding;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
		<rect width="100%" height="100%" fill="${theme.bg}" rx="12"/>
		<rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="${theme.border}" stroke-width="2" rx="10"/>
		${iconSection}
		<text x="${textX}" y="40" fill="${theme.text}" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${escapeXml(truncate(stats.name, 25))}</text>
		<text x="${textX}" y="65" fill="${theme.textMuted}" font-family="Arial, sans-serif" font-size="13">
			<tspan fill="${theme.accent}" font-weight="bold">${formatNumber(stats.memberCount)}</tspan> members
		</text>
		<text x="${textX}" y="90" fill="${theme.textMuted}" font-family="Arial, sans-serif" font-size="13">
			<tspan fill="${theme.accent}" font-weight="bold">${formatNumber(stats.messagesCount)}</tspan> messages today
		</text>
		<text x="${width - padding}" y="${height - 10}" text-anchor="end" fill="${theme.textMuted}" font-family="Arial, sans-serif" font-size="10">Powered by Skynet</text>
	</svg>`;
}

/**
 * Generate leaderboard SVG widget
 */
function generateLeaderboardSvg (serverName, leaderboard, theme, width) {
	const rowHeight = 36;
	const headerHeight = 50;
	const footerHeight = 24;
	const height = headerHeight + leaderboard.length * rowHeight + footerHeight + 16;
	const padding = 16;

	const rows = leaderboard.map((entry, i) => {
		const y = headerHeight + i * rowHeight + 24;
		const medalColors = ["#ffd700", "#c0c0c0", "#cd7f32"];
		const medalColor = i < 3 ? medalColors[i] : theme.textMuted;

		return `
			<rect x="${padding}" y="${y - 20}" width="${width - padding * 2}" height="${rowHeight - 4}" fill="${theme.bgSecondary}" rx="6"/>
			<text x="${padding + 12}" y="${y}" fill="${medalColor}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">#${entry.rank}</text>
			<text x="${padding + 50}" y="${y}" fill="${theme.text}" font-family="Arial, sans-serif" font-size="14">${escapeXml(truncate(entry.username, 20))}</text>
			<text x="${width - padding - 10}" y="${y}" text-anchor="end" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${formatNumber(entry.points)} pts</text>
		`;
	}).join("");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
		<rect width="100%" height="100%" fill="${theme.bg}" rx="12"/>
		<rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="${theme.border}" stroke-width="2" rx="10"/>
		<text x="${width / 2}" y="32" text-anchor="middle" fill="${theme.text}" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${escapeXml(truncate(serverName, 30))} Leaderboard</text>
		${rows}
		<text x="${width - padding}" y="${height - 10}" text-anchor="end" fill="${theme.textMuted}" font-family="Arial, sans-serif" font-size="10">Powered by Skynet</text>
	</svg>`;
}

/**
 * Escape XML special characters
 */
function escapeXml (str) {
	if (!str) return "";
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * Format number with K/M suffix
 */
function formatNumber (num) {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
	if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
	return String(num);
}

/**
 * Truncate string
 */
function truncate (str, len) {
	if (!str) return "";
	return str.length > len ? `${str.substring(0, len)}...` : str;
}
