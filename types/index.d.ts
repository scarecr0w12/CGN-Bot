/**
 * CGN-Bot TypeScript Type Definitions
 * 
 * These type definitions provide IDE support and documentation
 * for the bot's core modules and interfaces.
 */

import { Client, Guild, GuildMember, User, Message, CommandInteraction } from "discord.js";

// ============================================
// DATABASE TYPES
// ============================================

export interface Document<T = any> {
	_id: string;
	query: QueryDocument;
	toObject(): T;
	save(): Promise<void>;
	cache(): void;
}

export interface QueryDocument {
	clone: QueryDocument;
	set(path: string, value: any): QueryDocument;
	push(path: string, value: any): QueryDocument;
	pull(path: string, value: any): QueryDocument;
	inc(path: string, amount: number): QueryDocument;
	id(path: string, id: string): QueryDocument;
}

export interface Model<T = any> {
	schema: Schema;
	find(query?: object): Cursor<T>;
	findOne(query: string | object): Promise<Document<T> | null>;
	findOneByObjectID(id: string): Promise<Document<T> | null>;
	update(query: object, operations: object, opts?: UpdateOptions): Promise<any>;
	insert(data: T | T[], opts?: object): Promise<any>;
	delete(query: object, options?: object): Promise<any>;
	new(data: Partial<T>): Document<T>;
	create(data: Partial<T>): Promise<Document<T>>;
	count(query?: object): Promise<number>;
	aggregate(pipeline: object[]): Promise<any[]>;
}

export interface Cursor<T = any> {
	sort(sortObj: object): Cursor<T>;
	limit(n: number): Cursor<T>;
	skip(n: number): Cursor<T>;
	exec(): Promise<Document<T>[]>;
	toArray(): Promise<Document<T>[]>;
}

export interface UpdateOptions {
	multi?: boolean;
	upsert?: boolean;
}

export interface Schema {
	build(data: object): object;
	validate(doc: object): ValidationError | null;
}

export interface ValidationError {
	errors: Array<{
		path: string;
		validator: string;
		message: string;
	}>;
}

// ============================================
// SERVER DOCUMENT TYPES
// ============================================

export interface ServerDocument {
	_id: string;
	config: ServerConfig;
	extensions: ExtensionConfig[];
	members: MemberDocument[];
	channels: ChannelDocument[];
	modlog: ModlogEntry[];
	query: QueryDocument;
}

export interface ServerConfig {
	commandPrefix: string;
	language: string;
	admins: AdminRole[];
	moderation: ModerationConfig;
	commands: CommandsConfig;
	modlog: ModlogConfig;
}

export interface AdminRole {
	_id: string;
	level: number;
}

export interface ModerationConfig {
	isEnabled: boolean;
	autoEscalation: AutoEscalationConfig;
	filters: FilterConfig[];
}

export interface AutoEscalationConfig {
	isEnabled: boolean;
	thresholds: EscalationThreshold[];
}

export interface EscalationThreshold {
	strikes: number;
	action: "warn" | "mute" | "kick" | "ban";
	duration?: number;
}

export interface FilterConfig {
	_id: string;
	type: string;
	isEnabled: boolean;
	keywords?: string[];
	action: string;
}

export interface CommandsConfig {
	[commandName: string]: {
		isEnabled: boolean;
		adminLevel?: number;
		allowedChannels?: string[];
	};
}

export interface ModlogConfig {
	isEnabled: boolean;
	channelID?: string;
}

export interface ExtensionConfig {
	_id: string;
	key: string;
	version: string;
	isEnabled: boolean;
	adminLevel: number;
}

export interface MemberDocument {
	_id: string;
	strikes: StrikeEntry[];
	warnings: number;
	points: number;
	muted?: {
		isMuted: boolean;
		expiry?: Date;
	};
}

export interface StrikeEntry {
	admin: string;
	reason: string;
	timestamp: Date;
}

export interface ChannelDocument {
	_id: string;
	bot_enabled: boolean;
}

export interface ModlogEntry {
	_id: string;
	type: string;
	userID: string;
	moderatorID: string;
	reason: string;
	timestamp: Date;
}

// ============================================
// USER DOCUMENT TYPES
// ============================================

export interface UserDocument {
	_id: string;
	points: number;
	afk?: AfkStatus;
	reminders: Reminder[];
	preferences: UserPreferences;
	linked_accounts: LinkedAccounts;
	query: QueryDocument;
}

