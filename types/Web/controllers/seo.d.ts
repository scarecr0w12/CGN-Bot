/**
 * SEO Controller - Handles sitemap.xml, robots.txt, and other SEO-related routes
 */
/**
 * Generate robots.txt
 */
export function robotsTxt(req: any, res: any): Promise<void>;
/**
 * Generate dynamic sitemap.xml
 */
export function sitemapXml(req: any, res: any): Promise<void>;
/**
 * Generate sitemap index for very large sites (future use)
 */
export function sitemapIndex(req: any, res: any): Promise<void>;
/**
 * Serve IndexNow key verification file
 * The key file is served at /{key}.txt
 */
export function indexNowKey(req: any, res: any): Promise<any>;
//# sourceMappingURL=seo.d.ts.map