export = ConversionHandler;
declare class ConversionHandler {
    constructor(client: any);
    client: any;
    canConvertMoney: boolean;
    moneyTimer: any;
    lastUpdated: any;
    init(): Promise<void>;
    initTimer(): void;
    destroy(): void;
    convert({ from, to, content }?: {}): Promise<{
        error: any;
        result: any;
        type: any;
    }>;
}
//# sourceMappingURL=ConversionHandler.d.ts.map