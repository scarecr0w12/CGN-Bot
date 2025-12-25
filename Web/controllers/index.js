const { renderError } = require("../helpers");

const controllers = module.exports;

controllers.landing = require("./landing");
controllers.activity = require("./activity");
controllers.extensions = require("./extensions");
controllers.wiki = require("./wiki");
controllers.blog = require("./blog");
controllers.donate = require("./donate");
controllers.status = require("./status");

controllers.dashboard = require("./dashboard");
controllers.console = require("./maintainer");

controllers.auth = require("./auth");
controllers.api = require("./api");
controllers.debug = require("./debug");
controllers.membership = require("./membership");
controllers.seo = require("./seo");
controllers.server = require("./server");
controllers.referral = require("./referral");
controllers.templates = require("./templates");
controllers.widgets = require("./widgets");
controllers.vote = require("./vote");

controllers.headerImage = async (req, res) => {
	const ConfigManager = require("../../Modules/ConfigManager");
	const settings = await ConfigManager.get();
	let headerImage = settings.headerImage || "header.webp";
	if (req.get("Accept") && req.get("Accept").indexOf("image/webp") > -1 && headerImage.includes(".")) {
		headerImage = `${headerImage.substring(0, headerImage.lastIndexOf("."))}.webp`;
	}
	const fs = require("fs");
	const filePath = require("path").resolve(`${__dirname}/../public/img/${headerImage}`);

	// Check if file exists before sending
	if (!fs.existsSync(filePath)) {
		logger.debug("Header image not found, using fallback", { headerImage, filePath });
		return res.sendFile(require("path").resolve(`${__dirname}/../public/img/header.webp`), err => {
			if (err) logger.warn("Failed to send fallback header image", {}, err);
		});
	}

	res.sendFile(filePath, err => {
		if (err) logger.debug("Failed to send header image", { headerImage }, err);
	});
};

controllers.paperwork = (req, { res }) => {
	res.render("pages/paperwork.ejs");
};

controllers.error = (req, res, next) => {
	if (req.query.err === "discord") renderError(res, "The Discord OAuth flow could not be completed.");
	else if (req.query.err === "json") renderError(res, "That doesn't look like a valid trivia set to me!");
	else if (req.debugMode) renderError(res, "I AM ERROR");
	else return next();
};

controllers.add = (req, res) => {
	const hasConfig = global.configJS && typeof global.configJS.oauthLink === "string";
	const hasClient = req.app && req.app.client && req.app.client.user && req.app.client.user.id;
	if (hasConfig && hasClient) {
		return res.redirect(global.configJS.oauthLink.format({ id: req.app.client.user.id }));
	}
	return renderError(res, "Bot invite link is not configured.");
};