export interface AfkStatus {
	isAfk: boolean;
	message?: string;
	since?: Date;
}

export interface Reminder {
	_id: string;
	message: string;
	channelID: string;
	expiry: Date;
}

export interface UserPreferences {
	language: string;
	timezone?: string;
}

export interface LinkedAccounts {
	google?: OAuthAccount;
	github?: OAuthAccount;
	twitch?: OAuthAccount;
	patreon?: OAuthAccount;
}

export interface OAuthAccount {
	id: string;
	username?: string;
	accessToken?: string;
	refreshToken?: string;
}

// ============================================
// EXTENSION TYPES
// ============================================

export interface ExtensionDocument {
	_id: string;
	name: string;
	description: string;
	owner: string;
	version: string;
	scopes: ExtensionScope[];
	state: "gallery" | "queue" | "published" | "rejected";
	tags: string[];
	downloads: number;
	rating: number;
}

export type ExtensionScope = 
	| "commands"
	| "http"
	| "storage"
	| "points"
	| "rcon"
	| "messages"
	| "interactions";

export interface SandboxContext {
	server: {
		id: string;
		name: string;
		memberCount: number;
	};
	user: {
		id: string;
		username: string;
		discriminator: string;
	};
	channel: {
		id: string;
		name: string;
	};
	message?: {
		id: string;
		content: string;
	};
	interaction?: {
		id: string;
		commandName: string;
	};
}

// ============================================
// CONFIG MANAGER TYPES
// ============================================

export interface SiteSettings {
	_id: string;
	maintainers: string[];
	sudoMaintainers: string[];
	wikiContributors: string[];
	userBlocklist: string[];
	guildBlocklist: string[];
	activityBlocklist: string[];
	botStatus: "online" | "idle" | "dnd" | "invisible";
	botActivity: BotActivity;
	perms: PermissionLevels;
	pmForward: boolean;
	extension_sandbox: ExtensionSandboxSettings;
}

export interface BotActivity {
	name: string;
	type: "PLAYING" | "STREAMING" | "LISTENING" | "WATCHING" | "COMPETING";
	twitchURL?: string;
}

export interface PermissionLevels {
	eval: 0 | 1 | 2;
	sudo: 0 | 1 | 2;
	management: 0 | 1 | 2;
	administration: 0 | 1 | 2;
	shutdown: 0 | 1 | 2;
}

export interface ExtensionSandboxSettings {
	http_allowlist: string[];
	memory_limit_mb: number;
	execution_timeout_ms: number;
	max_http_requests: number;
	network_enabled: boolean;
}

// ============================================
// TIER MANAGER TYPES
// ============================================

export interface Tier {
	_id: string;
	name: string;
	level: number;
	description?: string;
	features: string[];
	badge_icon?: string;
	color?: string;
	price_monthly?: number;
	price_yearly?: number;
	is_purchasable: boolean;
	is_default: boolean;
}

export interface ServerSubscription {
	tier_id: string;
	expires_at?: Date;
	customer_id?: string;
	subscription_id?: string;
}

// ============================================
// CACHE MANAGER TYPES
// ============================================

export interface CacheStats {
	redisAvailable: boolean;
	memoryCacheSize: number;
	ttls: {
		SERVER: number;
		USER: number;
		EXTENSION: number;
		GALLERY: number;
	};
}

// ============================================
// QUERY LOGGER TYPES
// ============================================

export interface QueryMetrics {
	enabled: boolean;
	slowQueryThresholdMs: number;
	totalQueries: number;
	slowQueries: number;
	slowQueryPercentage: number;
	averageQueryTimeMs: number;
	byOperation: Record<string, OperationMetrics>;
	byTable: Record<string, OperationMetrics>;
	activeQueries: number;
}

export interface OperationMetrics {
	count: number;
	avgTimeMs: number;
}

export interface SlowQuery {
	operation: string;
	table: string;
	query: object;
	durationMs: number;
	rowCount: number;
	timestamp: number;
}

// ============================================
// CLIENT TYPES
// ============================================

export interface SkynetClient extends Client {
	IPC: IPC;
	shardID: number;
	isReady: boolean;
	
	// Command methods
	reloadAllCommands(): Promise<void>;
	reloadCommand(category: string, command: string): Promise<boolean>;
	
	// User methods
	getUserBotAdmin(server: Guild, serverDocument: ServerDocument, member: GuildMember): number;
	searchUsers(query: string, server?: Guild): Promise<User[]>;
	
