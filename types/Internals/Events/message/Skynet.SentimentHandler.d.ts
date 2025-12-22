export = SentimentHandler;
declare class SentimentHandler extends BaseEvent {
    constructor(client: any);
    analyzer: SentimentAnalyzer;
    requirements(msg: any): boolean;
    handle(msg: any): Promise<void>;
    /**
     * Check if user should face escalated action due to repeat violations
     * @private
     */
    private _checkEscalation;
    /**
     * Escalate action to next severity level
     * @private
     */
    private _escalateAction;
    /**
     * Log violation to configured channel
     * @private
     */
    private _logViolation;
    /**
     * Warn user about their message
     * @private
     */
    private _warnUser;
}
import BaseEvent = require("../BaseEvent");
import SentimentAnalyzer = require("../../../Modules/SentimentAnalyzer");
//# sourceMappingURL=Skynet.SentimentHandler.d.ts.map