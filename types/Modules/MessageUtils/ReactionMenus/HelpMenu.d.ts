export = exports;
declare class exports extends BaseMenu {
    constructor(originalMsg: any, defaultPage?: {}, { options, pages, withExtensions }?: {
        options?: any[];
        pages?: {};
        withExtensions?: boolean;
    });
    pages: {};
    defaultPage: {};
    init(time: any): Promise<void>;
    sendInitialMessage(): Promise<void>;
    _handleInput(reaction: any): Promise<void>;
    _infoPage(reaction: any): Promise<void>;
    _handleEnd(): Promise<void>;
}
import BaseMenu = require("./BaseMenu");
//# sourceMappingURL=HelpMenu.d.ts.map