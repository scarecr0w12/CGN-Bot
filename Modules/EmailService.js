/**
 * EmailService - Handles email sending for notifications, receipts, and alerts
 *
 * Supports SMTP providers (SendGrid, Mailgun, AWS SES, custom SMTP)
 * Premium feature gated by site settings configuration.
 */

let nodemailer;
try {
	nodemailer = require("nodemailer");
} catch (err) {
	// nodemailer is optional - email features will be disabled if not installed
	nodemailer = null;
}
const TierManager = require("./TierManager");

// Email types for templates
const EMAIL_TYPES = {
	RECEIPT: "receipt",
	SUBSCRIPTION_ACTIVATED: "subscription_activated",
	SUBSCRIPTION_CANCELLED: "subscription_cancelled",
	SUBSCRIPTION_EXPIRING: "subscription_expiring",
	WELCOME: "welcome",
	PASSWORD_RESET: "password_reset",
	NOTIFICATION: "notification",
	ADMIN_ALERT: "admin_alert",
};

// Delivery status
const DELIVERY_STATUS = {
	PENDING: "pending",
	SENT: "sent",
	FAILED: "failed",
	BOUNCED: "bounced",
};

class EmailService {
	constructor (client) {
		this.client = client;
		this.transporter = null;
		this.queue = [];
		this.processing = false;
		this.retryAttempts = 3;
		this.retryDelay = 5000;
		this.initialized = false;
	}

	/**
	 * Initialize the email transporter based on configuration
	 * @returns {Promise<boolean>} Whether initialization was successful
	 */
	async initialize () {
		try {
			// Check if nodemailer is available
			if (!nodemailer) {
				logger.debug("EmailService: nodemailer not installed - email features disabled");
				return false;
			}

			const siteSettings = await TierManager.getSiteSettings();
			const emailConfig = siteSettings?.email;

			if (!emailConfig?.isEnabled) {
				logger.debug("EmailService: Email is disabled in site settings");
				return false;
			}

			// Build transporter config from environment variables
			const config = this.buildTransporterConfig(emailConfig);

			if (!config) {
				logger.warn("EmailService: Missing required email configuration");
				return false;
			}

			this.transporter = nodemailer.createTransport(config);

			// Verify connection
			await this.transporter.verify();
			this.initialized = true;
			logger.info("EmailService: Initialized successfully");
			return true;
		} catch (error) {
			logger.error("EmailService: Failed to initialize", {}, error);
			this.initialized = false;
			return false;
		}
	}

	/**
	 * Build nodemailer transporter configuration
	 * @param {Object} emailConfig - Email configuration from site settings
	 * @returns {Object|null} Transporter configuration
	 */
	buildTransporterConfig (emailConfig) {
		const provider = emailConfig?.provider || "smtp";

		// Get credentials from environment variables (security best practice)
		const host = process.env.SMTP_HOST;
		const port = parseInt(process.env.SMTP_PORT) || 587;
		const user = process.env.SMTP_USER;
		const pass = process.env.SMTP_PASS;

		// Provider-specific configurations
		switch (provider) {
			case "sendgrid":
				if (!process.env.SENDGRID_API_KEY) return null;
				return {
					host: "smtp.sendgrid.net",
					port: 587,
					secure: false,
					auth: {
						user: "apikey",
						pass: process.env.SENDGRID_API_KEY,
					},
				};

			case "mailgun":
				if (!process.env.MAILGUN_SMTP_USER || !process.env.MAILGUN_SMTP_PASS) return null;
				return {
					host: process.env.MAILGUN_SMTP_HOST || "smtp.mailgun.org",
					port: 587,
					secure: false,
					auth: {
						user: process.env.MAILGUN_SMTP_USER,
						pass: process.env.MAILGUN_SMTP_PASS,
					},
				};

			case "ses":
				if (!process.env.AWS_SES_ACCESS_KEY || !process.env.AWS_SES_SECRET_KEY) return null;
				return {
					host: process.env.AWS_SES_SMTP_HOST || `email-smtp.${process.env.AWS_SES_REGION || "us-east-1"}.amazonaws.com`,
					port: 587,
					secure: false,
					auth: {
						user: process.env.AWS_SES_ACCESS_KEY,
						pass: process.env.AWS_SES_SECRET_KEY,
					},
				};

			case "smtp":
			default:
				if (!host || !user || !pass) return null;
				return {
					host,
					port,
					secure: port === 465,
					auth: { user, pass },
				};
		}
	}

