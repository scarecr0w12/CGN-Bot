export = EmailService;
declare class EmailService {
    constructor(client: any);
    client: any;
    transporter: any;
    queue: any[];
    processing: boolean;
    retryAttempts: number;
    retryDelay: number;
    initialized: boolean;
    /**
     * Initialize the email transporter based on configuration
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    initialize(): Promise<boolean>;
    /**
     * Build nodemailer transporter configuration
     * @param {Object} emailConfig - Email configuration from site settings
     * @returns {Object|null} Transporter configuration
     */
    buildTransporterConfig(emailConfig: any): any | null;
    /**
     * Get configured sender info
     * @returns {Promise<Object>} Sender info { name, email }
     */
    getSenderInfo(): Promise<any>;
    /**
     * Check if email service is available
     * @returns {Promise<boolean>}
     */
    isAvailable(): Promise<boolean>;
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
    send(options: {
        to: string;
        subject: string;
        html: string;
        text?: string;
        type?: string;
        metadata?: any;
    }): Promise<any>;
    /**
     * Queue an email for sending (with retry support)
     * @param {Object} options - Same as send() options
     */
    queueEmail(options: any): Promise<void>;
    /**
     * Process the email queue
     */
    processQueue(): Promise<void>;
    /**
     * Send a receipt email for a membership purchase
     * @param {Object} data - Receipt data
     * @returns {Promise<Object>} Send result
     */
    sendReceipt(data: any): Promise<any>;
    /**
     * Send subscription activated notification
     * @param {Object} data - Subscription data
     * @returns {Promise<Object>} Send result
     */
    sendSubscriptionActivated(data: any): Promise<any>;
    /**
     * Send subscription expiring reminder
     * @param {Object} data - Subscription data
     * @returns {Promise<Object>} Send result
     */
    sendSubscriptionExpiring(data: any): Promise<any>;
    /**
     * Send subscription cancelled notification
     * @param {Object} data - Cancellation data
     * @returns {Promise<Object>} Send result
     */
    sendSubscriptionCancelled(data: any): Promise<any>;
    /**
     * Send admin alert email
     * @param {Object} data - Alert data
     * @returns {Promise<Object>} Send result
     */
    sendAdminAlert(data: any): Promise<any>;
    /**
     * Send generic notification email
     * @param {Object} data - Notification data
     * @returns {Promise<Object>} Send result
     */
    sendNotification(data: any): Promise<any>;
    /**
     * Render an email template
     * @param {string} type - Email type
     * @param {Object} data - Template data
     * @returns {Promise<string>} Rendered HTML
     */
    renderTemplate(type: string, data: any): Promise<string>;
    /**
     * Convert HTML to plain text
     * @param {string} html - HTML content
     * @returns {string} Plain text
     */
    htmlToPlainText(html: string): string;
    /**
     * Validate email address format
     * @param {string} email - Email address
     * @returns {boolean}
     */
    isValidEmail(email: string): boolean;
    /**
     * Format currency amount
     * @param {number} amount - Amount in cents
     * @param {string} currency - Currency code
     * @returns {string} Formatted amount
     */
    formatCurrency(amount: number, currency?: string): string;
    /**
     * Test email configuration by sending a test email
     * @param {string} testEmail - Email address to send test to
     * @returns {Promise<Object>} Test result
     */
    sendTestEmail(testEmail: string): Promise<any>;
}
declare namespace EmailService {
    export { EMAIL_TYPES, DELIVERY_STATUS };
}
declare namespace EMAIL_TYPES {
    let RECEIPT: string;
    let SUBSCRIPTION_ACTIVATED: string;
    let SUBSCRIPTION_CANCELLED: string;
    let SUBSCRIPTION_EXPIRING: string;
    let WELCOME: string;
    let PASSWORD_RESET: string;
    let NOTIFICATION: string;
    let ADMIN_ALERT: string;
}
declare namespace DELIVERY_STATUS {
    let PENDING: string;
    let SENT: string;
    let FAILED: string;
    let BOUNCED: string;
}
//# sourceMappingURL=EmailService.d.ts.map