export = PaginatedEmbed;
declare class PaginatedEmbed {
    /**
     * After creating a PaginatedEmbed call `#init()` to set it up and start listening for reactions.
     *
     * @param {Message} originalMsg 	The original message that created this paginated embed.
     * 						May be a custom object, the only required fields are `channel` and `author.id`
     * @param embedTemplate A slightly edited embed object that serves as the base template for all pages,
     * 						with strings being formatted via templates
     * @param pageData		All the data used for the different pages of the embed pages,
     * 						with the fields being arrays with values (or null) for every page
     */
    constructor(originalMsg: Message, embedTemplate: any, { contents, authors, titles, colors, urls, descriptions, fields, timestamps, thumbnails, images, footers, pageCount, }?: {
        contents?: any[];
        authors?: any[];
        titles?: any[];
        colors?: any[];
        urls?: any[];
        descriptions?: any[];
        fields?: any[];
        timestamps?: any[];
        thumbnails?: any[];
        images?: any[];
        footers?: any[];
        pageCount?: any;
    });
    originalMsg: Message;
    channel: any;
    authorID: any;
    pageEmojis: {
        back: string;
        stop: string;
        forward: string;
    };
    pageEmojiArray: string[];
    contents: any[];
    authors: any[];
    titles: any[];
    colors: any[];
    urls: any[];
    descriptions: any[];
    fields: any[];
    timestamps: any[];
    thumbnails: any[];
    images: any[];
    footers: any[];
    messageTemplate: any;
    currentPage: number;
    totalPages: any;
    init(timeout: number, editMessage: any): Promise<void>;
    collector: any;
    _prepareReactions(): Promise<void>;
    _startCollector(): Promise<void>;
    _handleStop(): Promise<void>;
    _handlePageChange(reaction: any): Promise<void>;
    _removeUserReaction(reaction: any, user: any): Promise<void>;
    get _currentMessageContent(): {
        content: any;
        embeds: {
            author: {
                name: any;
                icon_url: any;
                url: any;
            };
            title: any;
            color: any;
            url: any;
            description: any;
            fields: any;
            timestamp: any;
            thumbnail: {
                url: any;
            };
            image: {
                url: any;
            };
            footer: {
                text: any;
                icon_url: any;
            };
        }[];
    };
    _sendInitialMessage(editMessage: any): Promise<void>;
    msg: any;
    _updateMessage(): Promise<void>;
    _getFormatOptions(obj: any): any;
}
//# sourceMappingURL=PaginatedEmbed.d.ts.map