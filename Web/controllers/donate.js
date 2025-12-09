module.exports = async (req, { res }) => {
	const siteSettings = await SiteSettings.findOne("main");

	const charities = siteSettings && siteSettings.charities && siteSettings.charities.length ?
		siteSettings.charities : configJS.donateCharities;
	const donateSubtitle = siteSettings && siteSettings.donateSubtitle ?
		siteSettings.donateSubtitle : configJS.donateSubtitle;

	res.setConfigData({
		charities,
		donateSubtitle,
	});

	res.setPageData("page", "donate.ejs");

	res.render();
};
