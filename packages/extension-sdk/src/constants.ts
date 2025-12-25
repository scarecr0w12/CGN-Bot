/**
 * Constants for extension development
 * 
 * @module constants
 */

import { AllowedEvent, ExtensionScope } from './types';

/**
 * All allowed Discord events for extensions
 */
export const ALLOWED_EVENTS: AllowedEvent[] = [
  'channelCreate',
  'channelDelete',
  'channelUpdate',
  'emojiCreate',
  'emojiDelete',
  'emojiUpdate',
  'guildBanAdd',
  'guildBanRemove',
  'guildMemberAdd',
  'guildMemberRemove',
  'guildMemberUpdate',
  'guildUpdate',
  'messageDelete',
  'messageReactionAdd',
  'messageReactionRemove',
  'messageUpdate',
  'roleCreate',
  'roleDelete',
  'roleUpdate',
  'voiceStateUpdate',
];

/**
 * All available extension scopes
 */
export const EXTENSION_SCOPES: ExtensionScope[] = [
  'ban',
  'kick',
  'mute',
  'softban',
  'unban',
  'unmute',
  'warn',
  'manage_roles',
  'create_role',
  'delete_role',
  'manage_channels',
  'create_channel',
  'delete_channel',
  'send_messages',
  'delete_messages',
  'edit_messages',
  'pin_messages',
  'manage_nicknames',
  'view_members',
  'manage_guild',
  'view_audit_log',
  'network_allowlist_only',
  'network',
  'network_advanced',
  'storage',
  'database_read',
  'database_write',
];

/**
 * Extension tags for categorization
 */
export const EXTENSION_TAGS = [
  'utility',
  'moderation',
  'fun',
  'music',
  'games',
  'information',
  'social',
  'automation',
  'logging',
  'analytics',
  'economy',
  'leveling',
  'notifications',
  'polls',
  'reactions',
  'roles',
  'welcome',
  'custom-commands',
  'integration',
  'api',
] as const;

/**
 * Storage size limits
 */
export const STORAGE_LIMITS = {
  /** Maximum storage size in bytes (25KB) */
  MAX_SIZE: 25000,
  
  /** Warning threshold (20KB) */
  WARNING_SIZE: 20000,
} as const;

/**
 * Network request limits
 */
export const NETWORK_LIMITS = {
  /** Maximum response size (1MB) */
  MAX_RESPONSE_BYTES: 1024 * 1024,
  
  /** Request timeout (6 seconds) */
  TIMEOUT_MS: 6000,
  
  /** Rate limit window (1 minute) */
  RATE_WINDOW_MS: 60 * 1000,
  
  /** Max requests per window */
  RATE_MAX: 30,
} as const;

/**
 * Scope descriptions for documentation
 */
export const SCOPE_DESCRIPTIONS: Record<ExtensionScope, string> = {
  // Moderation
  ban: 'Ban members from the guild',
  kick: 'Kick members from the guild',
  mute: 'Mute members in the guild',
  softban: 'Softban members (ban + unban to delete messages)',
  unban: 'Remove bans from members',
  unmute: 'Remove mutes from members',
  warn: 'Issue warnings to members',
  
  // Roles
  manage_roles: 'Manage guild roles and assign them to members',
  create_role: 'Create new roles',
  delete_role: 'Delete existing roles',
  
  // Channels
  manage_channels: 'Manage channel settings and permissions',
  create_channel: 'Create new channels',
  delete_channel: 'Delete existing channels',
  
  // Messages
  send_messages: 'Send messages in all channels',
  delete_messages: 'Delete messages from channels',
  edit_messages: 'Edit bot messages',
  pin_messages: 'Pin and unpin messages',
  
  // Members
  manage_nicknames: 'Change member nicknames',
  view_members: 'Access guild member list',
  
  // Guild
  manage_guild: 'Modify guild settings',
  view_audit_log: 'Read guild audit log',
  
  // Network
  network_allowlist_only: 'Make HTTPS requests to allowlisted domains',
  network: 'Make HTTPS requests to any domain',
  network_advanced: 'Make HTTP/HTTPS requests with advanced features',
  
  // Data
  storage: 'Use persistent key-value storage (25KB limit)',
  database_read: 'Read from guild database',
  database_write: 'Write to guild database',
};
