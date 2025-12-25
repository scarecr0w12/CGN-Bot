export = EventHandler;
declare class EventHandler {
    constructor(client: any, configJS: any);
    client: any;
    configJS: any;
    configJSON: any;
    _cache: {};
    init(): Promise<void>;
    reloadEvent(eventName: any): void;
    /**
     * Run all event file(s) once an event is triggered
     * @param {string} eventName The event that was emitted
     * @param {*[]} args The arguments of the event, in the order that they were received
     */
    onEvent(eventName: string, ...args: any[]): Promise<any[]>;
}
//# sourceMappingURL=EventHandler.d.ts.map