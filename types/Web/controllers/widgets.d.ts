/**
 * Generate server stats widget as SVG
 * GET /widgets/server/:serverId/stats.svg
 */
export function serverStatsSvg(req: any, res: any): Promise<any>;
/**
 * Generate leaderboard widget as SVG
 * GET /widgets/server/:serverId/leaderboard.svg
 */
export function leaderboardSvg(req: any, res: any): Promise<any>;
/**
 * Widget iframe page
 * GET /widgets/server/:serverId/embed
 */
export function embedPage(req: any, { res }: {
    res: any;
}): Promise<any>;
/**
 * Widget configuration/generator page (for dashboard)
 * GET /dashboard/:serverId/widgets
 */
export function widgetGenerator(req: any, { res }: {
    res: any;
}): Promise<any>;
//# sourceMappingURL=widgets.d.ts.map