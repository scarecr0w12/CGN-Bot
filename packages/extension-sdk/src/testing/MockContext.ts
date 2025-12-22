/**
 * Mock context for testing extensions
 * 
 * @module testing/MockContext
 */

import { ExtensionContext, ExtensionStorage, ExtensionType, AllowedEvent } from '../types';

/**
 * Mock storage implementation for testing
 */
class MockStorage implements ExtensionStorage {
  private data: Map<string, any> = new Map();

  async write(key: string, value: any): Promise<any> {
    this.data.set(key, value);
    return value;
  }

  get(key: string): any {
    return this.data.get(key);
  }

  async delete(key: string): Promise<string> {
    this.data.delete(key);
    return key;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  /**
   * Get all stored data (for testing/inspection)
   */
  getAll(): Map<string, any> {
    return new Map(this.data);
  }
}

/**
 * Builder for creating mock extension contexts
 */
export class MockContextBuilder {
  private context: Partial<ExtensionContext> = {
    storage: new MockStorage(),
    config: {},
  };

  /**
   * Set extension metadata
   */
  extension(metadata: Partial<ExtensionContext['extension']>): this {
    this.context.extension = {
      name: metadata.name || 'Test Extension',
      type: metadata.type || 'command',
      adminLevel: metadata.adminLevel || 0,
      ...metadata,
    } as ExtensionContext['extension'];
    return this;
  }

  /**
   * Set guild data
   */
  guild(guild: any): this {
    this.context.guild = guild;
    return this;
  }

  /**
   * Set message data (for command/keyword extensions)
   */
  message(msg: any): this {
    this.context.msg = msg;
    return this;
  }

  /**
   * Set event data (for event extensions)
   */
  event(event: any): this {
    this.context.event = event;
    return this;
  }

  /**
   * Set user configuration
   */
  config(config: Record<string, any>): this {
    this.context.config = { ...this.context.config, ...config };
    return this;
  }

  /**
   * Set a single config value
   */
  setConfig(key: string, value: any): this {
    if (!this.context.config) {
      this.context.config = {};
    }
    this.context.config[key] = value;
    return this;
  }

  /**
   * Get the mock storage instance for inspection
   */
  getStorage(): MockStorage {
    return this.context.storage as MockStorage;
  }

  /**
   * Build the mock context
   */
  build(): ExtensionContext {
    if (!this.context.extension) {
      this.extension({});
    }
    
    if (!this.context.guild) {
      this.guild({ id: 'test-guild', name: 'Test Guild' });
    }

    return this.context as ExtensionContext;
  }

  /**
   * Create a command extension context
   */
  static command(key?: string): MockContextBuilder {
    return new MockContextBuilder().extension({
      type: 'command',
      key: key || 'test',
    });
  }

  /**
   * Create a keyword extension context
   */
  static keyword(keywords?: string[]): MockContextBuilder {
    return new MockContextBuilder().extension({
      type: 'keyword',
      keywords: keywords || ['test'],
    });
  }

  /**
   * Create an event extension context
   */
  static event(event?: AllowedEvent): MockContextBuilder {
    return new MockContextBuilder().extension({
      type: 'event',
      event: event || 'messageCreate' as AllowedEvent,
    });
  }
}

/**
 * Create a basic mock guild
 */
export function createMockGuild(overrides?: Partial<any>): any {
  return {
    id: 'test-guild-123',
    name: 'Test Guild',
    memberCount: 100,
    ownerId: 'owner-123',
    ...overrides,
  };
}

/**
 * Create a basic mock message
 */
export function createMockMessage(overrides?: Partial<any>): any {
  return {
    id: 'test-message-123',
    content: 'Test message',
    author: {
      id: 'user-123',
      username: 'testuser',
      bot: false,
    },
    channel: {
      id: 'channel-123',
      name: 'test-channel',
    },
    guild: createMockGuild(),
    createdTimestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create a basic mock member
 */
export function createMockMember(overrides?: Partial<any>): any {
  return {
    id: 'member-123',
    user: {
      id: 'user-123',
      username: 'testuser',
      discriminator: '0001',
    },
    nickname: null,
    roles: [],
    joinedTimestamp: Date.now(),
    ...overrides,
  };
}
