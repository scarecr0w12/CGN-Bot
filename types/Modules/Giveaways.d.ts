export = Giveaways;
declare class Giveaways {
    static start(client: any, server: any, serverDocument: any, user: any, channel: any, channelDocument: any, title: any, secret: any, duration: any): Promise<void>;
    static end(client: any, server: any, channel: any, serverDocument: any): Promise<any>;
    static endTimedGiveaway(client: any, server: any, channel: any, timer: any): Promise<void>;
}
//# sourceMappingURL=Giveaways.d.ts.map