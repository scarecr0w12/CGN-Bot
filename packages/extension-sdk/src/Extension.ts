/**
 * Extension base class
 * 
 * @module Extension
 */

import { Extension as IExtension, ExtensionMetadata, ExtensionExecute } from './types';

/**
 * Base Extension class that developers extend
 */
export class Extension implements IExtension {
  public readonly metadata: ExtensionMetadata;
  public readonly execute: ExtensionExecute;

  /**
   * Create a new Extension
   * @param metadata - Extension metadata
   * @param execute - Extension execute function
   */
  constructor(metadata: ExtensionMetadata, execute: ExtensionExecute) {
    this.metadata = metadata;
    this.execute = execute;
    
    this.validate();
  }

  /**
   * Validate extension metadata
   * @private
   */
  private validate(): void {
    if (!this.metadata.name) {
      throw new Error('Extension name is required');
    }
    
    if (!this.metadata.description) {
      throw new Error('Extension description is required');
    }
    
    if (!this.metadata.type) {
      throw new Error('Extension type is required');
    }
    
    if (!['command', 'keyword', 'event'].includes(this.metadata.type)) {
      throw new Error(`Invalid extension type: ${this.metadata.type}`);
    }
    
    if (!this.metadata.version) {
      throw new Error('Extension version is required');
    }
    
    if (!this.metadata.author?.name) {
      throw new Error('Extension author name is required');
    }
    
    if (!Array.isArray(this.metadata.scopes) || this.metadata.scopes.length === 0) {
      throw new Error('Extension must declare at least one scope');
    }
    
    // Type-specific validation
    if (this.metadata.type === 'command' && !this.metadata.key) {
      throw new Error('Command extensions must have a key');
    }
    
    if (this.metadata.type === 'keyword' && (!this.metadata.keywords || this.metadata.keywords.length === 0)) {
      throw new Error('Keyword extensions must have at least one keyword');
    }
    
    if (this.metadata.type === 'event' && !this.metadata.event) {
      throw new Error('Event extensions must specify an event');
    }
  }

  /**
   * Export extension as JSON
   */
  public toJSON(): IExtension {
    return {
      metadata: this.metadata,
      execute: this.execute,
    };
  }

  /**
   * Get extension code as string (for uploading)
   */
  public toCode(): string {
    const metadataStr = JSON.stringify(this.metadata, null, 2);
    const executeStr = this.execute.toString();
    
    return `// Extension: ${this.metadata.name}
// Type: ${this.metadata.type}
// Version: ${this.metadata.version}

exports.metadata = ${metadataStr};

exports.execute = ${executeStr};
`;
  }
}
