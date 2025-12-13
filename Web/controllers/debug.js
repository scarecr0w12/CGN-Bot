const controllers = module.exports;

// Default template variables for error pages
const getErrorPageVars = (req) => ({
	pageData: {},
	hostingURL: req.app?.client?.configJS?.hostingURL || "",
	currentPath: req.path || "",
	isProduction: process.env.NODE_ENV === "production",
	disableExternalScripts: req.app?.client?.configJS?.disableExternalScripts || false,
	injection: { headScript: "", footerHTML: "" },
});

controllers["503"] = (req, res) => res.status(503).render("pages/503.ejs", getErrorPageVars(req));

controllers["404"] = (req, res) => res.status(404).render("pages/404.ejs", getErrorPageVars(req));