	/**
	 * Get configured sender info
	 * @returns {Promise<Object>} Sender info { name, email }
	 */
	async getSenderInfo () {
		const siteSettings = await TierManager.getSiteSettings();
		const emailConfig = siteSettings?.email || {};

		return {
			name: emailConfig.from_name || process.env.EMAIL_FROM_NAME || configJS.botName || "Skynet",
			email: emailConfig.from_email || process.env.EMAIL_FROM_ADDRESS || "noreply@example.com",
		};
	}

	/**
	 * Check if email service is available
	 * @returns {Promise<boolean>}
	 */
	async isAvailable () {
		if (!this.initialized) {
			await this.initialize();
		}
		return this.initialized && this.transporter !== null;
	}

	/**
	 * Send an email
	 * @param {Object} options - Email options
	 * @param {string} options.to - Recipient email address
	 * @param {string} options.subject - Email subject
	 * @param {string} options.html - HTML content
	 * @param {string} [options.text] - Plain text content (optional)
	 * @param {string} [options.type] - Email type for logging
	 * @param {Object} [options.metadata] - Additional metadata for logging
	 * @returns {Promise<Object>} Send result
	 */
	async send (options) {
		if (!await this.isAvailable()) {
			return { success: false, error: "Email service not available" };
		}

		const { to, subject, html, text, type, metadata } = options;

		if (!to || !subject || !html) {
			return { success: false, error: "Missing required fields (to, subject, html)" };
		}

		// Validate email format
		if (!this.isValidEmail(to)) {
			return { success: false, error: "Invalid email address" };
		}

		const sender = await this.getSenderInfo();

		const mailOptions = {
			from: `"${sender.name}" <${sender.email}>`,
			to,
			subject,
			html,
			text: text || this.htmlToPlainText(html),
		};

		try {
			const result = await this.transporter.sendMail(mailOptions);

			logger.info("Email sent successfully", {
				to,
				subject,
				type: type || "unknown",
				messageId: result.messageId,
				...metadata,
			});

			return {
				success: true,
				messageId: result.messageId,
				response: result.response,
			};
		} catch (error) {
			logger.error("Failed to send email", { to, subject, type }, error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * Queue an email for sending (with retry support)
	 * @param {Object} options - Same as send() options
	 */
	async queueEmail (options) {
		this.queue.push({
			options,
			attempts: 0,
			addedAt: new Date(),
		});

		this.processQueue();
	}

	/**
	 * Process the email queue
	 */
	async processQueue () {
		if (this.processing || this.queue.length === 0) return;

		this.processing = true;

		while (this.queue.length > 0) {
			const item = this.queue.shift();
			const result = await this.send(item.options);

			if (!result.success && item.attempts < this.retryAttempts) {
				// Re-queue for retry
				setTimeout(() => {
					this.queue.push({ ...item, attempts: item.attempts + 1 });
					this.processQueue();
				}, this.retryDelay * (item.attempts + 1));
			}
		}

		this.processing = false;
	}

	/**
	 * Send a receipt email for a membership purchase
	 * @param {Object} data - Receipt data
	 * @returns {Promise<Object>} Send result
	 */
	async sendReceipt (data) {
		const { email, serverName, tierName, amount, currency, billingPeriod, transactionId, purchaseDate } = data;

		if (!email) {
			return { success: false, error: "No email address provided" };
		}

		const html = await this.renderTemplate(EMAIL_TYPES.RECEIPT, {
			serverName,
			tierName,
			amount: this.formatCurrency(amount, currency),
			billingPeriod: billingPeriod === "yearly" ? "Annual" : "Monthly",
			transactionId,
			purchaseDate: purchaseDate ? new Date(purchaseDate).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}) : new Date().toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}),
		});

