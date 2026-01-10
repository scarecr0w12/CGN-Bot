/**
 * Test controller for Cloudflare Turnstile
 */

const controllers = module.exports;

/**
 * Render test page
 */
controllers.testPage = (req, res) => {
	res.render("pages/test-turnstile", {
		pageTitle: "Turnstile Test",
		botName: req.app.client.user.username,
		testResult: null,
	});
};

/**
 * Handle form submission with Turnstile verification
 * Middleware verifyTurnstile should be called before this
 */
controllers.testSubmit = (req, res) => {
	const { name, email, test_type } = req.body;

	// Check if Turnstile verification passed
	if (!req.turnstileVerified) {
		return res.render("pages/test-turnstile", {
			pageTitle: "Turnstile Test",
			botName: req.app.client.user.username,
			testResult: {
				success: false,
				message: "Turnstile verification failed",
				details: {
					name,
					email,
					test_type,
					verified: false,
				},
			},
		});
	}

	// Success!
	res.render("pages/test-turnstile", {
		pageTitle: "Turnstile Test",
		botName: req.app.client.user.username,
		testResult: {
			success: true,
			message: `Successfully verified! Form submitted with ${test_type} mode.`,
			details: {
				name,
				email,
				test_type,
				verified: true,
				turnstileData: req.turnstileData || {},
				ip: req.realIP || req.ip,
			},
		},
	});
};
