export namespace FLAGS {
    namespace NEW_AI_MODELS {
        let id: string;
        let name: string;
        let description: string;
        let stage: string;
        let requiresEarlyAccess: boolean;
    }
    namespace ADVANCED_ANALYTICS_V2 {
        let id_1: string;
        export { id_1 as id };
        let name_1: string;
        export { name_1 as name };
        let description_1: string;
        export { description_1 as description };
        let stage_1: string;
        export { stage_1 as stage };
        let requiresEarlyAccess_1: boolean;
        export { requiresEarlyAccess_1 as requiresEarlyAccess };
    }
    namespace VOICE_TRANSCRIPTION {
        let id_2: string;
        export { id_2 as id };
        let name_2: string;
        export { name_2 as name };
        let description_2: string;
        export { description_2 as description };
        let stage_2: string;
        export { stage_2 as stage };
        let requiresEarlyAccess_2: boolean;
        export { requiresEarlyAccess_2 as requiresEarlyAccess };
    }
    namespace SCHEDULED_COMMANDS {
        let id_3: string;
        export { id_3 as id };
        let name_3: string;
        export { name_3 as name };
        let description_3: string;
        export { description_3 as description };
        let stage_3: string;
        export { stage_3 as stage };
        let requiresEarlyAccess_3: boolean;
        export { requiresEarlyAccess_3 as requiresEarlyAccess };
    }
    namespace CUSTOM_EMBEDS_BUILDER {
        let id_4: string;
        export { id_4 as id };
        let name_4: string;
        export { name_4 as name };
        let description_4: string;
        export { description_4 as description };
        let stage_4: string;
        export { stage_4 as stage };
        let requiresEarlyAccess_4: boolean;
        export { requiresEarlyAccess_4 as requiresEarlyAccess };
    }
    namespace LEGACY_COMMANDS {
        let id_5: string;
        export { id_5 as id };
        let name_5: string;
        export { name_5 as name };
        let description_5: string;
        export { description_5 as description };
        let stage_5: string;
        export { stage_5 as stage };
        let requiresEarlyAccess_5: boolean;
        export { requiresEarlyAccess_5 as requiresEarlyAccess };
    }
}
export namespace STAGES {
    let ALPHA: string;
    let BETA: string;
    let STABLE: string;
    let DEPRECATED: string;
}
/**
 * Check if a server has early access feature
 * @param {string} serverId - The server ID
 * @returns {Promise<boolean>}
 */
export function hasEarlyAccess(serverId: string): Promise<boolean>;
/**
 * Check if a feature flag is enabled for a server
 * @param {string} serverId - The server ID
 * @param {string} flagId - The feature flag ID
 * @param {Object} serverDocument - Optional server document for server-level overrides
 * @returns {Promise<boolean>}
 */
export function isFeatureEnabled(serverId: string, flagId: string, serverDocument?: any): Promise<boolean>;
/**
 * Get all available features for a server
 * @param {string} serverId - The server ID
 * @returns {Promise<Object[]>} Array of features with availability status
 */
export function getAvailableFeatures(serverId: string): Promise<any[]>;
/**
 * Get beta/alpha features only
 * @param {string} serverId - The server ID
 * @returns {Promise<Object[]>} Array of beta features
 */
export function getBetaFeatures(serverId: string): Promise<any[]>;
/**
 * Opt server into a feature
 * @param {string} serverId - The server ID
 * @param {string} flagId - The feature flag ID
 * @returns {Promise<boolean>} Success status
 */
export function optIntoFeature(serverId: string, flagId: string): Promise<boolean>;
/**
 * Opt server out of a feature
 * @param {string} serverId - The server ID
 * @param {string} flagId - The feature flag ID
 * @returns {Promise<boolean>} Success status
 */
export function optOutOfFeature(serverId: string, flagId: string): Promise<boolean>;
/**
 * Decorator/wrapper for feature-flagged functionality
 * @param {string} flagId - The feature flag ID
 * @param {Function} fn - The function to wrap
 * @param {Function} fallback - Optional fallback function
 * @returns {Function} Wrapped function
 */
export function withFeatureFlag(flagId: string, fn: Function, fallback?: Function): Function;
//# sourceMappingURL=FeatureFlags.d.ts.map