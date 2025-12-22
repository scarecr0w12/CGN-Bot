export = ExtendableBase;
declare class ExtendableBase {
    constructor(appliesTo: any, name: any);
    appliesTo: any;
    name: any;
    target: typeof import("discord.js");
    enabled: boolean;
    extend(): void;
    enable(): this;
    disable(): this;
}
//# sourceMappingURL=ExtendableBase.d.ts.map