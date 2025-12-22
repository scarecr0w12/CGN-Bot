/**
 * Get all available templates
 * @returns {Array} List of template summaries
 */
export function getTemplates(): any[];
/**
 * Get a specific template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
export function getTemplate(templateId: string): any | null;
/**
 * Apply a template to a server document
 * @param {Object} serverDocument - The server document to configure
 * @param {string} templateId - Template ID to apply
 * @param {Object} client - Discord client for extension installation
 * @returns {Object} The modified server document
 */
export function applyTemplate(serverDocument: any, templateId: string, client: any): any;
/**
 * Check if a template is valid
 * @param {string} templateId - Template ID
 * @returns {boolean} True if valid
 */
export function isValidTemplate(templateId: string): boolean;
//# sourceMappingURL=ServerTemplates.d.ts.map