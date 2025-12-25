export = Schema;
/** A Schema that defines the structure of a collection's Documents */
declare class Schema {
    static Mixed(): {};
    static Map(schema: any): {
        schema: Schema;
    };
    /**
     * Create a new Schema
     * @param {Object} schema The user-defined schema to construct
     * @param {Object} options A set of user-defined options that modify the behavior of the Schema
     * @constructor
     */
    constructor(schema: any, options?: any);
    _schema: any;
    _options: any;
    _parent: any;
    _definitions: Map<any, any>;
    build(raw?: {}): any;
    validate(obj: {}, doc: any): ValidationError;
    validateDoc(doc: any): ValidationError;
    /**
     * The default raw data of this Schema if no overwrites are given
     * @returns {Object}
     * @private
     */
    private get _defaultDocument();
}
declare namespace Schema {
    export { ValidationError, Type, ValidationErrorObject };
}
/**
 * A error for a ValidationError
 * @typedef {{ type: string, value: *, path: string, definition: Definition }} ValidationErrorObject
 */
declare class ValidationError extends Error {
    constructor(errors: any, document: any);
    errors: {
        validator: any;
        path: any;
        value: any;
        message: string;
    }[];
    document: any;
}
/**
 * A Definition Type
 */
type Type = {
    key: string;
    validator: (arg0: any) => any;
} | ((arg0: Schema) => any);
/**
 * A error for a ValidationError
 */
type ValidationErrorObject = {
    type: string;
    value: any;
    path: string;
    definition: Definition;
};
/** Represents a parsed definition in a Schema */
declare class Definition {
    /**
     * Create a new Definition
     * @param {Object} raw A user-defined definition for a Document value
     * @param {string} [raw.type] A string documenting the type of this Document value
     * @param {*} [raw.default] The value that should be assigned to this key on the Document if none was given on Document creation. This value is prioritized over raw.required, and if supplied, the Definition will never be required
     * @param {boolean} [raw.required] A boolean indicating if this value should be required on Document creation
     * @param {string} key The key this value is assigned to in the Document
     * @constructor
     */
    constructor(raw: {
        type?: string;
        default?: any;
        required?: boolean;
    }, key: string, schema: any);
    /**
     * A reference to the original user-defined definition
     * @type {{type?: string, default?: *, required?: boolean}|string}
     * @private
     */
    private _raw;
    _schema: any;
    /**
     * The key this value is assigned to in the Document
     * @type {string}
     */
    key: string;
    /**
     * The parsed Type of this Definition
     * @type {Type|null}
     */
    type: Type | null;
    /**
     * The default value or function to use when none was given
     * @type {*}
     * @private
     */
    private _default;
    /**
     * A boolean indicating if the value is required or not
     * @type {boolean}
     * @private
     */
    private _required;
    /**
     * The absolute value this definition should always have. Only works on object types
     * @type {*}
     * @private
     */
    private _value;
    /**
     * If this definition describes an array of values, this will be true
     * @type {Boolean}
     */
    isArray: boolean;
    /**
     * If this definition describes an object of values, mapped by _id, this will be true
     * @type {boolean}
     */
    isMap: boolean;
    /**
     * An array of validation functions to pass before the value is set
     * @type {Array}
     * @private
     */
    private _validations;
    /**
     * A boolean indicating if this Definition is invalid or not. Invalid Definitions should be ignored or raise an error
     * @type {boolean}
     */
    invalid: boolean;
    get default(): any;
    get required(): boolean;
    /**
     * Validate a value against this definition's requirements
     * @param {*} value The value to be validated
     * @param {Boolean|null} absolute If set to true, validation will enforce arrays
     * @returns {ValidationErrorObject|null}
     */
    validate(value: any, absolute: boolean | null): ValidationErrorObject | null;
    cast(value: any): any;
    _parseValidations(schema: any): void;
}
//# sourceMappingURL=Schema.d.ts.map