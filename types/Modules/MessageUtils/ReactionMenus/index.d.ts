export let ReactionBasedMenu: {
    new (originalMsg: any, embedTemplate?: {}, { options, results }?: {}): import("./ReactionBasedMenu");
    EventEmitter: typeof import("node:events");
    addAbortListener(signal: AbortSignal, resource: (event: Event) => void): Disposable;
    getEventListeners(emitter: import("node:events"), name: string | symbol): ((...args: any[]) => void)[];
    getEventListeners(emitter: EventTarget, name: string): ((...args: any[]) => void)[];
    getMaxListeners(emitter: import("node:events") | EventTarget): number;
    listenerCount(emitter: import("node:events"), eventName: string | symbol): number;
    on(emitter: import("node:events"), eventName: string | symbol, options?: import("node:events").OnOptions): NodeJS.AsyncIterator<any[]>;
    on(emitter: EventTarget, eventName: string, options?: import("node:events").OnOptions): NodeJS.AsyncIterator<any[]>;
    once(emitter: import("node:events"), eventName: string | symbol, options?: import("node:events").OnceOptions): Promise<any[]>;
    once(emitter: EventTarget, eventName: string, options?: import("node:events").OnceOptions): Promise<any[]>;
    setMaxListeners(n: number, ...eventTargets: ReadonlyArray<import("node:events") | EventTarget>): void;
    readonly captureRejectionSymbol: typeof import("node:events").captureRejectionSymbol;
    captureRejections: boolean;
    defaultMaxListeners: number;
    readonly errorMonitor: typeof import("node:events").errorMonitor;
    EventEmitterAsyncResource: typeof import("node:events").EventEmitterAsyncResource;
};
//# sourceMappingURL=index.d.ts.map