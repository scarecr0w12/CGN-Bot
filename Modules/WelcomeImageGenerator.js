const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const Logger = require("../Internals/Logger");
const logger = new Logger("WelcomeImageGenerator");

class WelcomeImageGenerator {
	constructor (client) {
		this.client = client;
		this.fontPath = path.join(__dirname, "../assets/fonts");
		this.templatePath = path.join(__dirname, "../assets/welcome-templates");
		this.uploadPath = path.join(__dirname, "../uploads/welcome-backgrounds");

		// Register custom fonts if available
		this.registerFonts();
	}

	registerFonts () {
		try {
			const fonts = [
				{ family: "Roboto", file: "Roboto-Regular.ttf" },
				{ family: "Roboto-Bold", file: "Roboto-Bold.ttf" },
				{ family: "OpenSans", file: "OpenSans-Regular.ttf" },
				{ family: "Montserrat", file: "Montserrat-Regular.ttf" },
			];

			fonts.forEach(font => {
				const fontFilePath = path.join(this.fontPath, font.file);
				try {
					registerFont(fontFilePath, { family: font.family });
					logger.debug(`Registered font: ${font.family}`);
				} catch (err) {
					logger.debug(`Font not found: ${font.file}, using system defaults`);
				}
			});
		} catch (err) {
			logger.warn("Font registration failed, using system fonts:", err);
		}
	}

	async generateWelcomeImage (member, config) {
		try {
			const canvas = createCanvas(config.width || 1024, config.height || 450);
			const ctx = canvas.getContext("2d");

			// 1. Draw background
			await this.drawBackground(ctx, canvas, config);

			// 2. Draw avatar
			if (config.avatar?.enabled !== false) {
				await this.drawAvatar(ctx, canvas, member, config.avatar);
			}

			// 3. Draw text
			if (config.text?.enabled !== false) {
				this.drawText(ctx, canvas, member, config.text);
			}

			// 4. Draw subtitle
			if (config.subtitle?.enabled !== false) {
				this.drawSubtitle(ctx, canvas, member, config.subtitle);
			}

			// Return buffer
			const format = config.format || "png";
			const quality = (config.quality || 90) / 100;

			if (format === "jpeg") {
				return canvas.toBuffer("image/jpeg", { quality });
			}
			return canvas.toBuffer("image/png");
		} catch (err) {
			logger.error("Error generating welcome image:", err);
			throw err;
		}
	}

	async drawBackground (ctx, canvas, config) {
		const bg = config.background || {};

		if (bg.type === "color") {
			// Solid color background
			ctx.fillStyle = bg.value || "#7289DA";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		} else if (bg.type === "custom") {
			// Custom uploaded image
			try {
				const customBg = await loadImage(bg.value);
				ctx.drawImage(customBg, 0, 0, canvas.width, canvas.height);
			} catch (err) {
				logger.error("Failed to load custom background, using fallback:", err);
				ctx.fillStyle = "#7289DA";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		} else {
			// Built-in template
			try {
				const templateName = bg.value || "default";
				const templatePath = path.join(this.templatePath, `${templateName}.png`);
				const template = await loadImage(templatePath);
				ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
			} catch (err) {
				logger.error("Failed to load template, using fallback:", err);
				// Gradient fallback
				const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
				gradient.addColorStop(0, "#5865F2");
				gradient.addColorStop(1, "#7289DA");
				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
	}

	async drawAvatar (ctx, canvas, member, avatarConfig) {
		try {
			const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
			const avatar = await loadImage(avatarURL);

			// Calculate position (percentage to pixels)
			const x = (avatarConfig.x / 100) * canvas.width;
			const y = (avatarConfig.y / 100) * canvas.height;
			const size = avatarConfig.size || 150;

			// Draw border if enabled
			if (avatarConfig.border?.enabled) {
				ctx.save();
				ctx.beginPath();
				ctx.arc(x, y, size / 2 + (avatarConfig.border.width || 5), 0, Math.PI * 2);
				ctx.fillStyle = avatarConfig.border.color || "#FFFFFF";
				ctx.fill();
				ctx.restore();
			}

			// Draw circular avatar
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, size / 2, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, x - size / 2, y - size / 2, size, size);
			ctx.restore();
		} catch (err) {
			logger.error("Failed to load avatar:", err);
		}
	}

	drawText (ctx, canvas, member, textConfig) {
		const text = this.parseTemplate(textConfig.template || "Welcome {username}!", member);
		const x = (textConfig.x / 100) * canvas.width;
		const y = (textConfig.y / 100) * canvas.height;

		ctx.font = `${textConfig.size || 48}px ${textConfig.font || "Arial"}`;
		ctx.fillStyle = textConfig.color || "#FFFFFF";
		ctx.textAlign = textConfig.align || "center";

		// Draw stroke if enabled
		if (textConfig.stroke?.enabled) {
			ctx.strokeStyle = textConfig.stroke.color || "#000000";
			ctx.lineWidth = textConfig.stroke.width || 2;
			ctx.strokeText(text, x, y);
		}

		ctx.fillText(text, x, y);
	}

	drawSubtitle (ctx, canvas, member, subtitleConfig) {
		const text = this.parseTemplate(subtitleConfig.template || "Member #{memberCount}", member);
		const x = (subtitleConfig.x / 100) * canvas.width;
		const y = (subtitleConfig.y / 100) * canvas.height;

		ctx.font = `${subtitleConfig.size || 24}px ${subtitleConfig.font || "Arial"}`;
		ctx.fillStyle = subtitleConfig.color || "#CCCCCC";
		ctx.textAlign = subtitleConfig.align || "center";

		ctx.fillText(text, x, y);
	}

	parseTemplate (template, member) {
		return template
			.replace(/\{username\}/g, member.user.username)
			.replace(/\{tag\}/g, member.user.tag)
			.replace(/\{discriminator\}/g, member.user.discriminator || "0")
			.replace(/\{mention\}/g, `@${member.user.username}`)
			.replace(/\{server\}/g, member.guild.name)
			.replace(/\{memberCount\}/g, member.guild.memberCount.toString())
			.replace(/\{id\}/g, member.id);
	}

	async getServerConfig (serverId) {
		const WelcomeImages = this.client.database.models.welcomeImages;
		const config = await WelcomeImages.findOne({ server_id: serverId }).exec();
		return config;
	}

	async checkTierLimits (serverId) {
		const serverDocument = await this.client.database.get(serverId, "servers");
		const tier = serverDocument?.tier || "free";

		const limits = {
			free: { templates: 3, customUploads: 0 },
			starter: { templates: 10, customUploads: 1 },
			premium: { templates: -1, customUploads: -1 },
		};

		return limits[tier] || limits.free;
	}
}

module.exports = WelcomeImageGenerator;
