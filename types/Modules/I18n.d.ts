/**
 * Initialize the i18n system
 * @returns {Promise<void>}
 */
export function initialize(): Promise<void>;
/**
 * Translate a key with optional interpolation
 * @param {string} key - Translation key (namespace:key format)
 * @param {string} lng - Language code
 * @param {Object} options - Interpolation options
 * @returns {string} Translated string
 */
declare function translate(key: string, lng?: string, options?: any): string;
/**
 * Get a translator function for a specific language
 * @param {string} lng - Language code
 * @returns {Function} Translation function
 */
export function getTranslator(lng?: string): Function;
/**
 * Get language from various sources (user preference, server config, etc.)
 * @param {Object} options - Options containing user, server, or request
 * @returns {string} Language code
 */
export function getLanguage({ userDocument, serverDocument, req }?: any): string;
/**
 * Create a context-aware translator for bot commands
 * @param {Object} context - Context with guild, user documents
 * @returns {Object} Translator object with t function and language info
 */
export function createBotTranslator({ serverDocument, userDocument }?: any): any;
/**
 * Create a context-aware translator for web requests
 * @param {Object} req - Express request object
 * @returns {Object} Translator object
 */
export function createWebTranslator(req: any): any;
/**
 * Express middleware to add i18n to requests
 */
export function middleware(): (req: any, res: any, next: any) => void;
/**
 * Check if a language is supported
 * @param {string} lng - Language code
 * @returns {boolean}
 */
export function isSupported(lng: string): boolean;
/**
 * Get list of supported languages
 * @returns {Object} Supported languages object
 */
export function getSupportedLanguages(): any;
/**
 * Get the i18next instance for advanced usage
 * @returns {Object} i18next instance
 */
export function getInstance(): any;
export namespace SUPPORTED_LANGUAGES {
    namespace en {
        let name: string;
        let nativeName: string;
        let flag: string;
    }
    namespace es {
        let name_1: string;
        export { name_1 as name };
        let nativeName_1: string;
        export { nativeName_1 as nativeName };
        let flag_1: string;
        export { flag_1 as flag };
    }
    namespace fr {
        let name_2: string;
        export { name_2 as name };
        let nativeName_2: string;
        export { nativeName_2 as nativeName };
        let flag_2: string;
        export { flag_2 as flag };
    }
    namespace de {
        let name_3: string;
        export { name_3 as name };
        let nativeName_3: string;
        export { nativeName_3 as nativeName };
        let flag_3: string;
        export { flag_3 as flag };
    }
    namespace pt {
        let name_4: string;
        export { name_4 as name };
        let nativeName_4: string;
        export { nativeName_4 as nativeName };
        let flag_4: string;
        export { flag_4 as flag };
    }
    namespace ja {
        let name_5: string;
        export { name_5 as name };
        let nativeName_5: string;
        export { nativeName_5 as nativeName };
        let flag_5: string;
        export { flag_5 as flag };
    }
    namespace ko {
        let name_6: string;
        export { name_6 as name };
        let nativeName_6: string;
        export { nativeName_6 as nativeName };
        let flag_6: string;
        export { flag_6 as flag };
    }
    namespace zh {
        let name_7: string;
        export { name_7 as name };
        let nativeName_7: string;
        export { nativeName_7 as nativeName };
        let flag_7: string;
        export { flag_7 as flag };
    }
    namespace ru {
        let name_8: string;
        export { name_8 as name };
        let nativeName_8: string;
        export { nativeName_8 as nativeName };
        let flag_8: string;
        export { flag_8 as flag };
    }
    namespace it {
        let name_9: string;
        export { name_9 as name };
        let nativeName_9: string;
        export { nativeName_9 as nativeName };
        let flag_9: string;
        export { flag_9 as flag };
    }
    namespace nl {
        let name_10: string;
        export { name_10 as name };
        let nativeName_10: string;
        export { nativeName_10 as nativeName };
        let flag_10: string;
        export { flag_10 as flag };
    }
    namespace pl {
        let name_11: string;
        export { name_11 as name };
        let nativeName_11: string;
        export { nativeName_11 as nativeName };
        let flag_11: string;
        export { flag_11 as flag };
    }
    namespace tr {
        let name_12: string;
        export { name_12 as name };
        let nativeName_12: string;
        export { nativeName_12 as nativeName };
        let flag_12: string;
        export { flag_12 as flag };
    }
    namespace ar {
        let name_13: string;
        export { name_13 as name };
        let nativeName_13: string;
        export { nativeName_13 as nativeName };
        let flag_13: string;
        export { flag_13 as flag };
    }
    namespace hi {
        let name_14: string;
        export { name_14 as name };
        let nativeName_14: string;
        export { nativeName_14 as nativeName };
        let flag_14: string;
        export { flag_14 as flag };
    }
}
export const DEFAULT_LANGUAGE: "en";
export const NAMESPACES: string[];
export { translate as t };
//# sourceMappingURL=I18n.d.ts.map