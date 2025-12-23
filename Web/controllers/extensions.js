const path = require("path");
const fs = require("fs-nextra");
const ObjectId = require("../../Database/ObjectID");

const parsers = require("../parsers");
const { GetGuild } = require("../../Modules").getGuild;
const { AllowedEvents, Colors, Scopes, NetworkCapabilities, ExtensionTags } = require("../../Internals/Constants");
const { renderError, dashboardUpdate, generateCodeID, getChannelData, validateExtensionData, writeExtensionData } = require("../helpers");
const PremiumExtensionsManager = require("../../Modules/PremiumExtensionsManager");
const VoteRewardsManager = require("../../Modules/VoteRewardsManager");
const { generateUniqueSlug } = require("../../Modules/Utils/Slug");
const CacheManager = require("../../Modules/CacheManager");

const controllers = module.exports;

// Extension package format version for cross-instance compatibility
const PACKAGE_VERSION = "1.0";

controllers.gallery = async (req, { res }) => {
	let count;
	if (!req.query.count) {
		count = 18;
	} else {
		count = parseInt(req.query.count);
	}
	let page;
	if (!req.query.page) {
		page = 1;
	} else {
		page = parseInt(req.query.page);
	}

	// Sort options
	const sortOption = req.query.sort || "featured";
	const sortMap = {
		featured: { featured: -1, points: -1, last_updated: -1 },
		popular: { points: -1, last_updated: -1 },
		newest: { last_updated: -1 },
		oldest: { last_updated: 1 },
		name: { name: 1 },
	};
	const sortCriteria = sortMap[sortOption] || sortMap.featured;

	// Category filter (extension type)
	const categoryFilter = req.query.category;
	const validCategories = ["command", "keyword", "timer", "event"];

	const premiumFilter = req.query.premium;
	const validPremiumFilters = ["all", "free", "premium"];

	// Tag filter
	const tagFilter = req.query.tag;

	const renderPage = async (upvotedData, serverData) => {
		const extensionState = req.path.substring(req.path.lastIndexOf("/") + 1);
		const ConfigManager = require("../../Modules/ConfigManager");
		const extSettings = await ConfigManager.get();
		const extensionLevel = extensionState === "gallery" ? ["gallery"] : req.isAuthenticated() && extSettings.maintainers.includes(req.user.id) ? ["gallery", "third"] : ["gallery"];
		try {
			// Base criteria for counting
			const baseCriteria = {
				state: { $in: ["version_queue", extensionState] },
				level: { $in: extensionLevel },
			};

			let rawCount = await Gallery.count(baseCriteria);
			if (!rawCount) {
				rawCount = 0;
			}

			const matchCriteria = { ...baseCriteria };
			if (req.query.id) {
				matchCriteria._id = new ObjectId(req.query.id);
			} else if (req.query.q) {
				// Use $regex for text search (works with both MongoDB and MariaDB)
				matchCriteria.$or = [
					{ name: { $regex: req.query.q } },
					{ description: { $regex: req.query.q } },
				];
			}

			// Filter by tag if specified
			if (tagFilter && ExtensionTags.includes(tagFilter)) {
				matchCriteria.tags = tagFilter;
			}

			// Get all extensions first, then filter by category client-side since type is in versions subdocument
			const galleryDocuments = await Gallery.find(matchCriteria).sort(sortCriteria).skip(count * (page - 1))
				.limit(count)
				.exec();
			const pageTitle = `${extensionState.charAt(0).toUpperCase() + extensionState.slice(1)} - Skynet Extensions`;
			let extensionData = await Promise.all(galleryDocuments.filter(galleryDocument => (galleryDocument.published_version !== null && !isNaN(galleryDocument.published_version)) ||
				extensionState === "queue")
				.map(a => parsers.extensionData(req, a, extensionState === "queue" ? a.version : a.published_version)));

			// Count extensions by category for filter badges (from all matching docs, not just paginated)
			const allGalleryDocs = await Gallery.find(matchCriteria).exec();
			const allExtData = await Promise.all(allGalleryDocs.filter(doc => (doc.published_version !== null && !isNaN(doc.published_version)) ||
				extensionState === "queue")
				.map(a => parsers.extensionData(req, a, extensionState === "queue" ? a.version : a.published_version)));

			const categoryCounts = {
				all: allExtData.length,
				command: 0,
				keyword: 0,
				timer: 0,
				event: 0,
			};
			allExtData.forEach(ext => {
				if (categoryCounts[ext.type] !== undefined) {
					categoryCounts[ext.type]++;
				}
			});

			const premiumCounts = {
				all: allExtData.length,
				free: 0,
				premium: 0,
			};
			allExtData.forEach(ext => {
				if (ext && ext.isPremium) premiumCounts.premium++;
				else premiumCounts.free++;
			});

			const tagCounts = {};
			ExtensionTags.forEach(tag => { tagCounts[tag] = 0; });
			allExtData.forEach(ext => {
				if (ext.tags && Array.isArray(ext.tags)) {
					ext.tags.forEach(tag => {
						if (tagCounts[tag] !== undefined) tagCounts[tag]++;
					});
				}
			});

			// Filter by category if specified
			if (categoryFilter && validCategories.includes(categoryFilter)) {
				extensionData = extensionData.filter(ext => ext.type === categoryFilter);
			}

			const premiumFilterValue = validPremiumFilters.includes(premiumFilter) ? premiumFilter : "all";
			if (premiumFilterValue === "premium") {
				extensionData = extensionData.filter(ext => ext && ext.isPremium);
			} else if (premiumFilterValue === "free") {
				extensionData = extensionData.filter(ext => ext && !ext.isPremium);
			}

			res.setPageData({
				page: "extensions.ejs",
				pageTitle,
				serverData,
				activeSearchQuery: req.query.id || req.query.q,
				mode: extensionState,
				rawCount,
				itemsPerPage: req.query.count,
				currentPage: page,
				numPages: Math.ceil(rawCount / (count === 0 ? rawCount : count)),
				extensions: extensionData,
				upvotedData,
				sortOption,
				categoryFilter: categoryFilter || "all",
				premiumFilter: premiumFilterValue,
				tagFilter: tagFilter || "all",
				extensionTags: ExtensionTags,
				categoryCounts,
				premiumCounts,
				tagCounts,
			});

			res.render();
		} catch (err) {
			logger.error("Failed to fetch extension data", { path: req.path }, err);
			renderError(res, "An error occurred while fetching extension data.");
		}
	};

	if (req.isAuthenticated()) {
		const serverData = [];
		const usr = await req.app.client.users.fetch(req.user.id, true);
		const addServerData = async (i, callback) => {
			if (req.user.guilds && i < req.user.guilds.length) {
				if (!usr) return addServerData(++i, callback);
				const svr = new GetGuild(req.app.client, req.user.guilds[i].id);
				await svr.initialize(usr.id);
				if (svr.success) {
					try {
						const serverDocument = await CacheManager.getServer(svr.id);
						if (serverDocument) {
							const member = svr.members[usr.id];
							if (req.app.client.getUserBotAdmin(svr, serverDocument, member) >= 3) {
								serverData.push({
									name: req.user.guilds[i].name,
									id: req.user.guilds[i].id,
									icon: req.user.guilds[i].icon ? `https://cdn.discordapp.com/icons/${req.user.guilds[i].id}/${req.user.guilds[i].icon}.jpg` : "/static/img/discord-icon.png",
									prefix: serverDocument.config.command_prefix,
								});
							}
						}
					} catch (_) {
						// Meh
					}
					addServerData(++i, callback);
				} else {
					addServerData(++i, callback);
				}
			} else {
				try {
					return callback();
				} catch (err) {
					renderError(res, "An error occurred while fetching user data.");
				}
			}
		};
		addServerData(0, async () => {
			serverData.sort((a, b) => a.name.localeCompare(b.name));
			const userDocument = await CacheManager.getUser(req.user.id);
			if (userDocument) {
				renderPage(userDocument.upvoted_gallery_extensions, serverData);
			} else {
				renderPage([], serverData);
			}
		});
	} else {
		renderPage();
	}
};

