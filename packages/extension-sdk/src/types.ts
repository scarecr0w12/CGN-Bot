/**
 * Type definitions for CGN-Bot Extension SDK
 * 
 * @module types
 */

/**
 * Extension types
 */
export type ExtensionType = 'command' | 'keyword' | 'event';

/**
 * Discord events that extensions can listen to
 */
export type AllowedEvent =
  | 'channelCreate'
  | 'channelDelete'
  | 'channelUpdate'
  | 'emojiCreate'
  | 'emojiDelete'
  | 'emojiUpdate'
  | 'guildBanAdd'
  | 'guildBanRemove'
  | 'guildMemberAdd'
  | 'guildMemberRemove'
  | 'guildMemberUpdate'
  | 'guildUpdate'
  | 'messageDelete'
  | 'messageReactionAdd'
  | 'messageReactionRemove'
  | 'messageUpdate'
  | 'roleCreate'
  | 'roleDelete'
  | 'roleUpdate'
  | 'voiceStateUpdate';

/**
 * Admin permission levels
 */
export type AdminLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Extension scopes (permissions)
 */
export type ExtensionScope =
  // Moderation
  | 'ban'
  | 'kick'
  | 'mute'
  | 'softban'
  | 'unban'
  | 'unmute'
  | 'warn'
  
  // Roles
  | 'manage_roles'
  | 'create_role'
  | 'delete_role'
  
  // Channels
  | 'manage_channels'
  | 'create_channel'
  | 'delete_channel'
  
  // Messages
  | 'send_messages'
  | 'delete_messages'
  | 'edit_messages'
  | 'pin_messages'
  
  // Members
  | 'manage_nicknames'
  | 'view_members'
  
  // Server
  | 'manage_guild'
  | 'view_audit_log'
  
  // Network
  | 'network_allowlist_only'
  | 'network'
  | 'network_advanced'
  
  // Data
  | 'storage'
  | 'database_read'
  | 'database_write';

/**
 * Network capability levels
 */
export type NetworkCapability = 'none' | 'allowlist_only' | 'network' | 'network_advanced';

/**
 * Extension configuration field types
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'multiselect';

/**
 * Extension configuration field
 */
export interface ExtensionField {
  /** Field name/key */
  name: string;
  
  /** Display label */
  label: string;
  
  /** Field type */
  type: FieldType;
  
  /** Whether field is required */
  required?: boolean;
  
  /** Default value */
  default?: any;
  
  /** For select/multiselect: available options */
  options?: Array<{ label: string; value: any }>;
  
  /** Help text */
  description?: string;
  
  /** Validation regex (for string fields) */
  pattern?: string;
  
  /** Min/max for number fields */
  min?: number;
  max?: number;
}

/**
 * Extension metadata
 */
export interface ExtensionMetadata {
  /** Extension name */
  name: string;
  
  /** Extension description */
  description: string;
  
  /** Extension type */
  type: ExtensionType;
  
  /** Extension version */
  version: string;
  
  /** Author information */
  author: {
    name: string;
    id?: string;
  };
  
  /** Extension scopes/permissions */
  scopes: ExtensionScope[];
  
  /** For command extensions: trigger key */
  key?: string;
  
  /** For keyword extensions: trigger keywords */
  keywords?: string[];
  
  /** For keyword extensions: case-sensitive matching */
  caseSensitive?: boolean;
  
  /** For event extensions: event name */
  event?: AllowedEvent;
  
  /** Required admin level (0-4) */
  adminLevel?: AdminLevel;
  
  /** Usage help text */
  usageHelp?: string;
  
  /** Extended help text */
  extendedHelp?: string;
  
  /** Configuration fields */
  fields?: ExtensionField[];
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Network capability required */
  networkCapability?: NetworkCapability;
}

/**
 * Extension storage interface
 */
export interface ExtensionStorage {
  /**
   * Write a value to storage
   * @param key - Storage key
   * @param value - Value to store (must be JSON-serializable)
   */
  write(key: string, value: any): Promise<any>;
  
  /**
   * Read a value from storage
   * @param key - Storage key
   */
  get(key: string): any;
  
  /**
   * Delete a value from storage
   * @param key - Storage key
   */
  delete(key: string): Promise<string>;
  
  /**
   * Clear all storage
   */
  clear(): Promise<void>;
}

/**
 * Extension context provided to execute function
 */
export interface ExtensionContext {
  /** Extension metadata */
  extension: {
    name: string;
    type: ExtensionType;
    key?: string;
    keywords?: string[];
    caseSensitive?: boolean;
    adminLevel: AdminLevel;
    usageHelp?: string;
    extendedHelp?: string;
    event?: AllowedEvent;
    fields?: ExtensionField[];
  };
  
  /** Extension storage */
  storage: ExtensionStorage;
  
  /** Guild information */
  guild: any; // Will be typed with SDK structures
  
  /** Message (for command/keyword extensions) */
  msg?: any;
  
  /** Event data (for event extensions) */
  event?: any;
  
  /** User configuration from extension fields */
  config: Record<string, any>;
}

/**
 * Extension execution result
 */
export interface ExtensionResult {
  /** Whether execution was successful */
  success: boolean;
  
  /** Error if execution failed */
  error?: Error;
  
  /** Optional return value */
  data?: any;
}

/**
 * Extension execute function signature
 */
export type ExtensionExecute = (context: ExtensionContext) => Promise<ExtensionResult | void>;

/**
 * Complete extension definition
 */
export interface Extension {
  /** Extension metadata */
  metadata: ExtensionMetadata;
  
  /** Extension execute function */
  execute: ExtensionExecute;
}
