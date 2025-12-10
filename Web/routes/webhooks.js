/**
 * Payment Provider & Bot List Webhook Routes
 *
 * These endpoints receive notifications from payment providers and bot list sites
 * and should NOT require authentication (they use shared secrets instead).
 */

const controllers = require("../controllers/webhooks");

module.exports = router => {
	// Stripe webhooks - needs raw body for signature verification
	router.post("/webhooks/stripe", controllers.stripe);

	// PayPal webhooks
	router.post("/webhooks/paypal", controllers.paypal);

	// BTCPay webhooks
	router.post("/webhooks/btcpay", controllers.btcpay);

	// Patreon webhooks - needs raw body for signature verification
	router.post("/webhooks/patreon", controllers.patreon);

	// Bot List Vote Webhooks
	router.post("/webhooks/topgg", controllers.topgg);
	router.post("/webhooks/discordbotlist", controllers.discordbotlist);
};