controllers.installer = async (req, { res }) => {
	if (!req.isAuthenticated()) return res.redirect("/login");

	let id;
	try {
		id = new ObjectId(req.params.extid);
	} catch (err) {
		return renderError(res, "That extension doesn't exist!", undefined, 404);
	}
	const galleryDocument = await Gallery.findOne(id);
	if (!galleryDocument) return renderError(res, "That extension doesn't exist!", undefined, 404);

	// Generate slug if missing (for existing extensions without slugs)
	if (!galleryDocument.slug && galleryDocument.name) {
		const checkSlugExists = async slug => {
			const existing = await Gallery.findOne({ slug, _id: { $ne: id } });
			return !!existing;
		};
		const newSlug = await generateUniqueSlug(galleryDocument.name, checkSlugExists);
		if (newSlug) {
			galleryDocument.query.set("slug", newSlug);
			await galleryDocument.save().catch(() => null);
		}
	}

	// Redirect legacy URL to canonical slug URL (301 for SEO)
	if (galleryDocument.slug && !req.params.slug) {
		const queryString = req.originalUrl.includes("?") ? req.originalUrl.substring(req.originalUrl.indexOf("?")) : "";
		return res.redirect(301, `/extensions/${galleryDocument._id}/${galleryDocument.slug}/install${queryString}`);
	}

	const versionTag = parseInt(req.query.v) || galleryDocument.published_version;
	if (!galleryDocument.versions.id(versionTag)) return renderError(res, "That extension version doesn't exist!", undefined, 404);
	const extensionData = await parsers.extensionData(req, galleryDocument, versionTag);

	// Add canonical URL to extension data for SEO meta tags
	extensionData.canonicalUrl = galleryDocument.slug ?
		`/extensions/${galleryDocument._id}/${galleryDocument.slug}/install` :
		`/extensions/${galleryDocument._id}/install`;
	extensionData.slug = galleryDocument.slug;

	const installSettings = await require("../../Modules/ConfigManager").get();
	if ((!extensionData.accepted && !installSettings.maintainers.includes(req.user.id)) || galleryDocument.level === "third") {
		return renderError(res, "You do not have sufficient permission to install this extension.", undefined, 403);
	}

	if (!req.query.svrid) {
		let voteRewardsBalance = 0;
		try {
			voteRewardsBalance = await VoteRewardsManager.getBalance(req.user.id);
		} catch (err) {
			voteRewardsBalance = 0;
		}

		const serverData = [];
		const addServerData = async (i, callback) => {
			if (req.user.guilds && i < req.user.guilds.length) {
				const svr = new GetGuild(req.app.client, req.user.guilds[i].id);
				await svr.initialize(req.user.id);
				if (svr.success) {
					const serverDocument = await CacheManager.getServer(svr.id);
					if (serverDocument) {
						const member = svr.members[req.user.id];
						if (req.app.client.getUserBotAdmin(svr, serverDocument, member) >= 3) {
							serverData.push({
								name: req.user.guilds[i].name,
								id: req.user.guilds[i].id,
								icon: req.user.guilds[i].icon ? `https://cdn.discordapp.com/icons/${req.user.guilds[i].id}/${req.user.guilds[i].icon}.jpg` : "/static/img/discord-icon.png",
								prefix: serverDocument.config.command_prefix,
							});
						}
					}
					addServerData(++i, callback);
				} else {
					addServerData(++i, callback);
				}
			} else {
				try {
					return callback();
				} catch (err) {
					renderError(res, "An error occurred while fetching user data.");
				}
			}
		};
		addServerData(0, async () => {
			serverData.sort((a, b) => a.name.localeCompare(b.name));
			res.setServerData(serverData)
				.setPageData({
					page: "extension-installer.ejs",
					mode: "select",
					extensionData,
					voteRewardsBalance,
				})
				.render();
		});
	} else {
		const serverDocument = await CacheManager.getServer(req.query.svrid);
		if (!serverDocument) return renderError(res, "That server doesn't exist!", undefined, 404);
		const serverData = await parsers.serverData(req, serverDocument);
		const svr = new GetGuild(req.app.client, serverDocument._id);
		await svr.initialize();
		if (serverData) {
			let voteRewardsBalance = 0;
			try {
				voteRewardsBalance = await VoteRewardsManager.getBalance(req.user.id);
			} catch (err) {
				voteRewardsBalance = 0;
			}

			res.setServerData(serverData)
				.setPageData({
					page: "extension-installer.ejs",
					mode: req.query.update ? "update" : "install",
					extensionData,
					channelData: getChannelData(svr),
					voteRewardsBalance,
				}).render();
		} else {
			return renderError(res, "That server doesn't exist!", undefined, 404);
		}
	}
};

