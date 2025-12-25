export function initialize(): Promise<any>;
export function get(): any;
export function getConnection(): any;
export function getPoolConnection(): Promise<Connection>;
export function query(sql: string, params?: any[]): Promise<any[]>;
export function transaction(callback: Function): Promise<any>;
export function close(): Promise<void>;
//# sourceMappingURL=DriverSQL.d.ts.map