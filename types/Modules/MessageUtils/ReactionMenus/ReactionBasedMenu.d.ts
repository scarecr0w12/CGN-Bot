export = exports;
declare class exports extends BaseMenu {
    constructor(originalMsg: any, embedTemplate?: {}, { options, results }?: {});
    pageEmojis: {
        back: string;
        stop: string;
        forward: string;
    };
    numberEmojiArray: string[];
    pageEmojiArray: string[];
    _allOptions(): Promise<void>;
    _options(number: any): Promise<void>;
    _handlePageChange(reaction: any): Promise<void>;
    _handleNumberInput(reaction: any): Promise<void>;
}
import BaseMenu = require("./BaseMenu");
//# sourceMappingURL=ReactionBasedMenu.d.ts.map