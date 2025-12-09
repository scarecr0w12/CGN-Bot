/**
 * Payment Provider Webhook Routes
 *
 * These endpoints receive notifications from payment providers
 * and should NOT require authentication.
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
};
