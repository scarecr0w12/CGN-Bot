/**
 * Public membership/pricing page
 * Premium subscriptions are per-server, so user must select a server to subscribe
 */
export function pricing(req: any, { res }: {
    res: any;
}): Promise<void>;
/**
 * Create Checkout Session (Stripe or BTCPay)
 */
export function createCheckout(req: any, res: any): Promise<any>;
/**
 * Handle successful checkout
 */
export function success(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Create PayPal subscription
 */
export function createPayPalCheckout(req: any, res: any): Promise<any>;
/**
 * Redeem vote points for premium tier time
 */
export function redeemPoints(req: any, res: any): Promise<any>;
/**
 * Get redemption info for authenticated user
 */
export function getRedemptionInfo(req: any, res: any): Promise<any>;
//# sourceMappingURL=membership.d.ts.map