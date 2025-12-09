/**
 * A metadata entry for TemporaryStorage.
 * @typedef TemporaryStorageEntry
 * @type {Object}
 * @property {String} prefix
 * @property {String} type
 * @property {?String} id
 * @property {?String} path
 * @property {Boolean} persistent
 */
/**
 * TemporaryStorage metadata.
 * @typedef TemporaryStorageMetadata
 * @type {Object}
 * @property {TemporaryStorageEntry[]} entries
 */

const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");

class TemporaryStorage {
	constructor () {
		this._temporaryStorage = path.join(__dirname, "../Temp");
		this._metadataLocation = "metadata.json";
	}

	/**
	 * Create a TemporaryStorage entry and directory.
	 * @param {TemporaryStorageEntry} data
	 * @returns {Promise<TemporaryStorageEntry>}
	 */
	async create (data) {
		await this.createStorage();
		const prefix = data.prefix || data.type.charAt(0).toLowerCase();
		const tempPath = data.id ? await fs.promises.mkdir(path.join(this._temporaryStorage, `${prefix}-${data.id}`)) : await fs.promises.mkdtemp(path.join(this._temporaryStorage, `${prefix}-`));
		if (!data.prefix) data.prefix = prefix;
		if (!data.id) data.id = tempPath.substring(tempPath.length - 6);
		await this._createMetadataEntry(data);
		data.path = path.join(this._temporaryStorage, `${prefix}-${data.id}`);
		return data;
	}

	/**
	 * Get a TemporaryStorage entry.
	 * @param type
	 * @param id
	 * @returns {Promise<?TemporaryStorageEntry>}
	 */
	async get (type, id) {
		await this.createStorage();
		const { entries } = await this._getMetadata();
		if (!entries) return null;
		const metadataEntry = entries.find(entry => entry.type === type && entry.id === id);
		if (!metadataEntry) return null;
		metadataEntry.path = path.join(this._temporaryStorage, `${metadataEntry.prefix}-${metadataEntry.id}`);
		return metadataEntry;
	}

	/**
	 * Delete a TemporaryStorage entry.
	 * @param type
	 * @param id
	 * @returns {Promise<?TemporaryStorageEntry>}
	 */
	async delete (type, id) {
		const entry = await this.get(type, id);
		if (!entry) return null;
		rimraf.sync(entry.path);
		await this._deleteMetadataEntry(entry);
		return entry;
	}

	/**
	 * Create a metadata entry.
	 * @param {TemporaryStorageEntry} data
	 * @returns {Promise<TemporaryStorageMetadata>}
	 * @private
	 */
	async _createMetadataEntry (data) {
		const metadata = await this._getMetadata();
		metadata.entries = metadata.entries || [];
		metadata.entries.push({
			prefix: data.prefix,
			type: data.type,
			id: data.id,
			persistent: !!data.persistent,
		});
		await fs.promises.writeFile(path.join(this._temporaryStorage, this._metadataLocation), JSON.stringify(metadata));
		return metadata;
	}

	/**
	 * Delete a metadata entry.
	 * @param {TemporaryStorageEntry} data
	 * @returns {Promise<TemporaryStorageMetadata>}
	 * @private
	 */
	async _deleteMetadataEntry (data) {
		const metadata = await this._getMetadata();
		metadata.entries = metadata.entries || [];
		metadata.entries = metadata.entries.filter(entry => entry.type !== data.type || entry.id !== data.id);
		await fs.promises.writeFile(path.join(this._temporaryStorage, this._metadataLocation), JSON.stringify(metadata));
		return metadata;
	}

	/**
	 * Get current metadata.
	 * @returns {Promise<TemporaryStorageMetadata>}
	 * @private
	 */
	async _getMetadata () {
		const metadataPath = path.join(this._temporaryStorage, this._metadataLocation);
		try {
			const data = await fs.promises.readFile(metadataPath, "utf8");
			return JSON.parse(data) || { entries: [] };
		} catch (err) {
			if (err.code === "ENOENT") {
				// File doesn't exist, create it with empty entries
				await fs.promises.writeFile(metadataPath, JSON.stringify({ entries: [] }));
				return { entries: [] };
			}
			throw err;
		}
	}

	async createStorage () {
		const storageExists = await fs.promises.access(this._temporaryStorage).then(() => true).catch(() => false);
		if (!storageExists) {
			await fs.promises.mkdir(this._temporaryStorage, { recursive: true });
		}
		// Always ensure metadata.json exists
		const metadataPath = path.join(this._temporaryStorage, this._metadataLocation);
		const metadataExists = await fs.promises.access(metadataPath).then(() => true).catch(() => false);
		if (!metadataExists) {
			await fs.promises.writeFile(metadataPath, JSON.stringify({ entries: [] }));
		}
	}
}

module.exports = TemporaryStorage;
