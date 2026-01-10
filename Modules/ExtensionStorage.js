/**
 * Extension Storage Manager
 * Handles extension file storage with R2 fallback to local filesystem
 */

const fs = require("fs-nextra");
const path = require("path");
const { getInstance: getR2 } = require("./CloudflareR2");

class ExtensionStorage {
	constructor () {
		this.r2 = getR2();
		this.useR2 = this.r2.isEnabled();
		this.localPath = path.join(__dirname, "../extensions");

		if (this.useR2) {
			logger.info("ExtensionStorage: Using R2 for extension files");
		} else {
			logger.info("ExtensionStorage: Using local filesystem for extension files");
		}
	}

	/**
	 * Save extension code
	 * @param {string} codeId - Extension code ID
	 * @param {string} code - Extension code content
	 */
	async save (codeId, code) {
		const filename = `${codeId}.skyext`;

		if (this.useR2) {
			try {
				await this.r2.upload(`extensions/${filename}`, Buffer.from(code), {
					contentType: "text/plain",
					metadata: {
						type: "extension-code",
						codeId,
					},
				});
				logger.debug(`ExtensionStorage: Saved ${filename} to R2`);
			} catch (err) {
				logger.error(`ExtensionStorage: Failed to save ${filename} to R2, falling back to local`, {}, err);
				await fs.outputFileAtomic(path.join(this.localPath, filename), code);
			}
		} else {
			await fs.outputFileAtomic(path.join(this.localPath, filename), code);
		}
	}

	/**
	 * Load extension code
	 * @param {string} codeId - Extension code ID
	 * @returns {Promise<string>} Extension code
	 */
	async load (codeId) {
		const filename = `${codeId}.skyext`;

		if (this.useR2) {
			try {
				const data = await this.r2.download(`extensions/${filename}`);
				if (data) {
					logger.debug(`ExtensionStorage: Loaded ${filename} from R2`);
					return data.toString();
				}
			} catch (err) {
				logger.warn(`ExtensionStorage: Failed to load ${filename} from R2, trying local`, {}, err);
			}
		}

		// Fallback to local filesystem
		const localFile = path.join(this.localPath, filename);
		if (await fs.pathExists(localFile)) {
			return fs.readFile(localFile, "utf8");
		}

		throw new Error(`Extension code not found: ${codeId}`);
	}

	/**
	 * Delete extension code
	 * @param {string} codeId - Extension code ID
	 */
	async delete (codeId) {
		const filename = `${codeId}.skyext`;

		if (this.useR2) {
			try {
				await this.r2.delete(`extensions/${filename}`);
				logger.debug(`ExtensionStorage: Deleted ${filename} from R2`);
			} catch (err) {
				logger.warn(`ExtensionStorage: Failed to delete ${filename} from R2`, {}, err);
			}
		}

		// Also try to delete local copy if it exists
		const localFile = path.join(this.localPath, filename);
		if (await fs.pathExists(localFile)) {
			await fs.remove(localFile);
		}
	}

	/**
	 * Check if extension code exists
	 * @param {string} codeId - Extension code ID
	 * @returns {Promise<boolean>}
	 */
	async exists (codeId) {
		const filename = `${codeId}.skyext`;

		if (this.useR2) {
			try {
				const exists = await this.r2.exists(`extensions/${filename}`);
				if (exists) return true;
			} catch (err) {
				logger.debug(`ExtensionStorage: R2 exists check failed for ${filename}`, {}, err);
			}
		}

		// Check local filesystem
		return fs.pathExists(path.join(this.localPath, filename));
	}

	/**
	 * Save extension package (.skypkg)
	 * @param {string} extensionId - Extension ID
	 * @param {Object} packageData - Package data
	 */
	async savePackage (extensionId, packageData) {
		const content = JSON.stringify(packageData, null, 2);

		if (this.useR2) {
			try {
				await this.r2.uploadExtensionPackage(extensionId, Buffer.from(content));
				logger.debug(`ExtensionStorage: Saved package ${extensionId}.skypkg to R2`);
				return;
			} catch (err) {
				logger.error(`ExtensionStorage: Failed to save package to R2`, {}, err);
			}
		}

		// Fallback to local
		const filename = path.join(this.localPath, `${extensionId}.skypkg`);
		await fs.outputFileAtomic(filename, content);
	}

	/**
	 * Load extension package (.skypkg)
	 * @param {string} extensionId - Extension ID
	 * @returns {Promise<Object>} Package data
	 */
	async loadPackage (extensionId) {
		if (this.useR2) {
			try {
				const data = await this.r2.download(`extensions/${extensionId}.skypkg`);
				if (data) {
					return JSON.parse(data.toString());
				}
			} catch (err) {
				logger.debug(`ExtensionStorage: Failed to load package from R2`, {}, err);
			}
		}

		// Fallback to local
		const filename = path.join(this.localPath, `${extensionId}.skypkg`);
		if (await fs.pathExists(filename)) {
			const content = await fs.readFile(filename, "utf8");
			return JSON.parse(content);
		}

		throw new Error(`Extension package not found: ${extensionId}`);
	}
}

// Singleton instance
let instance = null;

module.exports = {
	ExtensionStorage,

	/**
	 * Get singleton instance
	 */
	getInstance () {
		if (!instance) {
			instance = new ExtensionStorage();
		}
		return instance;
	},

	/**
	 * Initialize new instance
	 */
	initialize () {
		instance = new ExtensionStorage();
		return instance;
	},
};
