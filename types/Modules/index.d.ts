export let SkynetClient: typeof import("./SkynetClient.js");
export let ConfigManager: typeof import("./ConfigManager.js");
export let ConversionHandler: typeof import("./ConversionHandler.js");
export let CreatorManager: typeof import("./CreatorManager.js");
export let EmailService: typeof import("./EmailService.js");
export let Encryption: {
    new (client: any): import("./Encryption");
};
export let ExtensionRunner: (bot: any, server: any, serverDocument: any, channel: any, extensionDocument: any, msg: any, suffix: any, keywordMatch: any) => Promise<void>;
export let getGuild: {
    GetGuild: {
        new (client: any, target: any): {
            client: any;
            target: any;
            _fetchedCollections: any[];
            _send(settings: any): any;
            initialize(members: any, mutualOnlyTo: any): Promise</*elided*/ any>;
            success: boolean;
            fetchProperty(properties: any): Promise</*elided*/ any>;
            reSync(): Promise</*elided*/ any>;
            fetchCollection(collections: any): Promise</*elided*/ any>;
            fetchMember(members: any, isQuery: any): Promise<any>;
        };
        getAll(client: any, settings: any): any;
    };
    handler: (guild: Discord.Guild, settings: GetGuildSettings, respond: Function) => any;
};
export let Giphy: (query: string, nsfw?: string | null) => Promise<any>;
export let Giveaways: {
    new (): import("./Giveaways.js");
    start(client: any, server: any, serverDocument: any, user: any, channel: any, channelDocument: any, title: any, secret: any, duration: any): Promise<void>;
    end(client: any, server: any, channel: any, serverDocument: any): Promise<any>;
    endTimedGiveaway(client: any, server: any, channel: any, timer: any): Promise<void>;
};
export let Imgur: {
    new (clientID: any): import("./Imgur");
};
export let Lotteries: {
    multipliers: {
        small: number;
        standard: number;
        big: number;
        huge: number;
        massive: number;
    };
    start: (client: any, svr: any, serverDocument: any, usr: any, ch: any, channelDocument: any, multiplier: any) => void;
    end: (client: any, svr: any, serverDocument: any, ch: any, channelDocument: any) => Promise<any>;
};
export let MarkdownTable: typeof import("./MarkdownTable.js");
export let MessageUtils: {
    ArgumentParser: {
        new (): import("./MessageUtils/Parser.js");
        parseQuoteArgs(content: string, delim?: string): string[];
    };
    DurationParser: (string: any) => Promise<{
        time: number;
        event: any;
        error?: undefined;
    } | {
        time: any;
        event: any;
        error: string;
    }>;
    PaginatedEmbed: typeof import("./MessageUtils/PaginatedEmbed.js");
    ReminderParser: (client: any, userDocument: any, userQueryDocument: any, str: any) => Promise<number | "ERR">;
};
export let MicrosoftTranslate: import("mstranslator");
export let ModLog: typeof import("./ModLog.js");
export let NewServer: (client: any, server: any, serverDocument: any, templateId?: any) => Promise<any>;
export let ServerTemplates: typeof import("./ServerTemplates.js");
export let Polls: {
    start: (client: any, svr: any, serverDocument: any, usr: any, ch: any, channelDocument: any, title: any, options: any) => Promise<void>;
    getResults: (pollDocument: any) => Promise<{
        votes: {};
        winner: undefined;
    }>;
    end: (serverDocument: any, ch: any, channelDocument: any) => Promise<void>;
};
export let PostShardedData: (client: any) => Promise<void>;
export let PostTotalData: (client: any) => Promise<void>;
export let RandomAnimals: {
    new (): import("./RandomAnimals.js");
    cat(): Promise<any>;
    dog(): any;
};
export let StringJS: (s: any) => {
    s: any;
    original: any;
    get length(): any;
    between(left: any, right: any): /*elided*/ any;
    camelize(): /*elided*/ any;
    capitalize(): /*elided*/ any;
    charAt(index: any): any;
    chompLeft(prefix: any): /*elided*/ any;
    chompRight(suffix: any): /*elided*/ any;
    collapseWhitespace(): /*elided*/ any;
    contains(s: any): boolean;
    count(s: any): number;
    dasherize(): /*elided*/ any;
    equalsIgnoredCase(string: any): boolean;
    endsWith(...args: any[]): boolean;
    escapeHTML(): /*elided*/ any;
    ensureLeft(prefix: any): /*elided*/ any;
    ensureRight(suffix: any): /*elided*/ any;
    humanize(): /*elided*/ any;
    isAlpha(): boolean;
    isAlphaNumeric(): boolean;
    isEmpty(): boolean;
    isLower(): boolean;
    isNumeric(): boolean;
    isUpper(): boolean;
    left(N: any): any;
    lines(): any;
    replaceAll(string: any, replace: any): /*elided*/ any;
    strip(...args: any[]): /*elided*/ any;
    startsWith(...args: any[]): boolean;
    stripPunctuation(): /*elided*/ any;
    times(n: any): /*elided*/ any;
    titleCase(): /*elided*/ any;
    toBoolean(): boolean;
    toFloat(precision: any): number;
    toInt(): number;
    trim(): /*elided*/ any;
    trimLeft(): /*elided*/ any;
    trimRight(): /*elided*/ any;
    toString(): any;
    underscore(): /*elided*/ any;
    valueOf(): any;
};
export let Temp: typeof import("./Temp");
export let TicketManager: typeof import("./TicketManager.js");
export let ServerTicketManager: typeof import("./ServerTicketManager.js");
export let TempRoleManager: typeof import("./TempRoleManager.js");
export let TierManager: typeof import("./TierManager.js");
export let TokenEncryption: typeof import("./TokenEncryption.js");
export let Traffic: typeof import("./Traffic.js");
export let Trivia: {
    new (): import("./Trivia.js");
    start(client: any, svr: any, serverDocument: any, member: any, ch: any, channelDocument: any, set: any, msg: any): Promise<void>;
    next(client: any, svr: any, serverDocument: any, ch: any, channelDocument: any, msg: any): Promise<void>;
    question(set: any, channelDocument: any, triviaQueryDocument: any): any;
    answer(client: any, svr: any, serverDocument: any, usr: any, ch: any, channelDocument: any, response: any, msg: any): Promise<void>;
    check(correct: any, response: any): Promise<boolean>;
    end(client: any, svr: any, serverDocument: any, ch: any, channelDocument: any, msg: any): Promise<void>;
};
export let Utils: {
    ClearServerStats: (client: any, serverDocument: Document) => Promise<void>;
    FileExists: (filePath: any) => Promise<boolean>;
    FilterChecker: (serverDocument: any, channel: any, string: any, isNsfw: any, isCustom: any, nsfwOverride: any) => Promise<boolean>;
    Gag: (sargs: any) => {
        _: any[];
    };
    GetFlagForRegion: (region: any) => ":x:" | ":flag_nl:" | ":flag_br:" | ":flag_de:" | ":flag_hk:" | ":flag_jp:" | ":flag_gb:" | ":flag_ru:" | ":flag_sg:" | ":flag_au:" | ":flag_eu:" | ":flag_us:" | ":interrobang:";
    GetValue: (client: any, val: any, merge: any, func: any) => Promise<any>;
    Gist: {
        new (client: any): import("./Utils/GitHubGist.js");
    };
    GlobalDefines: typeof import("./Utils/GlobalDefines.js");
    IsURL: (url: any) => boolean;
    MessageOfTheDay: (client: any, server: any, motdDocument: any, serverQueryDocument: any) => Promise<void>;
    ObjectDefines: (client: any) => void;
    PromiseWait: (waitFor: any) => Promise<any>;
    RankScoreCalculator: (messages: any, voice: any) => any;
    RegExpMaker: {
        new (array: any): import("./Utils/RegExpMaker.js");
    };
    RemoveFormatting: (str: any) => any;
    RSS: (url: string, num: number) => any[] | null;
    Slug: typeof import("./Utils/Slug.js");
    SearchiTunes: (params: any) => Promise<any>;
    SetCountdown: (client: any, serverDocument: Document, countdownDocument: Document) => Promise<void>;
    SetReminder: (client: any, userDocument: Document, reminderDocument: Document) => Promise<void>;
    Stopwatch: {
        new (): import("./Utils/Stopwatch.js");
    };
    StreamChecker: (client: any, server: any, serverDocument: any, streamerDocument: any) => Promise<void>;
    StreamerUtils: (type: any, username: any) => Promise<{
        name: any;
        type: string;
        game: any;
        url: any;
        streamerImage: any;
        preview: any;
    } | {
        name: any;
        type: string;
        game: any;
        url: string;
        preview: any;
    }>;
    StreamingRSS: (client: any, server: Guild, serverDocument: any, feedDocument: any) => Promise<void>;
    StructureExtender: () => void;
    TitlecasePermissions: (str: any) => any;
};
export let PremiumExtensionsManager: typeof import("./PremiumExtensionsManager.js");
export let VoiceStatsCollector: {
    startTiming: (serverDocument: any, member: any) => Promise<void>;
    stopTiming: (client: any, guild: any, serverDocument: any, member: any) => Promise<void>;
};
export let Voicetext: {
    addMember: (guild: any, voiceChannel: any, member: any) => Promise<void>;
    removeMember: (guild: any, voiceChannel: any, member: any) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map