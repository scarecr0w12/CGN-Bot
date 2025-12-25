/**
 * Get list of available templates
 * GET /api/templates
 */
export function getTemplates(req: any, res: any): Promise<void>;
/**
 * Apply a template to a server
 * POST /api/templates/apply
 * Body: { serverId, templateId }
 */
export function applyTemplate(req: any, res: any): Promise<any>;
/**
 * Template selection page for new servers
 * GET /setup/templates/:serverId
 */
export function templateSelectionPage(req: any, { res }: {
    res: any;
}): Promise<any>;
//# sourceMappingURL=templates.d.ts.map