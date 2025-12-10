const QuerySQL = require("./QuerySQL");
const { Error: SkynetError } = require("../Internals/Errors");
const mpath = require("mpath");
const crypto = require("crypto");

/**
 * SQL Document - Represents a row in a MariaDB table with MongoDB-compatible API
 */
module.exports = class DocumentSQL {
	/**
	 * An object representing a Model document from MariaDB
	 * @param {object} doc The raw data received from MariaDB
	 * @param {ModelSQL} model The Model this document was created by
	 * @constructor
	 */
	constructor (doc, model) {
		/**
		 * A reference to the Model this document was created by
		 * @type {ModelSQL}
		 * @private
		 */
		this._model = model;
		/**
		 * Set to true for new Documents which do not exist in the database or cache.
		 * @type {boolean}
		 * @private
		 */
		this._new = false;
		/**
		 * Reference to the pool
		 * @private
		 */
		this._pool = this._model._pool;
		/**
		 * An internal collection of all the atomic operations to be pushed to MariaDB on save
		 * @type {Object}
		 * @private
		 */
		this._atomics = {};
		/**
		 * The raw data received from MariaDB
		 * @type {Object}
		 * @private
		 */
		this._doc = doc;

		Object.assign(this, this._doc);
	}

	/**
	 * Pushes the pending changes of this document to MariaDB
	 * @returns {Promise<void>}
	 */
	async save () {
		const ops = this._atomics;
		this._atomics = {};
		let error;
		if (this._new) error = this.validate();
		if (error) throw error;
		if (!this._new && !Object.keys(ops).length) return;

		try {
			(this._new ? this._setCache : this._handleAtomics).call(this);
		} catch (err) {
			throw new SkynetError("GADRIVER_ERROR", {}, err);
		}

		// Clean empty atomic operations
		Object.keys(ops).forEach(key => {
			if (Object.keys(ops[key]).length === 0) delete ops[key];
		});

		let conn;
		try {
			conn = await this._pool.getConnection();

			if (this._new) {
				// INSERT
				const keys = Object.keys(this._doc);
				const columns = keys.map(k => `\`${k}\``).join(", ");
				const placeholders = keys.map(() => "?").join(", ");
				const values = keys.map(k => this._serializeValue(this._doc[k]));

				const sql = `INSERT INTO \`${this._model._table}\` (${columns}) VALUES (${placeholders})`;
				await conn.query(sql, values);
			} else {
				// UPDATE - translate atomics to SQL
				const updates = [];
				const params = [];

				if (ops.$set) {
					for (const [key, value] of Object.entries(ops.$set)) {
						updates.push(`\`${key}\` = ?`);
						params.push(this._serializeValue(value));
					}
				}

				if (ops.$inc) {
					for (const [key, value] of Object.entries(ops.$inc)) {
						updates.push(`\`${key}\` = \`${key}\` + ?`);
						params.push(value);
					}
				}

				if (ops.$unset) {
					for (const key of Object.keys(ops.$unset)) {
						updates.push(`\`${key}\` = NULL`);
					}
				}

				if (ops.$push) {
					for (const [key, value] of Object.entries(ops.$push)) {
						if (value.$each) {
							for (const item of value.$each) {
								updates.push(`\`${key}\` = JSON_ARRAY_APPEND(COALESCE(\`${key}\`, '[]'), '$', CAST(? AS JSON))`);
								params.push(JSON.stringify(item));
							}
						} else {
							updates.push(`\`${key}\` = JSON_ARRAY_APPEND(COALESCE(\`${key}\`, '[]'), '$', CAST(? AS JSON))`);
							params.push(JSON.stringify(value));
						}
					}
				}

				if (ops.$pull) {
					for (const [key, pullQuery] of Object.entries(ops.$pull)) {
						if (pullQuery._id && pullQuery._id.$in) {
							for (const id of pullQuery._id.$in) {
								// Complex operation - find and remove by ID in JSON array
								updates.push(`\`${key}\` = JSON_REMOVE(\`${key}\`, REPLACE(JSON_UNQUOTE(JSON_SEARCH(\`${key}\`, 'one', ?, NULL, '$[*]._id')), '._id', ''))`);
								params.push(id);
							}
						}
					}
				}

				if (ops.$pullAll) {
					for (const [key, values] of Object.entries(ops.$pullAll)) {
						for (const val of values) {
							updates.push(`\`${key}\` = JSON_REMOVE(\`${key}\`, JSON_UNQUOTE(JSON_SEARCH(\`${key}\`, 'one', ?)))`);
							params.push(val);
						}
					}
				}

				if (updates.length > 0) {
					const sql = `UPDATE \`${this._model._table}\` SET ${updates.join(", ")} WHERE \`_id\` = ?`;
					params.push(this._id);
					await conn.query(sql, params);
				}
			}
		} catch (err) {
			throw new SkynetError("MARIADB_ERROR", {}, err);
		} finally {
			if (conn) conn.release();
		}
	}

	validate () {
		return this._model.schema.validateDoc(this);
	}

	/**
	 * Returns the raw object according to schema
	 * @returns {object}
	 */
	toObject () {
		return this._doc;
	}

	toString () {
		return JSON.stringify(this.toObject());
	}

	toJSON () {
		return this._doc;
	}

	/**
	 * Cache this document in the Model's cache
	 * @param {boolean} update If an existing version should be overwritten
	 * @returns {boolean}
	 */
	cache (update) {
		return this._setCache(update);
	}

	/**
	 * A new query object tied to this Document
	 * @returns {QuerySQL}
	 * @readonly
	 */
	get query () {
		return new QuerySQL(this);
	}

	/**
	 * Register new atomic operations to be pushed to MariaDB on save
	 * @param {string} path
	 * @param {*} value
	 * @param {string} atomic
	 * @private
	 */
	_setAtomic (path, value, atomic) {
		if (!this._atomics) this._atomics = {};
		if (!this._atomics[atomic]) this._atomics[atomic] = {};
		if (this._mergeAtomics(path, value, atomic)) return;
		if (atomic === "$push") {
			if (!this._atomics.$push[path]) this._atomics.$push[path] = { $each: [] };
			this._atomics.$push[path].$each.push(value);
		} else if (atomic === "$pull") {
			if (!this._atomics.$pull[path]) this._atomics.$pull[path] = { _id: { $in: [] } };
			this._atomics.$pull[path]._id.$in.push(value);
		} else if (atomic === "$pullAll") {
			if (!this._atomics[atomic][path]) this._atomics[atomic][path] = [];
			this._atomics[atomic][path].push(value);
		} else if (atomic === "$inc") {
			if (this._atomics[atomic][path]) this._atomics[atomic][path] += value;
			else this._atomics[atomic][path] = value;
		} else {
			this._atomics[atomic][path] = value;
		}
	}

	_mergeAtomics (newPath, newValue, newAtomic) {
		let atomicsMerged = false;
		const modifyAtomics = ["$set", "$inc", "$unset"];
		Object.keys(this._atomics).forEach(atomic => {
			if (atomicsMerged) return;
			const op = this._atomics[atomic];

			Object.keys(op).forEach(path => {
				if (atomicsMerged || (path.split(".").length === newPath.split(".").length && path !== newPath)) return;
				if (path === newPath) {
					switch (newAtomic) {
						case "$set":
						case "$unset":
							delete op[path];
							break;
						case "$pull":
						case "$pullAll":
							if (modifyAtomics.includes(atomic)) atomicsMerged = true;
							return;
						case "$inc":
							if (atomic === "$set") {
								op[path] += newValue;
								atomicsMerged = true;
							} else if (atomic !== "$inc") {
								atomicsMerged = true;
							}
							break;
						case "$push":
							if (atomic === "$set") atomicsMerged = true;
							break;
						default:
							return;
					}
				} else if (path.startsWith(newPath)) {
					switch (newAtomic) {
						case "$set":
						case "$inc":
						case "$unset":
							delete op[path];
							break;
						default:
							return;
					}
				} else if (newPath.startsWith(path)) {
					switch (atomic) {
						case "$unset":
						case "$pull":
						case "$pullAll":
							atomicsMerged = true;
							return;
						case "$set":
						case "$push":
							atomicsMerged = true;
							return;
					}
				}
			});
		});
		return atomicsMerged;
	}

	/**
	 * Handle this Document's registered Atomics to prepare them for save
	 * @private
	 */
	_handleAtomics () {
		if (this._atomics.$set) {
			Object.keys(this._atomics.$set).forEach(key => {
				const value = this._atomics.$set[key];
				this._modifyCache(key, value);
			});
		}

		if (this._atomics.$unset) {
			Object.keys(this._atomics.$unset).forEach(key => {
				const childPathSeparatorIndex = key.lastIndexOf(".");
				const parentPath = key.substring(0, childPathSeparatorIndex);
				const childPath = key.substring(childPathSeparatorIndex + 1);
				delete mpath.get(parentPath, this._cache)[childPath];
			});
		}

		if (this._atomics.$inc) {
			Object.keys(this._atomics.$inc).forEach(key => {
				const value = mpath.get(key, this._cache);
				this._modifyCache(key, value + this._atomics.$inc[key]);
			});
		}

		if (this._atomics.$push) {
			Object.keys(this._atomics.$push).forEach(key => {
				const values = this._atomics.$push[key].$each;
				this._modifyCache(key, mpath.get(key, this._cache).concat(values));
			});
		}

		if (this._atomics.$pull) {
			Object.keys(this._atomics.$pull).forEach(key => {
				const values = this._atomics.$pull[key]._id.$in;
				const array = mpath.get(key, this._cache);
				values.forEach(id => array.splice(array.findIndex(a => a._id === id), 1));
			});
		}
	}

	/**
	 * Modify a value of the cached version of this document
	 * @param {string} path
	 * @param {*} val
	 * @private
	 */
	_modifyCache (path, val) {
		if (this._existsInCache && !this._new) mpath.set(path, val, this._cache);
	}

	/**
	 * Actually set a document in Model._cache
	 * @param {boolean} force Overwrite existing document
	 * @returns {boolean}
	 * @private
	 */
	_setCache (force) {
		if (!this._existsInCache || force) return !!this._model._cache.set(this._doc._id, this._doc);
		else return false;
	}

	/**
	 * A boolean indicating if a possibly outdated version exists in cache
	 * @returns {boolean}
	 * @private
	 */
	get _existsInCache () {
		return this._model._cache.has(this._doc._id);
	}

	/**
	 * The cached version of this document
	 * @returns {DocumentSQL | undefined}
	 * @private
	 */
	get _cache () {
		return this._model._cache.get(this._doc._id);
	}

	/**
	 * Serialize a value for SQL storage
	 * @param {*} value
	 * @returns {*}
	 * @private
	 */
	_serializeValue (value) {
		if (value === undefined) return null;
		if (value === null) return null;
		if (value instanceof Date) return value;
		if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
			return JSON.stringify(value);
		}
		return value;
	}

	/**
	 * Create a new document which does not exist in the database or cache
	 * @param {object} obj The object containing the new document's data
	 * @param {ModelSQL} model The Model this Document is created by
	 * @returns {DocumentSQL}
	 */
	static new (obj, model) {
		const doc = new DocumentSQL(obj, model);
		doc._new = true;
		if (!doc._doc._id && model.schema._options._id !== false && !model.schema._definitions.get("_id")) {
			// Generate a MongoDB-style ObjectId-like string
			doc._id = doc._doc._id = DocumentSQL.generateId();
		}
		return doc;
	}

	/**
	 * Generate a MongoDB ObjectId-like identifier
	 * @returns {string}
	 */
	static generateId () {
		// Generate 24 character hex string similar to MongoDB ObjectId
		return crypto.randomBytes(12).toString("hex");
	}
};