controllers.my = async (req, { res }) => {
	if (req.isAuthenticated()) {
		try {
			const extensionEarnings = await PremiumExtensionsManager.getExtensionEarnings(req.user.id);
			const galleryDocuments = await Gallery.find({
				level: "gallery",
				owner_id: req.user.id,
			}).exec();

			res.setPageData({
				page: "extensions.ejs",
				pageTitle: "My Skynet Extensions",
				serverData: {
					id: req.user.id,
				},
				activeSearchQuery: req.query.q,
				mode: "my",
				rawCount: (galleryDocuments || []).length,
				extensions: galleryDocuments || [],
				extensionEarnings,
			});
			res.render();
		} catch (err) {
			renderError(res, "An error occurred while fetching extension data.");
		}
	} else {
		res.redirect("/login");
	}
};

controllers.builder = async (req, { res }) => {
	if (req.isAuthenticated()) {
		const premiumMarketplace = await PremiumExtensionsManager.getMarketplaceSettings();
		const renderPage = extensionData => {
			res.setServerData("id", req.user.id);

			res.setPageData({
				page: "extensions.ejs",
				pageTitle: `${extensionData.name ? `${extensionData.name} - ` : ""}Skynet Extension Builder`,
				activeSearchQuery: req.query.q,
				mode: "builder",
				extensionData,
				versionData: extensionData.versions ? extensionData.versions.id(extensionData.version) : {},
				events: AllowedEvents,
				scopes: Scopes,
				networkCapabilities: NetworkCapabilities,
				extensionTags: ExtensionTags,
				premiumMarketplace,
			});

			res.render();
		};

		if (req.query.extid) {
			try {
				const galleryDocument = await Gallery.findOne({
					_id: req.query.extid,
					owner_id: req.user.id,
				});
				if (galleryDocument) {
					try {
						const versionDoc = galleryDocument.versions.id(galleryDocument.version);
						const codePath = `${__dirname}/../../extensions/${versionDoc.code_id}.skyext`;
						galleryDocument.code = require("fs").readFileSync(codePath, "utf8");
					} catch (err) {
						galleryDocument.code = "";
					}
					renderPage(galleryDocument);
				} else {
					renderPage({});
				}
			} catch (err) {
				renderError(res, "An error occurred while fetching extension data.");
			}
		} else {
			renderPage({});
		}
	} else {
		res.redirect("/login");
	}
};

