/**
 * Fluent API for building extensions
 * 
 * @module ExtensionBuilder
 */

import { 
  Extension, 
  ExtensionMetadata, 
  ExtensionExecute, 
  ExtensionType,
  ExtensionScope,
  AllowedEvent,
  AdminLevel,
  ExtensionField,
  NetworkCapability,
} from './types';
import { Extension as ExtensionClass } from './Extension';

/**
 * Fluent builder for creating extensions
 */
export class ExtensionBuilder {
  private metadata: Partial<ExtensionMetadata> = {
    scopes: [],
    adminLevel: 0,
  };
  private executeFunc?: ExtensionExecute;

  /**
   * Set extension name
   */
  name(name: string): this {
    this.metadata.name = name;
    return this;
  }

  /**
   * Set extension description
   */
  description(description: string): this {
    this.metadata.description = description;
    return this;
  }

  /**
   * Set extension type
   */
  type(type: ExtensionType): this {
    this.metadata.type = type;
    return this;
  }

  /**
   * Set extension version
   */
  version(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Set extension author
   */
  author(name: string, id?: string): this {
    this.metadata.author = { name, id };
    return this;
  }

  /**
   * Add a scope to the extension
   */
  addScope(scope: ExtensionScope): this {
    if (!this.metadata.scopes) {
      this.metadata.scopes = [];
    }
    if (!this.metadata.scopes.includes(scope)) {
      this.metadata.scopes.push(scope);
    }
    return this;
  }

  /**
   * Set all scopes at once
   */
  scopes(scopes: ExtensionScope[]): this {
    this.metadata.scopes = [...scopes];
    return this;
  }

  /**
   * Set command key (for command extensions)
   */
  key(key: string): this {
    this.metadata.key = key;
    return this;
  }

  /**
   * Set keywords (for keyword extensions)
   */
  keywords(keywords: string[]): this {
    this.metadata.keywords = keywords;
    return this;
  }

  /**
   * Set case sensitivity (for keyword extensions)
   */
  caseSensitive(sensitive: boolean): this {
    this.metadata.caseSensitive = sensitive;
    return this;
  }

  /**
   * Set event (for event extensions)
   */
  event(event: AllowedEvent): this {
    this.metadata.event = event;
    return this;
  }

  /**
   * Set required admin level
   */
  adminLevel(level: AdminLevel): this {
    this.metadata.adminLevel = level;
    return this;
  }

  /**
   * Set usage help text
   */
  usageHelp(help: string): this {
    this.metadata.usageHelp = help;
    return this;
  }

  /**
   * Set extended help text
   */
  extendedHelp(help: string): this {
    this.metadata.extendedHelp = help;
    return this;
  }

  /**
   * Add a configuration field
   */
  addField(field: ExtensionField): this {
    if (!this.metadata.fields) {
      this.metadata.fields = [];
    }
    this.metadata.fields.push(field);
    return this;
  }

  /**
   * Set all fields at once
   */
  fields(fields: ExtensionField[]): this {
    this.metadata.fields = [...fields];
    return this;
  }

  /**
   * Add a tag
   */
  addTag(tag: string): this {
    if (!this.metadata.tags) {
      this.metadata.tags = [];
    }
    if (!this.metadata.tags.includes(tag)) {
      this.metadata.tags.push(tag);
    }
    return this;
  }

  /**
   * Set all tags at once
   */
  tags(tags: string[]): this {
    this.metadata.tags = [...tags];
    return this;
  }

  /**
   * Set network capability
   */
  networkCapability(capability: NetworkCapability): this {
    this.metadata.networkCapability = capability;
    return this;
  }

  /**
   * Set the execute function
   */
  execute(fn: ExtensionExecute): this {
    this.executeFunc = fn;
    return this;
  }

  /**
   * Build the extension
   */
  build(): Extension {
    if (!this.executeFunc) {
      throw new Error('Extension execute function is required');
    }

    return new ExtensionClass(
      this.metadata as ExtensionMetadata,
      this.executeFunc
    );
  }

  /**
   * Create a command extension builder
   */
  static command(name: string, key: string): ExtensionBuilder {
    return new ExtensionBuilder()
      .name(name)
      .type('command')
      .key(key);
  }

  /**
   * Create a keyword extension builder
   */
  static keyword(name: string, keywords: string[]): ExtensionBuilder {
    return new ExtensionBuilder()
      .name(name)
      .type('keyword')
      .keywords(keywords);
  }

  /**
   * Create an event extension builder
   */
  static event(name: string, event: AllowedEvent): ExtensionBuilder {
    return new ExtensionBuilder()
      .name(name)
      .type('event')
      .event(event);
  }
}
