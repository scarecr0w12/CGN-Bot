export = Utils;
declare class Utils {
    /**
   * Resolves a string or array to a string.
   * @param {String|Array} data The string resolvable to resolve
   * @returns {String}
   */
    static resolveString(data: string | any[]): string;
    /**
   * Can be a Hex Literal, Hex String, Number, RGB Array, or one of the following
   * ```
   * [
   *   'DEFAULT',
   *   'AQUA',
   *   'GREEN',
   *   'BLUE',
   *   'PURPLE',
   *   'GOLD',
   *   'ORANGE',
   *   'RED',
   *   'GREY',
   *   'DARKER_GREY',
   *   'NAVY',
   *   'DARK_AQUA',
   *   'DARK_GREEN',
   *   'DARK_BLUE',
   *   'DARK_PURPLE',
   *   'DARK_GOLD',
   *   'DARK_ORANGE',
   *   'DARK_RED',
   *   'DARK_GREY',
   *   'LIGHT_GREY',
   *   'DARK_NAVY',
   *   'RANDOM',
   * ]
   * ```
   * or something like
   * ```
   * [255, 0, 255]
   * ```
   * for purple
   * @typedef {String|Number|Array} ColorResolvable
   */
    static resolveColor(color: any): any;
    /**
     * Parses the arguments supplied to a message sending or editing function
     * @param {String|Object} content -
     * @param {Object} [embed] -
     * @returns {Object}
     */
    static parseSendMessageOptions(content: string | any, embed?: any): any;
    /**
     * Wraps a Collection of D.js Objects into a Collection of instances of a safe API Class.
     * @param {Discord.Collection} collection - The Collection to be wrapped
     * @param {Function} APIClass - The API Class to wrap the Collection elements in
     * @param {Object} API -
     * @param {ExtensionManager} client -
     * @param {Array<String>} scopes -
     * @returns {Discord.Collection<*>}
     */
    static wrapCollection(collection: Discord.Collection, APIClass: Function, { API, client, scopes }: any): Discord.Collection<any>;
    /**
     * Wraps an Array into an Array of instances of a safe API Class.
     * @param {Array} array - The Array to be wrapped
     * @param {Function} APIClass - The API Class to wrap the Array elements in
     * @param {Object} API -
     * @param {ExtensionManager} client -
     * @param {Array<String>} scopes -
     * @returns {Array<*>}
     */
    static wrapArray(array: any[], APIClass: Function, { API, client, scopes }: any): Array<any>;
    /**
     * Serialize an Error returned from Discord.js for usage within the ECA.
     * @param {Error} err - The error to serialize
     * @throws {SkynetError}
     */
    static serializeError(err: Error): void;
}
declare namespace Utils {
    namespace Colors {
        let DEFAULT: number;
        let AQUA: number;
        let GREEN: number;
        let BLUE: number;
        let PURPLE: number;
        let GOLD: number;
        let ORANGE: number;
        let RED: number;
        let GREY: number;
        let NAVY: number;
        let DARK_AQUA: number;
        let DARK_GREEN: number;
        let DARK_BLUE: number;
        let DARK_PURPLE: number;
        let DARK_GOLD: number;
        let DARK_ORANGE: number;
        let DARK_RED: number;
        let DARK_GREY: number;
        let DARKER_GREY: number;
        let LIGHT_GREY: number;
        let DARK_NAVY: number;
        let BLURPLE: number;
        let GREYPLE: number;
        let DARK_BUT_NOT_BLACK: number;
        let NOT_QUITE_BLACK: number;
    }
}
//# sourceMappingURL=Utils.d.ts.map