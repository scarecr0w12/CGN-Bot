export let ClearServerStats: (client: any, serverDocument: Document) => Promise<void>;
export let FileExists: (filePath: any) => Promise<boolean>;
export let FilterChecker: (serverDocument: any, channel: any, string: any, isNsfw: any, isCustom: any, nsfwOverride: any) => Promise<boolean>;
export let Gag: (sargs: any) => {
    _: any[];
};
export let GetFlagForRegion: (region: any) => ":x:" | ":flag_nl:" | ":flag_br:" | ":flag_de:" | ":flag_hk:" | ":flag_jp:" | ":flag_gb:" | ":flag_ru:" | ":flag_sg:" | ":flag_au:" | ":flag_eu:" | ":flag_us:" | ":interrobang:";
export let GetValue: (client: any, val: any, merge: any, func: any) => Promise<any>;
export let Gist: {
    new (client: any): import("./GitHubGist.js");
};
export let GlobalDefines: typeof import("./GlobalDefines.js");
export let IsURL: (url: any) => boolean;
export let MessageOfTheDay: (client: any, server: any, motdDocument: any, serverQueryDocument: any) => Promise<void>;
export let ObjectDefines: (client: any) => void;
export function PromiseWait(waitFor: any): Promise<any>;
export function RankScoreCalculator(messages: any, voice: any): any;
export let RegExpMaker: {
    new (array: any): import("./RegExpMaker.js");
};
export let RemoveFormatting: (str: any) => any;
export let RSS: (url: string, num: number) => any[] | null;
export let Slug: typeof import("./Slug.js");
export let SearchiTunes: (params: any) => Promise<any>;
export let SetCountdown: (client: any, serverDocument: Document, countdownDocument: Document) => Promise<void>;
export let SetReminder: (client: any, userDocument: Document, reminderDocument: Document) => Promise<void>;
export let Stopwatch: {
    new (): import("./Stopwatch");
};
export let StreamChecker: (client: any, server: any, serverDocument: any, streamerDocument: any) => Promise<void>;
export let StreamerUtils: (type: any, username: any) => Promise<{
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
export let StreamingRSS: (client: any, server: Guild, serverDocument: any, feedDocument: any) => Promise<void>;
export let StructureExtender: () => void;
export let TitlecasePermissions: (str: any) => any;
//# sourceMappingURL=index.d.ts.map