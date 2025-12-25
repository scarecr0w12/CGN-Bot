export = Stopwatch;
declare class Stopwatch {
    _start: number;
    _end: number;
    get running(): boolean;
    get duration(): number;
    get friendlyDuration(): string;
    toString(): string;
    restart(): this;
    start(): this;
    stop(): this;
}
//# sourceMappingURL=Stopwatch.d.ts.map