export = Base;
declare class Base {
    constructor(listener: any, after: any, key: any, ...args: any[]);
    listener: any;
    after: any;
    unreffed: boolean;
    args: any[];
    /**
     * Maximum value of a timer, minus 1
     * Also known as 2^31 - 1
     * @type {Number}
     */
    MAX: number;
    timeout: any;
    startedAt: number;
    /**
     * Special identifier for this timeout
     */
    specialIdentifier: any;
    unref(): void;
    ref(): void;
    close(): void;
}
//# sourceMappingURL=Base.d.ts.map