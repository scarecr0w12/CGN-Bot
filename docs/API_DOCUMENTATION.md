# API Documentation Guide

**Last Updated:** 2025-12-21  
**Version:** 1.7.1

## Overview

This guide explains how to generate, view, and maintain API documentation for CGN-Bot.

---

## Documentation Types

### 1. Command Documentation

**Location:** `docs/COMMANDS.md`  
**Generator:** `scripts/generate-command-docs.js`

Automatically generated from command files with JSDoc comments.

**Generate:**
```bash
npm run docs:commands
```

**Command File Format:**
```javascript
/**
 * @description Displays server information
 * @example !serverinfo
 * @example !si
 */
module.exports = class ServerInfoCommand {
  constructor() {
    this.name = 'serverinfo';
    this.aliases = ['si'];
    this.permissions = ['VIEW_CHANNEL'];
    this.cooldown = 5;
  }
  
  async run(message, args) {
    // Command logic
  }
};
```

### 2. API Documentation

**Location:** `docs/api/`  
**Generator:** JSDoc  
**Configuration:** `jsdoc.json`

Generated from JSDoc comments in source code.

**Generate:**
```bash
npm run docs:api
```

**View Locally:**
```bash
npm run docs:serve
# Open http://localhost:8080
```

### 3. Module Documentation

Individual module documentation with examples and usage guides.

**Key Modules:**
- `Modules/CacheEvents.js` - Cache invalidation system
- `Internals/CommandExecutor.js` - Command execution logic
- `Internals/CommandMiddleware.js` - Middleware framework
- `Modules/TierManager.js` - Subscription/tier management
- `Modules/ConfigManager.js` - Configuration management

---

## JSDoc Standards

### File-level Documentation

```javascript
/**
 * @fileoverview Brief description of the file
 * Longer description with details about what this module does.
 *
 * @module Path/To/Module
 * @requires dependency1
 * @requires dependency2
 *
 * @example
 * const MyModule = require('./Path/To/Module');
 * const instance = new MyModule();
 */
```

### Class Documentation

```javascript
/**
 * Brief class description.
 * Detailed explanation of what the class does and when to use it.
 *
 * @class ClassName
 * @extends BaseClass
 *
 * @example
 * const obj = new ClassName(param);
 * obj.method();
 */
class ClassName {
  /**
   * Creates a new instance.
   *
   * @constructor
   * @param {Type} param - Parameter description
   */
  constructor(param) {
    /**
     * Instance property description
     * @type {Type}
     * @private
     */
    this.property = param;
  }
}
```

### Method Documentation

```javascript
/**
 * Brief method description.
 * Detailed explanation of what the method does.
 *
 * @param {string} param1 - First parameter description
 * @param {Object} [param2] - Optional second parameter
 * @param {number} [param2.value=10] - Nested property with default
 * @returns {Promise<Object>} Description of return value
 * @returns {boolean} return.success - Success flag
 * @returns {string} [return.error] - Optional error message
 *
 * @throws {Error} When validation fails
 *
 * @example
 * const result = await obj.method('value', { value: 20 });
 * if (result.success) {
 *   console.log('Success!');
 * }
 */
async method(param1, param2 = {}) {
  // Implementation
}
```

### Function Documentation

```javascript
/**
 * Brief function description.
 *
 * @function functionName
 * @param {Type} param - Parameter description
 * @returns {Type} Return description
 *
 * @example
 * const result = functionName('input');
 */
function functionName(param) {
  // Implementation
}
```

---

## Common JSDoc Tags

| Tag | Usage | Example |
|-----|-------|---------|
| `@param` | Function/method parameter | `@param {string} name - User name` |
| `@returns` | Return value | `@returns {boolean} True if valid` |
| `@throws` | Thrown exceptions | `@throws {Error} When input invalid` |
| `@example` | Usage example | `@example const x = fn();` |
| `@type` | Variable type | `@type {string}` |
| `@private` | Private member | `@private` |
| `@deprecated` | Deprecated API | `@deprecated Use newMethod instead` |
| `@see` | Related docs | `@see {@link OtherClass}` |
| `@fires` | Emitted events | `@fires MyClass#event` |
| `@async` | Async function | `@async` |

---

## Type Definitions

### Custom Types

```javascript
/**
 * @typedef {Object} UserProfile
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {number} points - User points
 * @property {Date} joinedAt - Join timestamp
 */

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<UserProfile>} User profile data
 */
async function getUserProfile(userId) {
  // Implementation
}
```

