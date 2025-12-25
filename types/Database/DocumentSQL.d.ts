export = DocumentSQL;
declare class DocumentSQL {
    /**
     * Create a new document which does not exist in the database or cache
     * @param {object} obj The object containing the new document's data
     * @param {ModelSQL} model The Model this Document is created by
     * @returns {DocumentSQL}
     */
    static "new"(obj: object, model: ModelSQL): DocumentSQL;
    /**
     * Generate a MongoDB ObjectId-like identifier
     * @returns {string}
     */
    static generateId(): string;
    /**
     * An object representing a Model document from MariaDB
     * @param {ModelSQL} model The Model this document was created by
     * @param {object} doc The raw data received from MariaDB
     * @param {boolean} isNew Whether this is a new document not yet in database
     * @constructor
     */
    constructor(model: ModelSQL, doc: object, isNew?: boolean);
    /**
     * A reference to the Model this document was created by
     * @type {ModelSQL}
     * @private
     */
    private _model;
    /**
     * Set to true for new Documents which do not exist in the database or cache.
     * @type {boolean}
     * @private
     */
    private _new;
    /**
     * Reference to the pool getter
     * @private
     */
    private _getPool;
    /**
     * An internal collection of all the atomic operations to be pushed to MariaDB on save
     * @type {Object}
     * @private
     */
    private _atomics;
    /**
     * The raw data received from MariaDB
     * @type {Object}
     * @private
     */
    private _doc;
    /**
     * Recursively adds an .id() method to arrays for MongoDB subdocument compatibility
     * @param {Object} obj The object to process
     * @private
     */
    private _addIdMethodToArrays;
    /**
     * Pushes the pending changes of this document to MariaDB
     * @returns {Promise<void>}
     */
    save(): Promise<void>;
    validate(): any;
    /**
     * Returns the raw object according to schema
     * @returns {object}
     */
    toObject(): object;
    toString(): string;
    toJSON(): any;
    /**
     * Cache this document in the Model's cache
     * @param {boolean} update If an existing version should be overwritten
     * @returns {boolean}
     */
    cache(update: boolean): boolean;
    /**
     * A new query object tied to this Document
     * @returns {QuerySQL}
     * @readonly
     */
    readonly get query(): QuerySQL;
    /**
     * Register new atomic operations to be pushed to MariaDB on save
     * @param {string} path
     * @param {*} value
     * @param {string} atomic
     * @private
     */
    private _setAtomic;
    _mergeAtomics(newPath: any, newValue: any, newAtomic: any): boolean;
    /**
     * Handle this Document's registered Atomics to prepare them for save
     * @private
     */
    private _handleAtomics;
    /**
     * Modify a value of the cached version of this document
     * @param {string} path
     * @param {*} val
     * @private
     */
    private _modifyCache;
    /**
     * Ensure the model has a cache Map initialized
     * @private
     */
    private _ensureCache;
    /**
     * Actually set a document in Model._cache
     * @param {boolean} force Overwrite existing document
     * @returns {boolean}
     * @private
     */
    private _setCache;
    /**
     * A boolean indicating if a possibly outdated version exists in cache
     * @returns {boolean}
     * @private
     */
    private get _existsInCache();
    /**
     * The cached version of this document
     * @returns {DocumentSQL | undefined}
     * @private
     */
    private get _cache();
    /**
     * Serialize a value for SQL storage
     * @param {*} value
     * @returns {*}
     * @private
     */
    private _serializeValue;
}
import QuerySQL = require("./QuerySQL");
//# sourceMappingURL=DocumentSQL.d.ts.map