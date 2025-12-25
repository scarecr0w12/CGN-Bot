export = Document;
declare class Document {
    /**
     * Create a new document which does not exist in the database or cache
     * @param {object} obj The object containing the new document's data
     * @param {Model} model The Model this Document is created by
     * @returns {module.Document}
     */
    static "new"(obj: object, model: Model): any;
    /**
     * An object representing a Model document from MongoDB
     * @param {object} doc The raw data received from MongoDB
     * @param {Model} model The Model this document was created by
     * @constructor
     */
    constructor(doc: object, model: Model);
    /**
     * A reference to the Model this document was created by
     * @type {Model}
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
     * !ignore
     */
    _client: any;
    /**
     * An internal collection of all the atomic operations to be pushed to MongoDB on save
     * @type {Object}
     * @private
     */
    private _atomics;
    /**
     * The raw data received from MongoDB
     * @type {Object}
     * @private
     */
    private _doc;
    /**
     * Pushes the pending changes of this document to MongoDB
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
     * @param {boolean} update If an existing version of this document in the Model's cache should be overwritten when found
     * @returns {boolean}
     */
    cache(update: boolean): boolean;
    /**
     * A new query object tied to this Document
     * @returns {Query}
     * @readonly
     */
    readonly get query(): Query;
    /**
     * Register new atomic operations to be pushed to MongoDB on save
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
     * Actually set a document in Model._cache, returning false if the document already exists in cache
     * @param {boolean} force A boolean indicating if the existing document in cache should be ignored and overwritten
     * @returns {boolean} A boolean indicating if the document was inserted or not
     * @private
     */
    private _setCache;
    /**
     * A boolean indicating if a possibly outdated version of this document exists in the Model's cache
     * @returns {boolean}
     * @private
     */
    private get _existsInCache();
    /**
     * The cached version of this document
     * @returns {Document | undefined}
     * @private
     */
    private get _cache();
}
import Query = require("./Query");
//# sourceMappingURL=Document.d.ts.map