	// Violation handling
	handleViolation(
		server: Guild,
		serverDocument: ServerDocument,
		channel: any,
		member: GuildMember,
		userDocument: UserDocument,
		memberDocument: MemberDocument,
		userMessage: string,
		adminMessage: string,
		strikeMessage: string,
		action: "block" | "mute" | "kick" | "ban" | "none",
		roleID?: string
	): Promise<void>;
}

export interface IPC {
	send(event: string, data: any, shardId?: number): void;
	broadcast(event: string, data: any): void;
	on(event: string, handler: (data: any) => void): void;
	once(event: string, handler: (data: any) => void): void;
}

// ============================================
// WEB TYPES
// ============================================

export interface DashboardRequest {
	user?: {
		id: string;
		username: string;
		discriminator: string;
		avatar?: string;
	};
	isAuthenticated(): boolean;
	isAuthorized?: boolean;
	isSudo?: boolean;
	isAPI?: boolean;
	svr?: GetGuildResult;
	consolemember?: {
		user: { id: string };
		level: number;
	};
}

export interface GetGuildResult {
	id: string;
	name: string;
	icon?: string;
	success: boolean;
	members: Record<string, GuildMember>;
	channels: Record<string, any>;
	roles: Record<string, any>;
	document?: ServerDocument;
	queryDocument?: QueryDocument;
}

export interface SkynetResponse {
	template: {
		title: string;
		pageTitle: string;
		pageDescription?: string;
		nonce: string;
		[key: string]: any;
	};
	render(view: string, data?: object): void;
	populateDashboard(req: DashboardRequest): void;
}

// ============================================
// MODULE DECLARATIONS
// ============================================

declare module "../Modules/ConfigManager" {
	export function get(refresh?: boolean): Promise<SiteSettings>;
	export function getCached(): SiteSettings;
	export function isMaintainer(userId: string): Promise<boolean>;
	export function isSudoMaintainer(userId: string): Promise<boolean>;
	export function isUserBlocked(userId: string): Promise<boolean>;
	export function isGuildBlocked(guildId: string): Promise<boolean>;
	export function canDo(action: string, userId: string): Promise<boolean>;
	export function getUserLevel(userId: string): Promise<number>;
	export function checkSudoMode(userId: string): Promise<boolean>;
	export function invalidateCache(): void;
}

declare module "../Modules/TierManager" {
	export function getServerTier(serverId: string): Promise<Tier | null>;
	export function canAccess(serverId: string, featureId: string): Promise<boolean>;
	export function getTiers(): Promise<Tier[]>;
	export function getFeatures(): Promise<any[]>;
}

declare module "../Modules/CacheManager" {
	export function getServer(serverId: string, skipCache?: boolean): Promise<ServerDocument | null>;
	export function getUser(userId: string, skipCache?: boolean): Promise<UserDocument | null>;
	export function getExtension(extensionId: string, skipCache?: boolean): Promise<ExtensionDocument | null>;
	export function invalidateServer(serverId: string): Promise<void>;
	export function invalidateUser(userId: string): Promise<void>;
	export function invalidateExtension(extensionId: string): Promise<void>;
	export function clearAll(): Promise<void>;
	export function getStats(): CacheStats;
	export function isRedisAvailable(): boolean;
}

declare module "../Modules/QueryLogger" {
	export function startQuery(operation: string, table: string, query?: object): number;
	export function endQuery(queryId: number, rowCount?: number): SlowQuery | null;
	export function getMetrics(): QueryMetrics;
	export function getSlowQueries(limit?: number): SlowQuery[];
	export function resetMetrics(): void;
	export function timeQuery<T>(operation: string, table: string, query: object, fn: () => Promise<T>): Promise<T>;
	export function isEnabled(): boolean;
	export function getSlowQueryThreshold(): number;
}

// ============================================
// GLOBAL DECLARATIONS
// ============================================

declare global {
	var logger: {
		debug(message: string, meta?: object, error?: Error): void;
		info(message: string, meta?: object, error?: Error): void;
		warn(message: string, meta?: object, error?: Error): void;
		error(message: string, meta?: object, error?: Error): void;
		verbose(message: string, meta?: object, error?: Error): void;
	};
	
	var Servers: Model<ServerDocument>;
	var Users: Model<UserDocument>;
	var Gallery: Model<ExtensionDocument>;
	var SiteSettings: Model<SiteSettings>;
}

export {};
