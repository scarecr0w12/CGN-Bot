export = BaseEvent;
declare class BaseEvent {
    /**
     * Base class for all events.
     * @param {Client} client
     * @param {Object} configJS
     */
    constructor(client: Client, configJS: any);
    client: Client;
    configJS: any;
    configJSON: any;
    /**
     * Public handler for events
     * @param {?Object} [values] The values that the event emitted
     */
    handle(): Promise<void>;
    /**
     * Call this function to handle events if the requirement is set
     * @param {?*[]} [args] Params to hand over to the requirement check, the prerequisite, and to the event
     * @private
     */
    private _handle;
    /**
     * Simple logic for checking if the event should run or not.
     * @param {?Object} [values] The values object that the event emitted
     * @returns {Boolean}
     */
    requirements(): boolean;
    /**
     * Simple function that prepares everything that the event may need (like documents)
     */
    prerequisite(): Promise<void>;
}
//# sourceMappingURL=BaseEvent.d.ts.map