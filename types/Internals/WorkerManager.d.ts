export = WorkerManager;
declare class WorkerManager {
    constructor(client: any);
    client: any;
    worker: processAsPromised;
    getValueFromWorker(workerType: any, { data, command }?: {
        command?: any;
    }): Promise<any>;
    sendValueToWorker(workerType: any, data: any): Promise<any>;
    _getMathJSResult(command: any, requestedInfo: any): Promise<any>;
    _jumboEmoji(input: any): Promise<{
        buffer: Buffer<ArrayBuffer>;
        animated: any;
    }>;
    startWorker(): Promise<processAsPromised>;
    safeSend(command: any, d: any): any;
}
import processAsPromised = require("process-as-promised");
//# sourceMappingURL=WorkerManager.d.ts.map