### Complex Types

```javascript
/**
 * @param {string|number} id - String or number ID
 * @param {Array<string>} tags - Array of strings
 * @param {Object.<string, number>} map - String to number map
 * @param {Function} callback - Callback function
 * @param {(error: Error, result: Object) => void} callback - Typed callback
 */
```

---

## Documentation Workflow

### 1. During Development

Add JSDoc comments while writing code:

```javascript
/**
 * New feature description
 * @param {Type} param - Description
 * @returns {Type} Description
 * @example
 * // Usage example
 */
function newFeature(param) {
  // Implementation
}
```

### 2. Before Committing

Generate and verify documentation:

```bash
# Generate all documentation
npm run docs:all

# Check for JSDoc errors
npm run docs:api 2>&1 | grep -i error

# Review generated docs
npm run docs:serve
```

### 3. In Pull Requests

- Include updated documentation
- Add examples for new features
- Update CHANGELOG.md
- Verify API docs render correctly

---

## Best Practices

### DO:
- ✅ Document all public APIs
- ✅ Include practical examples
- ✅ Specify parameter types
- ✅ Document return values
- ✅ Note thrown exceptions
- ✅ Mark deprecated methods
- ✅ Use clear descriptions

### DON'T:
- ❌ Document implementation details
- ❌ Leave examples without context
- ❌ Use vague descriptions
- ❌ Forget to update docs when code changes
- ❌ Document obvious getters/setters
- ❌ Use technical jargon without explanation

---

## Examples by Module Type

### Event Handler

```javascript
/**
 * @fileoverview Message Create Event Handler
 * Processes new messages and triggers command execution.
 *
 * @module Internals/Events/messageCreate
 * @fires Client#commandExecuted
 */

/**
 * Handle message creation event
 * @param {Message} message - Discord message object
 * @fires Client#commandExecuted
 * @example
 * // Automatically called by Discord.js
 */
async function handleMessageCreate(message) {
  // Implementation
}
```

### Database Model

```javascript
/**
 * @fileoverview User Database Model
 * Handles user data persistence and queries.
 *
 * @module Database/Schemas/userSchema
 */

/**
 * User schema definition
 * @typedef {Object} UserSchema
 * @property {string} _id - User Discord ID
 * @property {string} username - Discord username
 * @property {number} points - User economy points
 * @property {Date} created_at - Account creation timestamp
 */
```

### Utility Function

```javascript
/**
 * Format a number with thousand separators
 *
 * @function formatNumber
 * @param {number} num - Number to format
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted number string
 *
 * @example
 * formatNumber(1234567);
 * // Returns: '1,234,567'
 *
 * @example
 * formatNumber(1234.56, 'de-DE');
 * // Returns: '1.234,56'
 */
function formatNumber(num, locale = 'en-US') {
  return num.toLocaleString(locale);
}
```

---

## Troubleshooting

### JSDoc Errors

**Error:** "Unable to parse a tag's type expression"
```javascript
// ❌ Invalid
@param {string|number|} value

// ✅ Valid
@param {string|number} value
```

**Error:** "Missing parameter name"
```javascript
// ❌ Invalid
@param {string}

// ✅ Valid
@param {string} value
```

### Documentation Not Updating

1. Clear old docs: `rm -rf docs/api`
2. Regenerate: `npm run docs:api`
3. Clear browser cache
4. Check JSDoc warnings in console

### Missing Documentation

Run audit to find undocumented code:
```bash
# Find files without @fileoverview
grep -r "^const\|^class\|^function" --include="*.js" Modules/ Internals/ | \
  grep -v "@fileoverview"
```

---

## Maintenance

### Weekly
- Review new modules for documentation
- Update examples if APIs change
- Check for broken links

### Monthly
- Regenerate all documentation
- Update COMMANDS.md with new commands
- Review and update API examples

### Per Release
- Update version numbers
- Generate complete documentation
- Verify all examples work
- Update CHANGELOG.md

---

## Resources

- [JSDoc Official Documentation](https://jsdoc.app/)
- [JSDoc Cheatsheet](https://devhints.io/jsdoc)
- [docdash Template](https://github.com/clenemt/docdash)

---

## Summary

- **Command Docs:** `npm run docs:commands`
- **API Docs:** `npm run docs:api`
- **All Docs:** `npm run docs:all`
- **View API Docs:** `npm run docs:serve`

Always document public APIs, include examples, and keep documentation up-to-date with code changes.
