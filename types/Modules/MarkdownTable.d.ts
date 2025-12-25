export = MarkdownTable;
declare class MarkdownTable {
    constructor(array: any);
    table: any;
    delimiter: string;
    start: string;
    end: string;
    cellCount: number;
    rowIndex: number;
    MIN_CELL_SIZE: number;
    rowLength: any;
    sizes: any[];
    align: any;
    rule: any[];
    rows: any[];
    row: any;
    cells: any;
    index: number;
    position: any;
    size: number;
    value: any;
    spacing: any;
    before: any;
    after: any;
    alignment: string;
    makeTable(): string;
    dotindex(value: any): any;
    pad(length: any, char: any): string;
    stringify(value: any): string;
    getStringLength(s: any): number;
}
//# sourceMappingURL=MarkdownTable.d.ts.map