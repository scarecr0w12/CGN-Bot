export = QuerySQL;
declare class QuerySQL {
    /**
     * An object with methods to interact with a Document
     * @constructor
     * @param {DocumentSQL} doc The Document this Query object interacts with
     * @param {string} path Initial path
     */
    constructor(doc: DocumentSQL, path: string);
    /**
     * The Document this Query object interacts with
     * @type {DocumentSQL}
     * @private
     */
    private _doc;
    /**
     * The mpath string pointing to the current selected object
     * @type {string}
     */
    parsed: string;
    /**
     * The current value being interacted with
     * @type {Document.Object|Object}
     */
    _current: Document.Object | any;
    _definition: any;
    /**
     * Change the current selection to a property of said selected value
     * @param {string} path The path of the property to select
     * @returns {QuerySQL}
     */
    prop(path: string): QuerySQL;
    /**
     * Get a (nested) property from the current selection using an mpath string
     * @param {string} key The mpath string pointing to the current value
     * @param {object|array} [data] An Object or Array mapping variable labels to strings or ID's
     * @returns {*}
     */
    get(key: string, data?: object | any[]): any;
    /**
     * Selects a subdocument of the current array or map by _id
     * @param {string} path
     * @param {string} id The _id value of the subdocument to select
     * @returns {QuerySQL}
     */
    id(path: string, id: string): QuerySQL;
    /**
     * Set the value of a path
     * @param {string} path
     * @param {*} value
     * @returns {QuerySQL}
     */
    set(path: string, value: any): QuerySQL;
    /**
     * Gets a subdocument of the currently selected array by _id
     * @param {string} id The _id value of the subdocument to get
     * @returns {*}
     */
    getById(id: string): any;
    /**
     * Pushes a value to the currently selected array or map
     * @param {string|*} path The path of the array to be pushed to, or the value
     * @param {*} value The value to be pushed
     * @returns {QuerySQL}
     */
    push(path: string | any, value: any): QuerySQL;
    /**
     * Pulls a value from an array or map
     * @param {string} path
     * @param {string|number|object} idOrObject
     * @returns {QuerySQL}
     */
    pull(path: string, idOrObject: string | number | object): QuerySQL;
    /**
     * Removes a value from the document
     * @param {string} [path]
     * @returns {QuerySQL}
     */
    remove(path?: string): QuerySQL;
    /**
     * Increments the value at the given path by a given amount
     * @param {string|number} path
     * @param {number} [amount]
     * @returns {QuerySQL}
     */
    inc(path: string | number, amount?: number): QuerySQL;
    get clone(): import("./QuerySQL");
    /**
     * The current raw value this Query has selected
     * @returns {*}
     * @readonly
     */
    readonly get val(): any;
    /**
     * Parse a mpath piece to be suffixed to the current mpath
     * @param {string} str The piece to be parsed
     * @param {string} [obj=QuerySQL.parsed] The mpath root
     * @returns {string}
     * @private
     */
    private _parseForString;
    /**
     * Check if the current value or obj can be used to find a subdocument by ID
     * @param {object} [obj=QuerySQL._current] The object to be checked
     * @returns {boolean}
     * @private
     */
    private _canId;
    /**
     * Internal function to find an array value by its _id property
     * @param {string} id The ID to test the array values against
     * @param {object} [obj=QuerySQL._current] The array
     * @returns {*}
     * @private
     */
    private _findById;
    /**
     * Internal function to write a value to a specified path
     * @param {string} path The mpath string of the value to be set
     * @param {*} val The value to be set
     * @private
     */
    private _writeValue;
    /**
     * Internal function to push a value to an array at the specified path
     * @param {string} path The mpath string
     * @param {*} val The value to push
     * @private
     */
    private _push;
    /**
     * Internal function to pull a value with a specified ID from an array
     * @param {string} path The mpath string
     * @param {string} id The ID of the value to pull
     * @private
     */
    private _pull;
    _pullAll(path: any, value: any): void;
    /**
     * Internal function to remove a value from an object
     * @param {string} path
     * @private
     */
    private _unset;
    /**
     * Internal function to increment a value at the specified path
     * @param {string} path
     * @param {number} amount
     * @private
     */
    private _inc;
    /**
     * Shift the currently selected Definition to the desired path
     * @param {string} paths The mpath
     * @param {boolean} absolute If true, paths apply from root schema
     * @param {boolean} mutate If true, the current definition will be shifted
     * @returns {Definition|null}
     * @private
     */
    private _shiftSchema;
    /**
     * Validates a value against a given definition
     * @param {Definition} definition
     * @param {string} path
     * @param {*} value
     * @param {boolean} [absolute=true]
     * @returns {null}
     * @private
     */
    private _validate;
}
//# sourceMappingURL=QuerySQL.d.ts.map