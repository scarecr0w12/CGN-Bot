export namespace THEMES {
    namespace _default {
        let id: string;
        let name: string;
        let description: string;
        let isPremium: boolean;
        namespace colors {
            let primary: string;
            let secondary: string;
            let background: string;
            let surface: string;
            let text: string;
        }
    }
    export { _default as default };
    export namespace dark {
        let id_1: string;
        export { id_1 as id };
        let name_1: string;
        export { name_1 as name };
        let description_1: string;
        export { description_1 as description };
        let isPremium_1: boolean;
        export { isPremium_1 as isPremium };
        export namespace colors_1 {
            let primary_1: string;
            export { primary_1 as primary };
            let secondary_1: string;
            export { secondary_1 as secondary };
            let background_1: string;
            export { background_1 as background };
            let surface_1: string;
            export { surface_1 as surface };
            let text_1: string;
            export { text_1 as text };
        }
        export { colors_1 as colors };
    }
    export namespace midnight {
        let id_2: string;
        export { id_2 as id };
        let name_2: string;
        export { name_2 as name };
        let description_2: string;
        export { description_2 as description };
        let isPremium_2: boolean;
        export { isPremium_2 as isPremium };
        export namespace colors_2 {
            let primary_2: string;
            export { primary_2 as primary };
            let secondary_2: string;
            export { secondary_2 as secondary };
            let background_2: string;
            export { background_2 as background };
            let surface_2: string;
            export { surface_2 as surface };
            let text_2: string;
            export { text_2 as text };
        }
        export { colors_2 as colors };
    }
    export namespace forest {
        let id_3: string;
        export { id_3 as id };
        let name_3: string;
        export { name_3 as name };
        let description_3: string;
        export { description_3 as description };
        let isPremium_3: boolean;
        export { isPremium_3 as isPremium };
        export namespace colors_3 {
            let primary_3: string;
            export { primary_3 as primary };
            let secondary_3: string;
            export { secondary_3 as secondary };
            let background_3: string;
            export { background_3 as background };
            let surface_3: string;
            export { surface_3 as surface };
            let text_3: string;
            export { text_3 as text };
        }
        export { colors_3 as colors };
    }
    export namespace sunset {
        let id_4: string;
        export { id_4 as id };
        let name_4: string;
        export { name_4 as name };
        let description_4: string;
        export { description_4 as description };
        let isPremium_4: boolean;
        export { isPremium_4 as isPremium };
        export namespace colors_4 {
            let primary_4: string;
            export { primary_4 as primary };
            let secondary_4: string;
            export { secondary_4 as secondary };
            let background_4: string;
            export { background_4 as background };
            let surface_4: string;
            export { surface_4 as surface };
            let text_4: string;
            export { text_4 as text };
        }
        export { colors_4 as colors };
    }
}
/**
 * Check if server has premium dashboard feature
 * @param {string} serverId - The server ID
 * @returns {Promise<boolean>}
 */
export function hasPremiumDashboard(serverId: string): Promise<boolean>;
/**
 * Get available themes for a server
 * @param {string} serverId - The server ID
 * @returns {Promise<Object[]>} Array of available themes
 */
export function getAvailableThemes(serverId: string): Promise<any[]>;
/**
 * Get server's current theme (stored in user preferences but gated by server premium)
 * @param {Object} userDocument - The user document (stores theme preference)
 * @param {string} serverId - The server ID for premium check
 * @returns {Promise<Object>} Theme object
 */
export function getUserTheme(userDocument: any, serverId: string): Promise<any>;
/**
 * Set user's theme preference (gated by server premium)
 * @param {Object} userQueryDocument - The user query document
 * @param {string} themeId - The theme ID
 * @param {string} serverId - The server ID for premium check
 * @returns {Promise<boolean>} Success status
 */
export function setUserTheme(userQueryDocument: any, themeId: string, serverId: string): Promise<boolean>;
/**
 * Generate CSS variables for a theme
 * @param {Object} theme - The theme object
 * @returns {string} CSS custom properties
 */
export function generateThemeCSS(theme: any): string;
//# sourceMappingURL=ThemeHelper.d.ts.map