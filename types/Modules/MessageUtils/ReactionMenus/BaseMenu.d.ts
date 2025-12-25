export = BaseReactionMenu;
declare class BaseReactionMenu extends EventEmitter<any> {
    constructor(originalMsg: any, allowedEmojis: any, embedTemplate?: {}, { options, results }?: {});
    originalMsg: any;
    allowedEmojis: any;
    template: {};
    currentPage: number;
    totalPages: number;
    add1: boolean;
    options: any;
    results: any;
    init(time?: number, emitOnly?: boolean): Promise<void>;
    emitOnly: boolean;
    collector: any;
    sendInitialMessage(): Promise<any>;
    msg: any;
    get _currentOptions(): any;
    prepareReactions(): Promise<void>;
    handle(): Promise<void>;
    _handleEnd(_: any, reason: any): Promise<void>;
    _changePage(): Promise<void>;
    removeUserReaction(reaction: any, user?: any): Promise<void>;
    _updateChoice(choice: any): Promise<void>;
}
import { EventEmitter } from "node:events";
//# sourceMappingURL=BaseMenu.d.ts.map