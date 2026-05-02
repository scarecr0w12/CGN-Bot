const Logger = require("../../../Internals/Logger");
const logger = new Logger("Dashboard-WelcomeImages");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Configure multer for background uploads
const storage = multer.diskStorage({
	destination: async (req, file, cb) => {
		const uploadDir = path.join(__dirname, "../../../uploads/welcome-backgrounds");
		await fs.mkdir(uploadDir, { recursive: true });
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
		cb(null, `${req.svr._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
	fileFilter: (req, file, cb) => {
		const allowedTypes = /jpeg|jpg|png/;
		const mimetype = allowedTypes.test(file.mimetype);
		const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

		if (mimetype && extname) {
			return cb(null, true);
		}
		cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
	},
});

module.exports = {
	// GET /dashboard/:id/welcome-images
	async index (req, res) {
		try {
			const { serverDocument } = req;
			const WelcomeImages = req.app.get("client").database.models.welcomeImages;

			const config = await WelcomeImages.findOne({ server_id: serverDocument._id }).exec();

			const channels = req.app.client.guilds.cache.get(req.svr.id)?.channels.cache
				.filter(c => c.isTextBased())
				.map(c => ({ id: c.id, name: c.name })) ||
				[];

			const tier = serverDocument.tier || "free";
			const tierLimits = {
				free: { templates: 3, customUploads: 0 },
				starter: { templates: 10, customUploads: 1 },
				premium: { templates: -1, customUploads: -1 },
			};
			const limits = tierLimits[tier];

			const builtInTemplates = [
				{ id: "default", name: "Discord Blue Gradient", preview: "/img/welcome-templates/default-preview.png" },
				{ id: "dark", name: "Midnight Black", preview: "/img/welcome-templates/dark-preview.png" },
				{ id: "modern", name: "Purple Wave", preview: "/img/welcome-templates/modern-preview.png" },
			];

			res.render("pages/dashboard/welcome-images", {
				title: "Welcome Images",
				config: config || null,
				channels,
				builtInTemplates,
				limits,
				tier,
			});
		} catch (error) {
			logger.error("Error loading welcome images page:", error);
			res.status(500).render("pages/error", {
				title: "Error",
				statusCode: 500,
				message: "Failed to load welcome images",
			});
		}
	},

	// POST /dashboard/:id/welcome-images
	async update (req, res) {
		try {
			const { serverDocument } = req;
			const {
				enabled,
				channel_id,
				template_id,
				background_type,
				background_value,
				avatar_enabled,
				avatar_x,
				avatar_y,
				avatar_size,
				text_template,
				text_size,
				text_color,
				subtitle_template,
			} = req.body;

			const WelcomeImages = req.app.get("client").database.models.welcomeImages;
			const config = await WelcomeImages.findOne({ server_id: serverDocument._id }).exec();

			const updateData = {
				enabled: enabled === "true",
				channel_id: channel_id || null,
				template_id: template_id || "default",
				background: {
					type: background_type || "builtin",
					value: background_value || "default",
				},
				avatar: {
					enabled: avatar_enabled !== "false",
					x: parseInt(avatar_x) || 50,
					y: parseInt(avatar_y) || 30,
					size: parseInt(avatar_size) || 150,
				},
				text: {
					template: text_template || "Welcome {username}!",
					size: parseInt(text_size) || 48,
					color: text_color || "#FFFFFF",
				},
				subtitle: {
					template: subtitle_template || "Member #{memberCount}",
				},
				updated_at: new Date(),
			};

			if (!config) {
				await WelcomeImages.create({
					server_id: serverDocument._id,
					...updateData,
				});
			} else {
				await WelcomeImages.update(
					{ server_id: serverDocument._id },
					updateData,
				);
			}

			res.json({ success: true });
		} catch (error) {
			logger.error("Error updating welcome images:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// POST /dashboard/:id/welcome-images/upload
	uploadBackground: [
		upload.single("background"),
		async (req, res) => {
			try {
				const { serverDocument } = req;

				if (!req.file) {
					return res.status(400).json({
						success: false,
						error: "No file uploaded",
					});
				}

				// Check tier limits
				const tier = serverDocument.tier || "free";
				if (tier === "free") {
					await fs.unlink(req.file.path);
					return res.status(403).json({
						success: false,
						error: "Custom background uploads require Tier 1 or higher",
					});
				}

				const WelcomeImageUploads = req.app.get("client").database.models.welcomeImageUploads;

				// Check upload limit for Tier 1
				if (tier === "starter") {
					const existingUploads = await WelcomeImageUploads.find({ server_id: serverDocument._id }).exec();
					if (existingUploads.length >= 1) {
						await fs.unlink(req.file.path);
						return res.status(403).json({
							success: false,
							error: "Tier 1 allows only 1 custom background. Upgrade to Tier 2 for unlimited uploads.",
						});
					}
				}

				// Save upload record
				const uploadRecord = await WelcomeImageUploads.create({
					server_id: serverDocument._id,
					filename: req.file.filename,
					filepath: req.file.path,
					mimetype: req.file.mimetype,
					size: req.file.size,
				});

				res.json({
					success: true,
					upload: {
						id: uploadRecord._id,
						filename: req.file.filename,
						url: `/uploads/welcome-backgrounds/${req.file.filename}`,
					},
				});
			} catch (error) {
				logger.error("Error uploading background:", error);
				if (req.file) {
					await fs.unlink(req.file.path).catch(e => logger.debug("Failed to delete temp file:", e));
				}
				res.status(500).json({
					success: false,
					error: error.message,
				});
			}
		},
	],

	// DELETE /dashboard/:id/welcome-images/upload/:uploadId
	async deleteUpload (req, res) {
		try {
			const { serverDocument } = req;
			const { uploadId } = req.params;

			const WelcomeImageUploads = req.app.get("client").database.models.welcomeImageUploads;
			const uploadDoc = await WelcomeImageUploads.findOne({
				_id: uploadId,
				server_id: serverDocument._id,
			}).exec();

			if (!uploadDoc) {
				return res.status(404).json({
					success: false,
					error: "Upload not found",
				});
			}

			// Delete file
			await fs.unlink(uploadDoc.filepath).catch(err => {
				logger.warn("Failed to delete upload file:", err);
			});

			// Delete record
			await WelcomeImageUploads.delete({ _id: uploadId });

			res.json({ success: true });
		} catch (error) {
			logger.error("Error deleting upload:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},

	// POST /dashboard/:id/welcome-images/test
	async generateTest (req, res) {
		try {
			const { serverDocument } = req;
			const welcomeGenerator = req.app.get("client").welcomeImageGenerator;

			if (!welcomeGenerator) {
				return res.status(503).json({
					success: false,
					error: "Welcome image generator not available",
				});
			}

			const config = await welcomeGenerator.getServerConfig(serverDocument._id);
			if (!config) {
				return res.status(404).json({
					success: false,
					error: "No welcome image configuration found",
				});
			}

			// Create mock member for testing
			const guild = req.app.client.guilds.cache.get(req.svr.id);
			const mockMember = {
				user: {
					username: req.user.username || "TestUser",
					tag: req.user.username || "TestUser",
					discriminator: req.user.discriminator || "0000",
					displayAvatarURL: () => req.user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png",
				},
				guild: {
					name: guild?.name || "Test Server",
					memberCount: guild?.memberCount || 100,
				},
				id: req.user.id,
			};

			const imageBuffer = await welcomeGenerator.generateWelcomeImage(mockMember, config);

			res.set("Content-Type", `image/${config.format || "png"}`);
			res.send(imageBuffer);
		} catch (error) {
			logger.error("Error generating test image:", error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	},
};
