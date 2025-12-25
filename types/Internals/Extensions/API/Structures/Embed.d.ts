export = Embed;
declare class Embed {
    constructor(data?: {});
    /**
        * The title of this embed
        * @type {?String}
        */
    title: string | null;
    /**
        * The description of this embed
        * @type {?String}
        */
    description: string | null;
    /**
        * The URL of this embed
        * @type {?String}
        */
    url: string | null;
    /**
        * The color of the embed
        * @type {?Number}
        */
    color: number | null;
    /**
        * The timestamp of this embed
        * @type {?Number}
        */
    timestamp: number | null;
    /**
        * The fields of this embed
        * @type {Object[]}
        * @property {String} name The name of this field
        * @property {String} value The value of this field
        * @property {Boolean} inline If this field will be displayed inline
        */
    fields: any[];
    /**
        * The thumbnail of this embed (if there is one)
        * @type {?Object}
        * @property {String} url URL for this thumbnail
        * @property {String} proxyURL ProxyURL for this thumbnail
        * @property {Number} height Height of this thumbnail
        * @property {Number} width Width of this thumbnail
        */
    thumbnail: any | null;
    /**
        * The image of this embed, if there is one
        * @type {?Object}
        * @property {String} url URL for this image
        * @property {String} proxyURL ProxyURL for this image
        * @property {Number} height Height of this image
        * @property {Number} width Width of this image
        */
    image: any | null;
    /**
        * The author of this embed (if there is one)
        * @type {?Object}
        * @property {String} name The name of this author
        * @property {String} url URL of this author
        * @property {String} iconURL URL of the icon for this author
        * @property {String} proxyIconURL Proxied URL of the icon for this author
        */
    author: any | null;
    /**
        * The footer of this embed
        * @type {?Object}
        * @property {String} text The text of this footer
        * @property {String} iconURL URL of the icon for this footer
        * @property {String} proxyIconURL Proxied URL of the icon for this footer
        */
    footer: any | null;
    /**
   * The date this embed was created
   * @type {?Date}
   * @readonly
   */
    readonly get createdAt(): Date | null;
    /**
   * The hexadecimal version of the embed color, with a leading hash
   * @type {String}
   * @readonly
   */
    readonly get hexColor(): string;
    /**
   * Adds a field to the embed (max 25).
   * @param {String} name The name of the field
   * @param {String} value The value of the field
   * @param {Boolean} [inline=false] Set the field to display inline
   * @returns {Embed}
   */
    addField(name: string, value: string, inline?: boolean): Embed;
    /**
   * Convenience function for `<Embed>.addField('\u200B', '\u200B', inline)`.
   * @param {Boolean} [inline=false] Set the field to display inline
   * @returns {Embed}
   */
    addBlankField(inline?: boolean): Embed;
    /**
   * Sets the file to upload alongside the embed. This file can be accessed via `attachment://fileName.extension` when
   * setting an embed image or author/footer icons. Only one file may be attached.
   * @param {Array<FileOptions>} files Files to attach
   * @returns {Embed}
   */
    attachFiles(files: Array<FileOptions>): Embed;
    files: any;
    /**
   * Sets the author of this embed.
   * @param {StringResolvable} name The name of the author
   * @param {String} [iconURL] The icon URL of the author
   * @param {String} [url] The URL of the author
   * @returns {Embed}
   */
    setAuthor(name: StringResolvable, iconURL?: string, url?: string): Embed;
    /**
   * Sets the color of this embed.
   * @param {ColorResolvable} color The color of the embed
   * @returns {Embed}
   */
    setColor(color: ColorResolvable): Embed;
    /**
   * Sets the description of this embed.
   * @param {StringResolvable} description The description
   * @returns {Embed}
   */
    setDescription(description: StringResolvable): Embed;
    /**
   * Sets the footer of this embed.
   * @param {StringResolvable} text The text of the footer
   * @param {String} [iconURL] The icon URL of the footer
   * @returns {Embed}
   */
    setFooter(text: StringResolvable, iconURL?: string): Embed;
    /**
   * Set the image of this embed.
   * @param {String} url The URL of the image
   * @returns {Embed}
   */
    setImage(url: string): Embed;
    /**
   * Set the thumbnail of this embed.
   * @param {String} url The URL of the thumbnail
   * @returns {Embed}
   */
    setThumbnail(url: string): Embed;
    /**
   * Sets the timestamp of this embed.
   * @param {Date} [timestamp=current date] The timestamp
   * @returns {Embed}
   */
    setTimestamp(timestamp?: Date): Embed;
    /**
   * Sets the title of this embed.
   * @param {StringResolvable} title The title
   * @returns {Embed}
   */
    setTitle(title: StringResolvable): Embed;
    /**
   * Sets the URL of this embed.
   * @param {String} url The URL
   * @returns {Embed}
   */
    setURL(url: string): Embed;
    /**
     * Transforms the Embed into an object that will be sent to Discord
     * @private
     * @returns {Object}
     */
    private _apiTransform;
}
//# sourceMappingURL=Embed.d.ts.map