controllers.builder.post = async (req, res) => {
	if (req.isAuthenticated()) {
		if (validateExtensionData(req.body)) {
			const sendResponse = isErr => {
				dashboardUpdate(req, req.path, req.user.id);
				if (isErr) return res.sendStatus(500);
				res.sendStatus(200);
			};
			const saveExtensionCode = async (err, codeID) => {
				if (err) {
					logger.warn(`Failed to update settings at ${req.path}`, { usrid: req.user.id }, err);
					sendResponse(true);
				} else {
					try {
						await fs.outputFileAtomic(`${__dirname}/../../extensions/${codeID}.skyext`, req.body.code);
						sendResponse();
					} catch (error) {
						logger.warn(`Failed to save extension at ${req.path}`, { usrid: req.user.id }, err);
						sendResponse(true);
					}
				}
			};
			const saveExtensionData = async (galleryDocument, isUpdate) => {
				const galleryQueryDocument = galleryDocument.query;

				galleryQueryDocument.set("level", "gallery")
					.set("description", req.body.description)
					.set("tags", Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : []);
				const newVersion = writeExtensionData(galleryDocument, req.body);
				if (newVersion && isUpdate) galleryQueryDocument.set("state", galleryDocument.state === "saved" ? "saved" : "version_queue");
				else if (newVersion) galleryQueryDocument.set("state", "saved");

				// Generate slug for new extensions or if name changed and no slug exists
				if (!galleryDocument.slug && req.body.name) {
					const checkSlugExists = async slug => {
						const existing = await Gallery.findOne({ slug, _id: { $ne: galleryDocument._id } });
						return !!existing;
					};
					const newSlug = await generateUniqueSlug(req.body.name, checkSlugExists);
					if (newSlug) galleryQueryDocument.set("slug", newSlug);
				}

				if (!isUpdate) {
					galleryQueryDocument.set("owner_id", req.user.id);
					dashboardUpdate(req, "/extensions/my", req.user.id);
				}

				const validation = galleryDocument.validate();
				if (validation) {
					logger.warn("Failed to validate extension data", {}, validation);
					return sendResponse(true);
				}
				await galleryDocument.save().catch(err => {
					logger.warn(`Failed to save extension metadata.`, {}, err);
					sendResponse(true);
				});
				saveExtensionCode(false, generateCodeID(req.body.code));
			};

			if (req.query.extid) {
				const galleryDocument = await Gallery.findOne({
					_id: req.query.extid,
					owner_id: req.user.id,
				});
				if (galleryDocument) {
					await saveExtensionData(galleryDocument, true);
				} else {
					await saveExtensionData(await Gallery.new(), false);
				}
			} else {
				await saveExtensionData(await Gallery.new(), false);
			}
		} else {
			renderError(res, "Failed to verify extension data!", undefined, 400);
		}
	} else {
		res.redirect("/login");
	}
};

