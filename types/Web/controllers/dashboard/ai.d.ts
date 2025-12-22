/**
 * AI Settings - Main configuration page
 */
export function settings(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace settings {
    function post(req: any, res: any): Promise<void>;
}
/**
 * AI Governance - Budget and access controls
 */
export function governance(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace governance {
    function post(req: any, res: any): Promise<void>;
}
/**
 * AI Models API - Fetch available models for a provider
 * Returns JSON list of models based on provider and stored API key
 */
export function models(req: any, res: any): Promise<any>;
/**
 * AI Vector Memory - Qdrant configuration page
 */
export function memory(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace memory {
    function post(req: any, res: any): Promise<void>;
}
/**
 * Test Qdrant connection API
 */
export function testQdrant(req: any, res: any): Promise<any>;
/**
 * Clear vector memory API
 */
export function clearVectorMemory(req: any, res: any): Promise<void>;
/**
 * Get vector memory stats API
 */
export function vectorStats(req: any, res: any): Promise<void>;
/**
 * AI Personality - System Prompt configuration
 */
export function personality(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace personality {
    function post(req: any, res: any): Promise<void>;
}
//# sourceMappingURL=ai.d.ts.map