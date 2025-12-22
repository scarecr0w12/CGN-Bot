/**
 * Handle referral invite link
 * GET /invite/ref/:code
 * Redirects to Discord OAuth with referral tracking
 */
export function handleReferralInvite(req: any, res: any): Promise<any>;
/**
 * Get user's referral information
 * GET /api/referral/stats
 */
export function getReferralStats(req: any, res: any): Promise<any>;
/**
 * Generate or regenerate referral code
 * POST /api/referral/generate-code
 */
export function generateReferralCode(req: any, res: any): Promise<any>;
/**
 * Referral dashboard page
 * GET /account/referrals
 */
export function referralDashboard(req: any, { res }: {
    res: any;
}): Promise<any>;
//# sourceMappingURL=referral.d.ts.map