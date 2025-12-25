/**
 * Public server page - displays server info with SEO-friendly slug URL
 * All servers have a basic profile page, Tier 1+ can customize
 * Routes: /server/:id/:slug, /server/:id (legacy, redirects to slug)
 */
export function publicPage(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Generate or regenerate slug for a server
 * POST /server/:id/generate-slug
 */
export function generateSlug(req: any, res: any): Promise<any>;
/**
 * Server Profile Editor Page (Dashboard)
 * GET /dashboard/:svrid/server-profile
 * Free servers see a preview with upsell, Tier 1+ can edit
 */
export function profileEditor(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Update Server Profile
 * POST /api/server/:serverId/profile
 */
export function updateProfile(req: any, res: any): Promise<any>;
//# sourceMappingURL=server.d.ts.map