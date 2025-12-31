const { randomBytes } = require("crypto");

/**
 * Embed Template Manager
 * Manages saving, loading, and organizing embed templates
 */
class EmbedTemplateManager {
	constructor (database) {
		this.db = database;
		this.EmbedTemplates = database.EmbedTemplates;
	}

	/**
	 * Generate unique template ID
	 * @returns {string}
	 */
	generateId () {
		return randomBytes(8).toString("hex");
	}

	/**
	 * Create a new embed template
	 * @param {string} serverId - Server ID
	 * @param {string} userId - Creator user ID
	 * @param {string} name - Template name
	 * @param {Object} embedData - Embed configuration
	 * @param {string} description - Optional description
	 * @returns {Promise<Object>}
	 */
	async createTemplate (serverId, userId, name, embedData, description = "") {
		const templateId = this.generateId();

		const template = await this.EmbedTemplates.create({
			_id: templateId,
			server_id: serverId,
			name,
			description,
			embed_data: embedData,
			created_by: userId,
			created_at: new Date(),
			updated_at: new Date(),
			use_count: 0,
		});

		return template;
	}

	/**
	 * Get template by ID
	 * @param {string} templateId
	 * @returns {Promise<Object|null>}
	 */
	async getTemplate (templateId) {
		return this.EmbedTemplates.findOne({ _id: templateId }).exec();
	}

	/**
	 * Get all templates for a server
	 * @param {string} serverId
	 * @param {number} limit - Maximum templates to return
	 * @returns {Promise<Array>}
	 */
	async getServerTemplates (serverId, limit = 50) {
		return this.EmbedTemplates.find({ server_id: serverId })
			.sort({ updated_at: -1 })
			.limit(limit)
			.exec();
	}

	/**
	 * Update template
	 * @param {string} templateId
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object|null>}
	 */
	async updateTemplate (templateId, updates) {
		const template = await this.getTemplate(templateId);
		if (!template) return null;

		const query = template.query;

		if (updates.name) query.set("name", updates.name);
		if (updates.description !== undefined) query.set("description", updates.description);
		if (updates.embed_data) query.set("embed_data", updates.embed_data);
		query.set("updated_at", new Date());

		await template.save();
		return template;
	}

	/**
	 * Delete template
	 * @param {string} templateId
	 * @returns {Promise<boolean>}
	 */
	async deleteTemplate (templateId) {
		const result = await this.EmbedTemplates.delete({ _id: templateId });
		return result.deletedCount > 0;
	}

	/**
	 * Increment use count
	 * @param {string} templateId
	 * @returns {Promise<void>}
	 */
	async incrementUseCount (templateId) {
		const template = await this.getTemplate(templateId);
		if (!template) return;

		const query = template.query;
		query.inc("use_count", 1);
		await template.save();
	}

	/**
	 * Search templates by name
	 * @param {string} serverId
	 * @param {string} searchQuery
	 * @param {number} limit
	 * @returns {Promise<Array>}
	 */
	async searchTemplates (serverId, searchQuery, limit = 20) {
		const templates = await this.EmbedTemplates.find({
			server_id: serverId,
			name: { $regex: searchQuery, $options: "i" },
		})
			.limit(limit)
			.exec();

		return templates;
	}

	/**
	 * Get templates created by a specific user
	 * @param {string} serverId
	 * @param {string} userId
	 * @param {number} limit
	 * @returns {Promise<Array>}
	 */
	async getUserTemplates (serverId, userId, limit = 25) {
		return this.EmbedTemplates.find({
			server_id: serverId,
			created_by: userId,
		})
			.sort({ updated_at: -1 })
			.limit(limit)
			.exec();
	}

	/**
	 * Get most used templates
	 * @param {string} serverId
	 * @param {number} limit
	 * @returns {Promise<Array>}
	 */
	async getPopularTemplates (serverId, limit = 10) {
		return this.EmbedTemplates.find({ server_id: serverId })
			.sort({ use_count: -1 })
			.limit(limit)
			.exec();
	}
}

module.exports = EmbedTemplateManager;
