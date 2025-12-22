export function setTimeout(listener: any, after: any, key: any, ...args: any[]): Timeout;
export function setInterval(listener: any, after: any, key: any, ...args: any[]): Interval;
export function clearTimeout(timer: any): void;
export function clearInterval(timer: any): void;
import Timeout = require("./Timeout");
import Interval = require("./Interval");
export { Timeout, Interval };
//# sourceMappingURL=index.d.ts.map