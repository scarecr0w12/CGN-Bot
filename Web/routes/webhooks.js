/**
 * Payment Provider & Bot List Webhook Routes
 *
 * These endpoints receive notifications from payment providers and bot list sites
 * and should NOT require authentication (they use shared secrets instead).
 */

const controllers = require("../controllers/webhooks");

/**
 * Middleware to add CORS headers for bot list webhooks
 * This allows bot list sites to test their webhooks from their browser
 */
const botListCors = (req, res, next) => {
	const allowedOrigins = [
		"https://discordbotlist.com",
		"https://top.gg",
		"https://topbotlist.net",
	];
	const origin = req.headers.origin;
	if (allowedOrigins.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	}
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-DBL-Signature");
	res.setHeader("Access-Control-Max-Age", "86400");
	next();
};

module.exports = router => {
	// Stripe webhooks - needs raw body for signature verification
	router.post("/webhooks/stripe", controllers.stripe);

	// PayPal webhooks
	router.post("/webhooks/paypal", controllers.paypal);

	// BTCPay webhooks
	router.post("/webhooks/btcpay", controllers.btcpay);

	// Patreon webhooks - needs raw body for signature verification
	router.post("/webhooks/patreon", controllers.patreon);

	// Bot List Vote Webhooks - with CORS for test functionality
	router.options("/webhooks/topgg", botListCors, (req, res) => res.sendStatus(204));
	router.post("/webhooks/topgg", botListCors, controllers.topgg);
	router.options("/webhooks/discordbotlist", botListCors, (req, res) => res.sendStatus(204));
	router.post("/webhooks/discordbotlist", botListCors, controllers.discordbotlist);
	router.options("/webhooks/topbotlist", botListCors, (req, res) => res.sendStatus(204));
	router.post("/webhooks/topbotlist", botListCors, controllers.topbotlist);
};
