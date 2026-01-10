/**
 * FAQ Controller - Comprehensive FAQ page optimized for AI search
 */

module.exports = async (req, { res }) => {
	res.render("pages/faq.ejs", {
		authUser: req.user || null,
		pageData: {
			page: "faq",
		},
	});
};
