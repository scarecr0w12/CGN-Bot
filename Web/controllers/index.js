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

controllers.headerImage = (req, res) => {
	let headerImage = configJSON.headerImage || "header.png";
	if (req.get("Accept") && req.get("Accept").indexOf("image/webp") > -1 && headerImage.includes(".")) {
		headerImage = `${headerImage.substring(0, headerImage.lastIndexOf("."))}.webp`;
	}
	res.sendFile(require("path").resolve(`${__dirname}/../public/img/${headerImage}`), err => {
		if (err) logger.debug("It looks like your headerImage value is invalid!", {}, err);
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
