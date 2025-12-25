/**
 * Utility functions for extension development
 * 
 * @module utils
 */

import { ExtensionMetadata, ExtensionScope, ExtensionField } from './types';
import { SCOPE_DESCRIPTIONS } from './constants';

/**
 * Validate extension metadata
 * @param metadata - Extension metadata to validate
 * @returns Validation result with errors
 */
export function validateMetadata(metadata: Partial<ExtensionMetadata>): { 
  valid: boolean; 
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata.name) {
    errors.push('name is required');
  }

  if (!metadata.description) {
    errors.push('description is required');
  }

  if (!metadata.type) {
    errors.push('type is required');
  } else if (!['command', 'keyword', 'event'].includes(metadata.type)) {
    errors.push(`invalid type: ${metadata.type}`);
  }

  if (!metadata.version) {
    errors.push('version is required');
  } else if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
    errors.push(`invalid version format: ${metadata.version} (expected semver)`);
  }

  if (!metadata.author?.name) {
    errors.push('author.name is required');
  }

  if (!Array.isArray(metadata.scopes) || metadata.scopes.length === 0) {
    errors.push('at least one scope is required');
  }

  // Type-specific validation
  if (metadata.type === 'command' && !metadata.key) {
    errors.push('command extensions must have a key');
  }

  if (metadata.type === 'keyword') {
    if (!metadata.keywords || metadata.keywords.length === 0) {
      errors.push('keyword extensions must have at least one keyword');
    }
  }

  if (metadata.type === 'event' && !metadata.event) {
    errors.push('event extensions must specify an event');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get human-readable descriptions for scopes
 * @param scopes - Array of scopes
 * @returns Array of scope descriptions
 */
export function getScopeDescriptions(scopes: ExtensionScope[]): Array<{
  scope: ExtensionScope;
  description: string;
}> {
  return scopes.map(scope => ({
    scope,
    description: SCOPE_DESCRIPTIONS[scope] || 'Unknown scope',
  }));
}

/**
 * Estimate storage usage of an object
 * @param obj - Object to measure
 * @returns Approximate size in bytes
 */
export function estimateStorageSize(obj: any): number {
  const json = JSON.stringify(obj);
  return new Blob([json]).size;
}

/**
 * Check if storage size is within limits
 * @param size - Size in bytes
 * @returns Whether size is within limits
 */
export function isStorageSizeValid(size: number): boolean {
  return size <= 25000;
}

/**
 * Sanitize extension name for use in filenames
 * @param name - Extension name
 * @returns Sanitized name
 */
export function sanitizeExtensionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate extension filename
 * @param metadata - Extension metadata
 * @returns Filename for extension
 */
export function generateExtensionFilename(metadata: ExtensionMetadata): string {
  const sanitized = sanitizeExtensionName(metadata.name);
  return `${sanitized}-${metadata.version}.js`;
}

/**
 * Validate field configuration
 * @param field - Field to validate
 * @returns Validation result
 */
export function validateField(field: ExtensionField): { 
  valid: boolean; 
  errors: string[];
} {
  const errors: string[] = [];

  if (!field.name) {
    errors.push('field name is required');
  }

  if (!field.label) {
    errors.push('field label is required');
  }

  if (!field.type) {
    errors.push('field type is required');
  } else if (!['string', 'number', 'boolean', 'select', 'multiselect'].includes(field.type)) {
    errors.push(`invalid field type: ${field.type}`);
  }

  if ((field.type === 'select' || field.type === 'multiselect') && !field.options) {
    errors.push('select/multiselect fields must have options');
  }

  if (field.type === 'number') {
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      errors.push('field min cannot be greater than max');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse extension code to extract metadata and execute function
 * @param code - Extension code string
 * @returns Parsed extension data
 */
export function parseExtensionCode(code: string): {
  metadata?: ExtensionMetadata;
  execute?: string;
  error?: string;
} {
  try {
    // Simple regex-based extraction (in production, use proper parsing)
    const metadataMatch = code.match(/exports\.metadata\s*=\s*({[\s\S]*?});/);
    const executeMatch = code.match(/exports\.execute\s*=\s*([\s\S]*?);?\s*$/);

    if (!metadataMatch) {
      return { error: 'Could not find metadata export' };
    }

    if (!executeMatch) {
      return { error: 'Could not find execute export' };
    }

    const metadata = JSON.parse(metadataMatch[1]);
    const execute = executeMatch[1];

    return { metadata, execute };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Parse error' };
  }
}

/**
 * Format extension metadata for display
 * @param metadata - Extension metadata
 * @returns Formatted string
 */
export function formatMetadata(metadata: ExtensionMetadata): string {
  const lines = [
    `Name: ${metadata.name}`,
    `Type: ${metadata.type}`,
    `Version: ${metadata.version}`,
    `Author: ${metadata.author.name}`,
    `Scopes: ${metadata.scopes.join(', ')}`,
  ];

  if (metadata.key) {
    lines.push(`Key: ${metadata.key}`);
  }

  if (metadata.keywords) {
    lines.push(`Keywords: ${metadata.keywords.join(', ')}`);
  }

  if (metadata.event) {
    lines.push(`Event: ${metadata.event}`);
  }

  if (metadata.adminLevel) {
    lines.push(`Admin Level: ${metadata.adminLevel}`);
  }

  return lines.join('\n');
}
