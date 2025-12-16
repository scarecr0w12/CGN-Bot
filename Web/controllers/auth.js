const discordOAuthScopes = ["identify", "guilds", "email"];
const { renderError } = require("../helpers");
const ConfigManager = require("../../Modules/ConfigManager");

const controllers = module.exports;

// Builders
controllers.buildLoginController = router => router.app.passport.authenticate("discord", {
	scope: discordOAuthScopes,
});

// Controllers
controllers.logout = (req, res, next) => {
	req.logout(err => {
		if (err) return next(err);
		res.redirect("/activity");
	});
};

controllers.authenticate = async (req, res) => {
	const isBlocked = await ConfigManager.isUserBlocked(req.user.id);
	if (isBlocked || req.user.verified === false) {
		req.session.destroy(err => {
			if (!err) renderError(res, "Your Discord account must have a verified email.", "<strong>Hah!</strong> Thought you were close, didn'tcha?");
			else renderError(res, "Failed to destroy your session.");
		});
	} else {
		res.redirect("/dashboard");
	}
};
