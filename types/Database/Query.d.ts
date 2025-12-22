export = Query;
declare class Query {
    /**
     * An object with methods to interact with a Document
     * @constructor
     * @param {Document} doc The Document this Query object interacts with
     */
    constructor(doc: Document, path: any);
    /**
     * The Document this Query object interacts with
     * @type {Document}
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
     * @returns {module.Query}
     */
    prop(path: string): any;
    /**
     * Get a (nested) property from the current selection using an mpath string
     * @param {string} key The mpath string pointing to the current value, using template variable labels in the form of "$label"
     * @param {object|array} [data] An Object or Array mapping variable labels to strings or ID's. All strings are ran through Query._findById first to check for ID matches.
     * @returns {*}
     */
    get(key: string, data?: object | any[]): any;
    /**
     * Selects a subdocument of the current array or map by _id
     * @param {string} path
     * @param {string} id The _id value of the subdocument to select
     * @returns {module.Query}
     */
    id(path: string, id: string): any;
    /**
     * Set the value of a path
     * @param {string} path
     * @param {*} value
     * @returns {module.Query}
     */
    set(path: string, value: any): any;
    /**
     * Gets a subdocument of the currently selected array by _id
     * @param {string} id The _id value of the subdocument to get
     * @returns {*}
     */
    getById(id: string): any;
    /**
     * Pushes a value to the currently selected array or map
     * @param {string|*} path The path of the array to be pushed to, or the value if the selected array should be used
     * @param {*} value The value to be pushed to the currently selected array or map
     * @returns {module.Query}
     */
    push(path: string | any, value: any): any;
    /**
     * Pulls a value from an array or map
     * @param {string} path
     * @param {string|number|object} idOrObject
     * @returns {module.Query}
     */
    pull(path: string, idOrObject: string | number | object): any;
    /**
     * Removes a value from the document
     * @param {string} [path]
     * @returns {module.Query}
     */
    remove(path?: string): any;
    /**
     * Increments the value at the given path by a given amount
     * @param {string|number} path
     * @param {number} [amount]
     * @returns {module.Query}
     */
    inc(path: string | number, amount?: number): any;
    get clone(): import("./Query");
    /**
     * The current raw value this Query has selected
     * @returns {*}
     * @readonly
     */
    readonly get val(): any;
    /**
     * Parse a mpath piece to be suffixed to the current mpath
     * @param {string} str The piece to be parsed
     * @param {string} [obj=module.Query.parsed] The mpath root the piece is to be suffixed onto
     * @returns {string}
     * @private
     */
    private _parseForString;
    /**
     * Check if the current value or obj can be used to find a subdocument by ID
     * @param {object} [obj=model.Query._current] The object to be checked
     * @returns {boolean}
     * @private
     */
    private _canId;
    /**
     * Internal function to find an array value by its _id property, returns null if value is not found
     * @param {string} id The ID to test the array values against
     * @param {object} [obj=model.Query._current] The array that holds the value to be found
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
     * @param {string} path The mpath string of the array the value is to be pushed to
     * @param {*} val The value to push to the array
     * @private
     */
    private _push;
    /**
     * Internal function to pull a value with a specified ID from an array at the specified path
     * @param {string} path The mpath string of the array to pull the value from
     * @param {string} id The ID of the value to pull from the array
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
     * @param {string} paths The mpath of the to-be selected Definition
     * @param {boolean} absolute If set to true, the paths will be applied from the root schema
     * @param {boolean} mutate If set to true, the current definition will be shifted
     * @returns {Definition|null}
     * @private
     */
    private _shiftSchema;
    /**
     * Validates a value against a given definition, prepares the ValidationError (if created) to be thrown, returns null otherwise
     * @param {Definition} definition
     * @param {string} path
     * @param {*} value
     * @param {boolean} [absolute=true]
     * @returns {null}
     * @private
     */
    private _validate;
}
//# sourceMappingURL=Query.d.ts.map