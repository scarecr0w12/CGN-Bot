export let Client: {
    new (bot: GABClient, server: Discord.Guild, serverDocument: Document, extensionDocument: any, scopes: any): import("./Modules/Client");
};
export let Extension: {
    new (extensionDocument: any, serverDocument: Document): import("./Modules/Extension");
};
export let Utils: {
    new (): import("./Modules/Utils");
    getSerializableFunctions(): any;
};
export let Message: typeof import("./Structures/Message");
export let User: typeof import("./Structures/User");
export let Guild: typeof import("./Structures/Guild");
export let Channel: typeof import("./Structures/Channel");
export let Member: typeof import("./Structures/Member");
export let Emoji: {
    new (): import("./Structures/Emoji");
};
export let Embed: {
    new (data?: {}): import("./Structures/Embed");
};
export let ScopeManager: {
    new (): import("./Utils/ScopeManager");
    check(scopes: Array<string>, scope: string): boolean;
    setProtectedValue(object: any, key: string, value: any, scopes: Array<string>, scope: string): void;
};
export let APIUtils: typeof import("./Utils/Utils");
//# sourceMappingURL=index.d.ts.map