controllers.premium = async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	if (!req.params.extid) return res.status(400).json({ error: "Missing extension ID" });

	const isPremium = req.body?.isPremium === true || req.body?.isPremium === "true" || req.body?.isPremium === 1 || req.body?.isPremium === "1";
	const pricePoints = typeof req.body?.pricePoints === "string" ? parseInt(req.body.pricePoints, 10) : req.body?.pricePoints;

	try {
		const result = await PremiumExtensionsManager.setPremiumStatus(req.params.extid, req.user.id, pricePoints, isPremium);
		return res.json(result);
	} catch (err) {
		logger.warn("Failed to set premium status", { usrid: req.user.id, extid: req.params.extid }, err);
		return res.status(400).json({ error: err.message || "Failed to set premium status" });
	}
};

controllers.sales = async (req, { res }) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	if (!req.params.extid) return res.status(400).json({ error: "Missing extension ID" });

	const wantsJson = req.query?.json === "1" || req.query?.json === "true" || (typeof req.headers?.accept === "string" && req.headers.accept.includes("application/json"));
	const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 100;
	try {
		const data = await PremiumExtensionsManager.getExtensionSales(req.user.id, req.params.extid, limit);
		if (wantsJson) return res.json(data);

		res.setServerData("id", req.user.id);
		res.setPageData({
			page: "extensions.ejs",
			pageTitle: `Sales - ${data.extensionName}`,
			mode: "sales",
			rawCount: data.purchases || 0,
			salesData: data,
		});
		return res.render();
	} catch (err) {
		logger.warn("Failed to fetch extension sales", { usrid: req.user.id, extid: req.params.extid }, err);
		if (wantsJson) return res.status(400).json({ error: err.message || "Failed to fetch sales" });
		return renderError(res, err.message || "Failed to fetch sales", undefined, 400);
	}
};

controllers.download = async (req, res) => {
	let extensionDocument;
	try {
		extensionDocument = await Gallery.findOne(new ObjectId(req.params.extid));
	} catch (err) {
		return res.sendStatus(500);
	}
	if (extensionDocument && extensionDocument.state !== "saved") {
		// Block source code access for premium extensions (only owner or maintainers can view)
		if (extensionDocument.premium?.is_premium) {
			const isOwner = req.isAuthenticated() && extensionDocument.owner_id === req.user.id;
			const ConfigManager = require("../../Modules/ConfigManager");
			const settings = await ConfigManager.get();
			const isMaintainer = req.isAuthenticated() && settings.maintainers?.includes(req.user.id);
			if (!isOwner && !isMaintainer) {
				return res.status(403).send("Source code for premium extensions is protected");
			}
		}

		const versionTag = parseInt(req.query.v) || extensionDocument.published_version;
		const versionDocument = extensionDocument.versions.id(versionTag);
		if (!versionDocument) return res.sendStatus(404);
		try {
			res.set({
				"Content-Disposition": `${"attachment; filename="}${extensionDocument.name}.skyext`,
				"Content-Type": "text/javascript",
			});
			res.sendFile(path.join(__dirname, `../../extensions/${versionDocument.code_id}.skyext`));
		} catch (err) {
			res.sendStatus(500);
		}
	} else {
		res.sendStatus(404);
	}
};

/**
 * Export an extension as a portable JSON package that can be imported on another Skynet instance.
 * Includes metadata and code bundled together.
 */
