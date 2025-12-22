/**
 * TypeScript Usage Examples for CGN-Bot
 * 
 * This file demonstrates how to use the TypeScript definitions
 * for better IDE support and type safety.
 */

// ============================================
// Cache Events Usage
// ============================================

import { cacheEvents, invalidateServerCaches, serverCacheKey } from '../Modules/CacheEvents';
import type { CacheInvalidationData } from '../types';

// Register a cache invalidation handler
cacheEvents.onInvalidate('server:*:config', (key: string, data: CacheInvalidationData) => {
	console.log(`Cache ${key} invalidated because ${data.reason}`);
	// TypeScript knows the structure of 'data'
	if (data.serverId) {
		console.log(`Server ID: ${data.serverId}`);
	}
});

// Invalidate server caches with type safety
invalidateServerCaches('123456789', ['config', 'permissions', 'roles']);

// Create cache keys with autocomplete
const configKey = serverCacheKey('123456789', 'config');

// ============================================
// Command Executor Usage
// ============================================

import CommandExecutor from '../Internals/CommandExecutor';
import type { CommandObject, ValidationResult, ExecutionResult } from '../types';

// Define a command with full type safety
const myCommand: CommandObject = {
	name: 'example',
	permissions: ['ADMINISTRATOR'], // TypeScript validates this
	cooldown: 5,
	guildOnly: true,
	args: [
		{ name: 'user', type: 'string', required: true },
		{ name: 'amount', type: 'number', required: false },
	],
	async execute(context, args) {
		// args is typed based on the command definition
		console.log(`User: ${args.user}, Amount: ${args.amount || 0}`);
	},
};

// Use CommandExecutor with type checking
async function executeCommand(executor: CommandExecutor, message: any) {
	// TypeScript knows the return types
	const permCheck: ValidationResult = executor.validatePermissions(myCommand, message);
	
	if (!permCheck.valid) {
		console.error(permCheck.error);
		return;
	}
	
	// Execute with full type safety
	const result: ExecutionResult = await executor.execute(myCommand, message, [], false);
	
	if (!result.success) {
		console.error(`Execution failed: ${result.error}`);
	}
}

// ============================================
// Command Middleware Usage
// ============================================

import { CommandMiddleware, loggingMiddleware, rateLimitMiddleware } from '../Internals/CommandMiddleware';
import type { MiddlewareFunction } from '../types';

// Create a custom middleware with proper typing
const customMiddleware: MiddlewareFunction = async (context, next) => {
	console.log('Before command execution');
	await next();
	console.log('After command execution');
};

// Set up middleware chain
const middleware = new CommandMiddleware();
middleware.use(loggingMiddleware, 10);
middleware.use(rateLimitMiddleware(5, 10000), 20);
middleware.use(customMiddleware, 30);

// Execute middleware with type safety
async function runMiddleware(context: any) {
	const result = await middleware.execute(context);
	
	if (!result.continue) {
		console.error(`Middleware stopped execution: ${result.error}`);
	}
}

// ============================================
// Database Types Usage
// ============================================

import type { ServerDocument, UserDocument, Model, Document } from '../types';

// Work with typed documents
async function getServerConfig(serverId: string): Promise<ServerDocument | null> {
	const Servers: Model<ServerDocument> = global.Servers;
	const server = await Servers.findOne(serverId);
	
	if (!server) return null;
	
	// TypeScript knows the structure of ServerDocument
	const prefix = server.config.commandPrefix; // Autocomplete works!
	const language = server.config.language;
	
	return server;
}

// Update with type safety
async function updateUserPoints(userId: string, points: number): Promise<void> {
	const Users: Model<UserDocument> = global.Users;
	const user = await Users.findOne(userId);
	
	if (user) {
		// TypeScript validates the fields exist
		user.query.set('points', points);
		await user.save();
	}
}

// ============================================
// Extension Types Usage
// ============================================

import type { ExtensionDocument, SandboxContext, ExtensionScope } from '../types';

// Define extension with type checking
const extension: Partial<ExtensionDocument> = {
	name: 'My Extension',
	description: 'Example extension',
	version: '1.0.0',
	scopes: ['commands', 'http', 'storage'], // TypeScript validates these
	state: 'published',
	tags: ['utility', 'fun'],
};

// Create sandbox context with types
const context: SandboxContext = {
	server: {
		id: '123',
		name: 'Test Server',
		memberCount: 100,
	},
	user: {
		id: '456',
		username: 'TestUser',
		discriminator: '1234',
	},
	channel: {
		id: '789',
		name: 'general',
	},
};

// ============================================
// Network Validator Usage
// ============================================

import { isAllowedUrl, isPrivateIp, DEFAULT_HTTP_ALLOWLIST } from '../Internals/Extensions/API/NetworkValidator';
import type { UrlValidationResult } from '../types';

// Validate URLs with type safety
async function validateExtensionUrl(url: string): Promise<boolean> {
	const result: UrlValidationResult = isAllowedUrl(
		url,
		'allowlist_only',
		false,
		DEFAULT_HTTP_ALLOWLIST
	);
	
	if (!result.ok) {
		console.error(`URL validation failed: ${result.error}`);
		return false;
	}
	
	// result.url is typed as URL
	console.log(`Valid URL: ${result.url?.toString()}`);
	return true;
}

// Check IP addresses
const isPrivate = isPrivateIp('192.168.1.1'); // TypeScript knows this returns boolean

// ============================================
// Serializers Usage
// ============================================

import { serializeMessage, serializeUser, getEmbedHelper } from '../Internals/Extensions/API/Serializers';
import type { SerializedMessage, EmbedHelper } from '../types';
import type { Message, User } from 'discord.js';

// Serialize Discord objects with type safety
function processMessage(message: Message): SerializedMessage {
	const serialized = serializeMessage(message);
	
	// TypeScript knows the exact structure
	console.log(`Message from ${serialized.author.username}: ${serialized.content}`);
	
	return serialized;
}

// Use embed helper with types
const embedHelper: EmbedHelper = getEmbedHelper();

const embed = embedHelper.create({
	title: 'Example Embed',
	description: 'This is typed!',
	color: embedHelper.colors.BLUE, // Autocomplete for colors!
});

// Resolve colors with type checking
const redColor = embedHelper.resolveColor('#FF0000');
const randomColor = embedHelper.resolveColor('RANDOM');

// ============================================
// Benefits Summary
// ============================================

/**
 * Using TypeScript definitions provides:
 * 
 * 1. **Autocomplete**: IDE suggests available methods and properties
 * 2. **Type Safety**: Catch errors before runtime
 * 3. **Documentation**: Inline documentation in your editor
 * 4. **Refactoring**: Safely rename and refactor code
 * 5. **IntelliSense**: See function signatures and return types
 * 
 * Even in JavaScript files, VSCode uses these definitions for IntelliSense!
 */

export {};
