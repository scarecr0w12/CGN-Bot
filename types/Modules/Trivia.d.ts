export = Trivia;
declare class Trivia {
    static start(client: any, svr: any, serverDocument: any, member: any, ch: any, channelDocument: any, set: any, msg: any): Promise<void>;
    static next(client: any, svr: any, serverDocument: any, ch: any, channelDocument: any, msg: any): Promise<void>;
    static question(set: any, channelDocument: any, triviaQueryDocument: any): any;
    static answer(client: any, svr: any, serverDocument: any, usr: any, ch: any, channelDocument: any, response: any, msg: any): Promise<void>;
    static check(correct: any, response: any): Promise<boolean>;
    static end(client: any, svr: any, serverDocument: any, ch: any, channelDocument: any, msg: any): Promise<void>;
}
//# sourceMappingURL=Trivia.d.ts.map