controllers.export = async (req, res) => {
	let extensionDocument;
	try {
		extensionDocument = await Gallery.findOne(new ObjectId(req.params.extid));
	} catch (err) {
		return res.sendStatus(500);
	}
	if (!extensionDocument) return res.sendStatus(404);

	// Allow owner to export any state, others can only export published extensions
	const isOwner = req.isAuthenticated() && extensionDocument.owner_id === req.user.id;
	if (!isOwner && extensionDocument.state === "saved") {
		return res.sendStatus(404);
	}

	// Block source code access for premium extensions (only owner or maintainers can export)
	const ConfigManager = require("../../Modules/ConfigManager");
	const settings = await ConfigManager.get();
	const isMaintainer = req.isAuthenticated() && settings.maintainers?.includes(req.user.id);
	if (extensionDocument.premium?.is_premium && !isOwner && !isMaintainer) {
		return res.status(403).json({ error: "Source code for premium extensions is protected" });
	}

	const versionTag = parseInt(req.query.v) || extensionDocument.published_version || extensionDocument.version;
	const versionDocument = extensionDocument.versions.id(versionTag);
	if (!versionDocument) return res.sendStatus(404);

	try {
		// Read the extension code
		const code = await fs.readFile(path.join(__dirname, `../../extensions/${versionDocument.code_id}.skyext`), "utf8");

		// Build the portable package
		const extensionPackage = {
			package_version: PACKAGE_VERSION,
			exported_at: new Date().toISOString(),
			extension: {
				name: extensionDocument.name,
				description: extensionDocument.description,
				version: {
					type: versionDocument.type,
					key: versionDocument.key,
					keywords: versionDocument.keywords,
					case_sensitive: versionDocument.case_sensitive,
					interval: versionDocument.interval,
					usage_help: versionDocument.usage_help,
					extended_help: versionDocument.extended_help,
					event: versionDocument.event,
					scopes: versionDocument.scopes,
					timeout: versionDocument.timeout,
				},
				code: code,
			},
			source: {
				original_id: extensionDocument._id.toString(),
				original_owner: extensionDocument.owner_id,
			},
		};

		res.set({
			"Content-Disposition": `attachment; filename="${extensionDocument.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.skypkg"`,
			"Content-Type": "application/json",
		});
		res.json(extensionPackage);
	} catch (err) {
		logger.warn("Failed to export extension", { extid: req.params.extid }, err);
		res.sendStatus(500);
	}
};

/**
 * Import an extension from an uploaded JSON package.
 * Creates a new extension owned by the current user.
 */
controllers.import = async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	try {
		const packageData = req.body;

		// Validate package structure
		if (!packageData || !packageData.extension) {
			return res.status(400).json({ error: "Invalid extension package format" });
		}

		const { extension } = packageData;
		if (!extension.name || !extension.version || !extension.code) {
			return res.status(400).json({ error: "Extension package missing required fields (name, version, code)" });
		}

		const { version } = extension;
		if (!validateExtensionData({
			type: version.type,
			key: version.key,
			keywords: Array.isArray(version.keywords) ? version.keywords.join(",") : version.keywords,
			interval: version.interval,
			event: version.event,
			code: extension.code,
		})) {
			return res.status(400).json({ error: "Extension data validation failed" });
		}

		// Create new extension document
		const galleryDocument = await Gallery.new();
		const galleryQueryDocument = galleryDocument.query;

		// Set extension metadata
		galleryQueryDocument.set("name", extension.name)
			.set("description", extension.description || "")
			.set("level", "gallery")
			.set("state", "saved")
			.set("owner_id", req.user.id)
			.set("last_updated", Date.now());

		// Build version data object matching writeExtensionData format
		const versionData = {
			_id: 1,
			accepted: null,
			type: version.type,
			key: version.type === "command" ? version.key : null,
			usage_help: version.type === "command" ? version.usage_help : null,
			extended_help: version.type === "command" ? version.extended_help : null,
			keywords: version.keywords || [],
			case_sensitive: version.case_sensitive || false,
			interval: version.type === "timer" ? version.interval : null,
			event: version.type === "event" ? version.event : null,
			timeout: version.timeout || 5000,
			scopes: version.scopes || [],
			network_capability: version.network_capability || "none",
			network_approved: false,
			code_id: generateCodeID(extension.code),
		};

		galleryQueryDocument.push("versions", versionData);
		galleryQueryDocument.set("version", 1);

		// Validate and save
		const validation = galleryDocument.validate();
		if (validation) {
			logger.warn("Failed to validate imported extension data", {}, validation);
			return res.status(400).json({ error: "Extension data validation failed" });
		}

		await galleryDocument.save();

		// Save the extension code file
		await fs.outputFileAtomic(`${__dirname}/../../extensions/${versionData.code_id}.skyext`, extension.code);

		logger.info("Extension imported successfully", {
			usrid: req.user.id,
			extid: galleryDocument._id.toString(),
			name: extension.name,
		});

		res.json({
			success: true,
			extension_id: galleryDocument._id.toString(),
			message: `Extension "${extension.name}" imported successfully`,
		});
	} catch (err) {
		logger.warn("Failed to import extension", { usrid: req.user.id }, err);
		res.status(500).json({ error: "Failed to import extension" });
	}
};

