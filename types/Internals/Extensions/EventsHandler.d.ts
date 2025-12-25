export = EventsHandler;
/**
 * Class for handling ExtensionManager events
 * @class
 */
declare class EventsHandler {
    /**
     * Construct a new EventsHandler and hook it into the provided ExtensionManager
     * @param {ExtensionManager} manager The ExtensionManager to hook into and listen to for events
     * @param {string[]} events A list of events to listen for
     */
    constructor(manager: ExtensionManager, events: string[]);
    manager: ExtensionManager;
    events: string[];
    defaultHandler(): any;
    _handlerWrapper(func: any): (...args: any[]) => Promise<void>;
}
//# sourceMappingURL=EventsHandler.d.ts.map