		return this.send({
			to: email,
			subject: `Receipt for ${tierName} Membership`,
			html,
			type: EMAIL_TYPES.RECEIPT,
			metadata: { serverId: data.serverId, tierId: data.tierId, transactionId },
		});
	}

	/**
	 * Send subscription activated notification
	 * @param {Object} data - Subscription data
	 * @returns {Promise<Object>} Send result
	 */
	async sendSubscriptionActivated (data) {
		const { email, serverName, tierName, features, expiresAt } = data;

		if (!email) {
			return { success: false, error: "No email address provided" };
		}

		const html = await this.renderTemplate(EMAIL_TYPES.SUBSCRIPTION_ACTIVATED, {
			serverName,
			tierName,
			features: features || [],
			expiresAt: expiresAt ? new Date(expiresAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}) : "Never",
		});

		return this.send({
			to: email,
			subject: `${tierName} Membership Activated for ${serverName}`,
			html,
			type: EMAIL_TYPES.SUBSCRIPTION_ACTIVATED,
			metadata: { serverId: data.serverId, tierId: data.tierId },
		});
	}

	/**
	 * Send subscription expiring reminder
	 * @param {Object} data - Subscription data
	 * @returns {Promise<Object>} Send result
	 */
	async sendSubscriptionExpiring (data) {
		const { email, serverName, tierName, expiresAt, daysRemaining, renewUrl } = data;

		if (!email) {
			return { success: false, error: "No email address provided" };
		}

		const html = await this.renderTemplate(EMAIL_TYPES.SUBSCRIPTION_EXPIRING, {
			serverName,
			tierName,
			expiresAt: new Date(expiresAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}),
			daysRemaining,
			renewUrl: renewUrl || `${configJS.hostingURL}membership`,
		});

		return this.send({
			to: email,
			subject: `Your ${tierName} membership expires in ${daysRemaining} days`,
			html,
			type: EMAIL_TYPES.SUBSCRIPTION_EXPIRING,
			metadata: { serverId: data.serverId, daysRemaining },
		});
	}

	/**
	 * Send subscription cancelled notification
	 * @param {Object} data - Cancellation data
	 * @returns {Promise<Object>} Send result
	 */
	async sendSubscriptionCancelled (data) {
		const { email, serverName, tierName, endDate } = data;

		if (!email) {
			return { success: false, error: "No email address provided" };
		}

		const html = await this.renderTemplate(EMAIL_TYPES.SUBSCRIPTION_CANCELLED, {
			serverName,
			tierName,
			endDate: endDate ? new Date(endDate).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}) : "Immediately",
		});

		return this.send({
			to: email,
			subject: `${tierName} Membership Cancelled for ${serverName}`,
			html,
			type: EMAIL_TYPES.SUBSCRIPTION_CANCELLED,
			metadata: { serverId: data.serverId },
		});
	}

	/**
	 * Send admin alert email
	 * @param {Object} data - Alert data
	 * @returns {Promise<Object>} Send result
	 */
	async sendAdminAlert (data) {
		const { subject, message, severity, details } = data;

		const siteSettings = await TierManager.getSiteSettings();
		const adminEmail = siteSettings?.email?.admin_email || process.env.ADMIN_EMAIL;

		if (!adminEmail) {
			return { success: false, error: "No admin email configured" };
		}

		const html = await this.renderTemplate(EMAIL_TYPES.ADMIN_ALERT, {
			subject,
			message,
			severity: severity || "info",
			details: details || {},
			timestamp: new Date().toISOString(),
		});

		return this.send({
			to: adminEmail,
			subject: `[${(severity || "INFO").toUpperCase()}] ${subject}`,
			html,
			type: EMAIL_TYPES.ADMIN_ALERT,
			metadata: { severity },
		});
	}

	/**
	 * Send generic notification email
	 * @param {Object} data - Notification data
	 * @returns {Promise<Object>} Send result
	 */
	async sendNotification (data) {
		const { email, subject, message, actionUrl, actionText } = data;

		if (!email) {
			return { success: false, error: "No email address provided" };
		}

		const html = await this.renderTemplate(EMAIL_TYPES.NOTIFICATION, {
			subject,
			message,
			actionUrl,
			actionText: actionText || "View Details",
		});

		return this.send({
			to: email,
			subject,
			html,
			type: EMAIL_TYPES.NOTIFICATION,
		});
	}

	/**
	 * Render an email template
	 * @param {string} type - Email type
	 * @param {Object} data - Template data
	 * @returns {Promise<string>} Rendered HTML
	 */
	async renderTemplate (type, data) {
		const siteSettings = await TierManager.getSiteSettings();
		const emailConfig = siteSettings?.email || {};

		const brandColor = emailConfig.brand_color || "#3273dc";
		const logoUrl = emailConfig.logo_url || `${configJS.hostingURL}static/img/icon.png`;
		const botName = configJS.botName || "Skynet";
		const supportUrl = configJS.hostingURL ? `${configJS.hostingURL}support` : null;
		const footerText = emailConfig.footer_text || `© ${new Date().getFullYear()} ${botName}. All rights reserved.`;

		// Base template wrapper
		const wrapTemplate = content => `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${data.subject || botName}</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
		.container { max-width: 600px; margin: 0 auto; background: #ffffff; }
		.header { background: ${brandColor}; padding: 24px; text-align: center; }
		.header img { max-height: 48px; }
		.header h1 { color: #ffffff; margin: 12px 0 0; font-size: 24px; }
		.content { padding: 32px 24px; }
		.footer { background: #f9f9f9; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
		.button { display: inline-block; padding: 12px 24px; background: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
		.button:hover { opacity: 0.9; }
		.info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
		.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
		.info-row:last-child { border-bottom: none; }
		.info-label { color: #666; }
		.info-value { font-weight: 600; }
		.alert { padding: 16px; border-radius: 8px; margin: 16px 0; }
		.alert-info { background: #e7f3ff; border-left: 4px solid #2196f3; }
		.alert-warning { background: #fff3e0; border-left: 4px solid #ff9800; }
		.alert-error { background: #ffebee; border-left: 4px solid #f44336; }
		.alert-success { background: #e8f5e9; border-left: 4px solid #4caf50; }
		ul { padding-left: 20px; }
		li { margin: 8px 0; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			${logoUrl ? `<img src="${logoUrl}" alt="${botName}">` : ""}
			<h1>${botName}</h1>
		</div>
		<div class="content">
			${content}
		</div>
		<div class="footer">
			<p>${footerText}</p>
			${supportUrl ? `<p><a href="${supportUrl}">Contact Support</a></p>` : ""}
		</div>
	</div>
</body>
</html>`;

		// Template content based on type
		let content = "";

		switch (type) {
			case EMAIL_TYPES.RECEIPT:
				content = `
					<h2>Payment Receipt</h2>
					<p>Thank you for your purchase! Here are your transaction details:</p>
					<div class="info-box">
						<div class="info-row"><span class="info-label">Server</span><span class="info-value">${data.serverName}</span></div>
						<div class="info-row"><span class="info-label">Plan</span><span class="info-value">${data.tierName}</span></div>
						<div class="info-row"><span class="info-label">Billing Period</span><span class="info-value">${data.billingPeriod}</span></div>
						<div class="info-row"><span class="info-label">Amount</span><span class="info-value">${data.amount}</span></div>
						<div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value">${data.transactionId || "N/A"}</span></div>
						<div class="info-row"><span class="info-label">Date</span><span class="info-value">${data.purchaseDate}</span></div>
					</div>
					<p>Your premium features are now active. Enjoy!</p>

				`;
				break;

			case EMAIL_TYPES.SUBSCRIPTION_ACTIVATED:
				content = `
					<h2>Subscription Activated! 🎉</h2>
					<p>Great news! Your <strong>${data.tierName}</strong> membership for <strong>${data.serverName}</strong> is now active.</p>
					${data.features && data.features.length > 0 ? `
					<div class="info-box">
						<h4 style="margin-top: 0;">Your Premium Features:</h4>
						<ul>
							${data.features.map(f => `<li>${f}</li>`).join("")}
						</ul>
					</div>
					` : ""}
					${data.expiresAt !== "Never" ? `<p><strong>Valid until:</strong> ${data.expiresAt}</p>` : ""}
					<a href="${configJS.hostingURL}" class="button">Go to Dashboard</a>
				`;
				break;

			case EMAIL_TYPES.SUBSCRIPTION_EXPIRING:
				content = `
					<h2>Your Subscription is Expiring Soon</h2>
					<div class="alert alert-warning">
						<strong>Heads up!</strong> Your <strong>${data.tierName}</strong> membership for
						<strong>${data.serverName}</strong> expires in <strong>${data.daysRemaining} days</strong>
						(${data.expiresAt}).
					</div>
					<p>To continue enjoying premium features, please renew your subscription before it expires.</p>
					<a href="${data.renewUrl}" class="button">Renew Now</a>
				`;
				break;

			case EMAIL_TYPES.SUBSCRIPTION_CANCELLED:
				content = `
					<h2>Subscription Cancelled</h2>
					<p>Your <strong>${data.tierName}</strong> membership for <strong>${data.serverName}</strong> has been cancelled.</p>
					<div class="info-box">
						<p><strong>Access until:</strong> ${data.endDate}</p>
					</div>
					<p>You can still use your premium features until the end of your billing period. We'd love to have you back anytime!</p>
					<a href="${configJS.hostingURL}membership" class="button">Resubscribe</a>
				`;
				break;

			case EMAIL_TYPES.ADMIN_ALERT: {
				const severityClass = {
					info: "alert-info",
					warning: "alert-warning",
					error: "alert-error",
					success: "alert-success",
				}[data.severity] || "alert-info";
				content = `
					<h2>Admin Alert</h2>
					<div class="alert ${severityClass}">
						<strong>${data.subject}</strong>
						<p>${data.message}</p>
					</div>
					${Object.keys(data.details || {}).length > 0 ? `
					<div class="info-box">
						<h4 style="margin-top: 0;">Details:</h4>
						${Object.entries(data.details).map(([key, value]) => `
							<div class="info-row"><span class="info-label">${key}</span><span class="info-value">${value}</span></div>
						`).join("")}
					</div>
					` : ""}
					<p><small>Timestamp: ${data.timestamp}</small></p>
				`;
				break;
			}

			case EMAIL_TYPES.NOTIFICATION:
			default:
				content = `
					<h2>${data.subject || "Notification"}</h2>
					<p>${data.message}</p>
					${data.actionUrl ? `<a href="${data.actionUrl}" class="button">${data.actionText || "View Details"}</a>` : ""}
				`;
				break;
		}

		return wrapTemplate(content);
	}

	/**
	 * Convert HTML to plain text
	 * @param {string} html - HTML content
	 * @returns {string} Plain text
	 */
	htmlToPlainText (html) {
		return html
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	/**
	 * Validate email address format
	 * @param {string} email - Email address
	 * @returns {boolean}
	 */
	isValidEmail (email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Format currency amount
	 * @param {number} amount - Amount in cents
	 * @param {string} currency - Currency code
	 * @returns {string} Formatted amount
	 */
	formatCurrency (amount, currency = "USD") {
		const value = (amount / 100).toFixed(2);
		const symbols = { USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$" };
		return `${symbols[currency] || currency} ${value}`;
	}

	/**
	 * Test email configuration by sending a test email
	 * @param {string} testEmail - Email address to send test to
	 * @returns {Promise<Object>} Test result
	 */
	async sendTestEmail (testEmail) {
		const html = await this.renderTemplate(EMAIL_TYPES.NOTIFICATION, {
			subject: "Test Email",
			message: "This is a test email to verify your email configuration is working correctly. If you received this, your email service is properly configured!",
			actionUrl: configJS.hostingURL,
			actionText: "Go to Dashboard",
		});

		return this.send({
			to: testEmail,
			subject: "Test Email - Configuration Verified",
			html,
			type: "test",
			metadata: { test: true },
		});
	}
}

module.exports = EmailService;
module.exports.EMAIL_TYPES = EMAIL_TYPES;
module.exports.DELIVERY_STATUS = DELIVERY_STATUS;