controllers.gallery.modify = async (req, { res }) => {
	if (req.isAuthenticated()) {
		if (req.params.extid && req.params.action) {
			const modifySettings = await require("../../Modules/ConfigManager").get();
			if (["accept", "feature", "reject", "remove", "approve_network"].includes(req.params.action) && !modifySettings.maintainers.includes(req.user.id)) {
				res.sendStatus(403);
				return;
			}

			const getGalleryDocument = async () => {
				let doc;
				try {
					doc = await Gallery.findOne(new ObjectId(req.params.extid));
				} catch (err) {
					res.sendStatus(500);
					return null;
				}
				if (!doc) {
					res.sendStatus(404);
					return null;
				}
				return doc;
			};
			const getUserDocument = async () => {
				let userDocument = await CacheManager.getUser(req.user.id);
				if (userDocument) {
					return userDocument;
				} else {
					try {
						userDocument = await Users.new({ _id: req.user.id });
					} catch (err) {
						res.sendStatus(500);
						return null;
					}
					return userDocument;
				}
			};
			const messageOwner = async (usrid, message) => {
				try {
					const usr = await req.app.client.users.fetch(usrid, true);
					usr.send(message);
				} catch (_) {
					// No-op
				}
			};

			const galleryDocument = await getGalleryDocument();
			if (!galleryDocument) return;
			const galleryQueryDocument = galleryDocument.query;
			switch (req.params.action) {
				case "upvote": {
					const userDocument = await getUserDocument();
					if (!userDocument) return;

					const vote = !userDocument.upvoted_gallery_extensions.includes(galleryDocument._id.toString()) ? 1 : -1;
					if (vote === 1) {
						userDocument.query.push("upvoted_gallery_extensions", galleryDocument._id.toString());
					} else {
						userDocument.query.pull("upvoted_gallery_extensions", galleryDocument._id.toString());
					}
					galleryQueryDocument.inc("points", vote);

					await galleryDocument.save();
					await userDocument.save();

					let ownerUserDocument = await CacheManager.getUser(galleryDocument.owner_id);
					if (!ownerUserDocument) ownerUserDocument = await Users.new({ _id: galleryDocument.owner_id });
					ownerUserDocument.query.inc("points", vote * 10);
					await ownerUserDocument.save();

					res.sendStatus(200);
					break;
				}
				case "accept": {
					const versionDoc = galleryDocument.versions.find(v => v._id === galleryDocument.version);
					if (!versionDoc) {
						logger.warn("Accept failed: version not found", { extid: req.params.extid, version: galleryDocument.version });
						return res.sendStatus(404);
					}
					// Modify version in memory then set the whole versions array
					// (nested JSON push doesn't work properly with MariaDB)
					versionDoc.accepted = true;
					if (!versionDoc.approval_history) versionDoc.approval_history = [];
					versionDoc.approval_history.push({
						action: "accepted",
						by: req.user.id,
						at: new Date(),
					});
					galleryQueryDocument.set("state", "gallery");
					galleryQueryDocument.set("versions", galleryDocument.versions);
					galleryQueryDocument.set("published_version", galleryDocument.version);

					try {
						await galleryDocument.save();
					} catch (err) {
						logger.error("Failed to save extension acceptance", { extid: req.params.extid }, err);
						return res.sendStatus(500);
					}
					res.sendStatus(200);

					// Notify search engines of new published extension
					const indexNow = req.app.get("indexNow");
					indexNow?.submitUrl(`/extensions/${galleryDocument._id.toString()}/install`);

					messageOwner(galleryDocument.owner_id, {
						embeds: [{
							color: Colors.GREEN,
							title: `Your extension ${galleryDocument.name} has been accepted ${galleryDocument.level === "third" ? "by maintainers." : "to the Skynet extension gallery!"} 🎉`,
							description: `View your creation [here](${configJS.hostingURL}extensions/gallery?id=${galleryDocument._id.toString()})!`,
						}],
					});
					break;
				}
				case "feature":
					if (!galleryDocument.featured) {
						messageOwner(galleryDocument.owner_id, {
							embeds: [{
								color: Colors.GREEN,
								title: `Your extension ${galleryDocument.name} has been featured on the Skynet extension gallery! 🌟`,
								description: `View your achievement [here](${configJS.hostingURL}extensions/gallery?id=${galleryDocument._id.toString()})`,
							}],
						});
					}

					galleryQueryDocument.set("featured", galleryDocument.featured !== true);
					galleryDocument.save()
						.then(() => res.sendStatus(200))
						.catch(() => res.sendStatus(500));
					break;
				case "reject":
				case "remove": {
					const ownerUserDocument2 = await CacheManager.getUser(galleryDocument.owner_id);
					if (ownerUserDocument2) {
						ownerUserDocument2.query.inc("points", -(galleryDocument.points * 10));
						await ownerUserDocument2.save();
					}

					const targetVersion = req.params.action === "remove" ?
						galleryDocument.published_version : galleryDocument.version;
					const versionDoc = galleryDocument.versions.find(v => v._id === targetVersion);
					if (versionDoc) {
						// Modify version in memory then set the whole versions array
						// (nested JSON push doesn't work properly with MariaDB)
						versionDoc.accepted = false;
						if (!versionDoc.approval_history) versionDoc.approval_history = [];
						versionDoc.approval_history.push({
							action: "rejected",
							by: req.user.id,
							at: new Date(),
							reason: req.body.reason || null,
						});
						galleryQueryDocument.set("versions", galleryDocument.versions);
					}
					galleryQueryDocument.set("state", "saved")
						.set("featured", false)
						.set("published_version", null);
					galleryDocument.save()
						.then(() => res.sendStatus(200))
						.catch(() => res.sendStatus(500));

					const actionString = `${req.params.action}${req.params.action === "reject" ? "e" : ""}d`;
					messageOwner(galleryDocument.owner_id, {
						embeds: [{
							color: Colors.LIGHT_RED,
							title: `Your extension ${galleryDocument.name} has been ${actionString} ${galleryDocument.level === "third" ? "by maintainers" : "from the Skynet extension gallery"}.`,
							description: `${req.body.reason.replace(/\\n/g, "\n")}`,
						}],
					});
					break;
				}
				case "publish":
					if (galleryDocument.owner_id !== req.user.id) return res.sendStatus(404);

					galleryQueryDocument.set("state", "queue");
					await galleryDocument.save();

					res.sendStatus(200);
					break;
				case "delete": {
					if (galleryDocument.owner_id !== req.user.id) return res.sendStatus(404);

					await Gallery.delete({ _id: galleryDocument._id });
					const extensionId = galleryDocument._id.toString();
					const serversWithExt = await Servers.find({}).exec();
					for (const server of serversWithExt) {
						if (server.extensions && Array.isArray(server.extensions)) {
							const extIndex = server.extensions.findIndex(e => e._id === extensionId);
							if (extIndex !== -1) {
								server.query.pull("extensions", { _id: extensionId });
								await server.save().catch(_error => null);
							}
						}
					}
					dashboardUpdate(req, req.path, req.user.id);

					try {
						await fs.unlink(`${__dirname}/../../extensions/${galleryDocument.code_id}.skyext`);
					} catch (_error) {
						// No-op
					}

					res.sendStatus(200);
					break;
				}
				case "unpublish":
					if (galleryDocument.owner_id !== req.user.id) return res.sendStatus(403);

					galleryQueryDocument.set("state", "saved")
						.set("featured", false)
						.set("published_version", null);
					await galleryDocument.save();

					res.sendStatus(200);
					break;
				case "approve_network": {
					const versionDoc = galleryDocument.versions.find(v => v._id === galleryDocument.version);
					if (!versionDoc) return res.sendStatus(404);

					const netCap = versionDoc.network_capability;
					if (!netCap || !["network", "network_advanced"].includes(netCap)) {
						return res.sendStatus(400);
					}

					// Modify version in memory then set the whole versions array
					// (nested JSON updates don't work properly with MariaDB)
					const approvalTimestamp = new Date();
					versionDoc.network_approved = true;
					versionDoc.network_approved_by = req.user.id;
					versionDoc.network_approved_at = approvalTimestamp;
					if (!versionDoc.approval_history) versionDoc.approval_history = [];
					versionDoc.approval_history.push({
						action: "network_approved",
						by: req.user.id,
						at: approvalTimestamp,
					});
					galleryQueryDocument.set("versions", galleryDocument.versions);

					try {
						await galleryDocument.save();
					} catch (err) {
						logger.error("Failed to approve network capability", { extid: req.params.extid }, err);
						return res.sendStatus(500);
					}

					messageOwner(galleryDocument.owner_id, {
						embeds: [{
							color: Colors.GREEN,
							title: `Network capability approved for ${galleryDocument.name}! 🌐`,
							description: `Your extension's ${netCap} capability has been approved by a maintainer.`,
						}],
					});

					res.sendStatus(200);
					break;
				}
				default:
					res.sendStatus(400);
					break;
			}
		} else {
			res.sendStatus(400);
		}
	} else {
		res.sendStatus(403);
	}
};
