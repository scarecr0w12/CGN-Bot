/**
 * Logger class type definitions
 * Manual definition to avoid TypeScript serialization errors
 */

export default class Logger {
	constructor(name: string);
	debug(message: string, meta?: object, error?: Error): void;
	info(message: string, meta?: object, error?: Error): void;
	warn(message: string, meta?: object, error?: Error): void;
	error(message: string, meta?: object, error?: Error): void;
	verbose(message: string, meta?: object, error?: Error): void;
}
