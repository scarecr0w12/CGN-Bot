# TypeScript Integration Guide

**Version:** 1.7.2  
**Phase:** 4A - TypeScript Definitions  
**Status:** Complete

## Overview

CGN-Bot now includes comprehensive TypeScript type definitions for improved IDE support, autocomplete, and type safety without requiring the project to be rewritten in TypeScript.

---

## Benefits

### For JavaScript Developers

Even if you write plain JavaScript, these type definitions provide:

1. **IntelliSense**: VSCode shows function signatures and documentation
2. **Autocomplete**: See available methods and properties as you type
3. **Inline Documentation**: Hover over functions to see JSDoc comments
4. **Error Detection**: Catch typos and incorrect usage before runtime
5. **Refactoring**: Safely rename variables and functions

### For TypeScript Developers

Full type safety when importing CGN-Bot modules:

```typescript
import { cacheEvents } from './Modules/CacheEvents';
import type { ServerDocument } from './types';

// TypeScript validates everything
cacheEvents.onInvalidate('server:*:config', (key, data) => {
  // data is typed as CacheInvalidationData
  console.log(data.serverId); // ✅ TypeScript knows this exists
});
```

---

## Quick Start

### 1. VSCode Configuration

Create or update `.vscode/settings.json`:

```json
{
  "javascript.suggest.autoImports": true,
  "typescript.suggest.autoImports": true,
  "javascript.validate.enable": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 2. Enable Type Checking (Optional)

For JavaScript files with type checking:

```javascript
// @ts-check

const { cacheEvents } = require('./Modules/CacheEvents');

// TypeScript will now validate this file!
cacheEvents.invalidate('server:123:config', {
  reason: 'config updated',
  serverId: '123' // TypeScript validates this structure
});
```

### 3. Using Types in JavaScript

```javascript
/**
 * Get server configuration
 * @param {string} serverId
 * @returns {Promise<import('./types').ServerDocument | null>}
 */
async function getServerConfig(serverId) {
  const server = await Servers.findOne(serverId);
  
  if (!server) return null;
  
  // VSCode now provides autocomplete for server.config.*
  return server;
}
```

---

## Available Types

### Core Database Types

```typescript
import type {
  ServerDocument,
  UserDocument,
  ExtensionDocument,
  Model,
  Document,
  Cursor
} from './types';
```

**Usage:**
```javascript
/** @type {Model<ServerDocument>} */
const Servers = global.Servers;

const server = await Servers.findOne('123456789');
// TypeScript knows: server.config.commandPrefix exists
```

### Phase 2 Module Types

#### CacheEvents

```typescript
import type {
  CacheInvalidationData,
  CacheEventsStats
} from './types';

import { cacheEvents } from './Modules/CacheEvents';
```

**Example:**
```javascript
cacheEvents.onInvalidate('user:*:profile', (key, data) => {
  // data is typed as CacheInvalidationData
  console.log(`User ${data.userId} profile invalidated`);
});
```

#### CommandExecutor

```typescript
import type {
  CommandObject,
  ValidationResult,
  ExecutionResult
} from './types';

import CommandExecutor from './Internals/CommandExecutor';
```

**Example:**
```javascript
/** @type {CommandObject} */
const myCommand = {
  name: 'test',
  permissions: ['ADMINISTRATOR'], // Autocomplete!
  cooldown: 5
};
```

#### CommandMiddleware

```typescript
import type { MiddlewareFunction } from './types';
import { CommandMiddleware } from './Internals/CommandMiddleware';
```

**Example:**
```javascript
/** @type {MiddlewareFunction} */
const customMiddleware = async (context, next) => {
  console.log('Before');
  await next();
  console.log('After');
};
```

### Web Types

```typescript
import type {
  DashboardRequest,
  SkynetResponse,
  GetGuildResult
} from './types';
```

### Extension Types

```typescript
import type {
  SandboxContext,
  ExtensionScope,
  SerializedMessage,
  SerializedInteraction
} from './types';
```

---

## IDE Setup

### VSCode

**Recommended Extensions:**
- ESLint
- JavaScript and TypeScript Nightly

**Auto Import Configuration:**

VSCode automatically provides:
- Autocomplete for module exports
- Function signature hints
- Parameter documentation
- Type information on hover

### WebStorm / IntelliJ

Type definitions work automatically. Enable:
- **Settings → Languages → JavaScript → Code Quality Tools → ESLint**
- **Settings → Editor → Code Completion → Show suggestions on typing**

---

## Type Checking

### Check Types Without Building

```bash
npm run types:check
```

This validates type usage without generating .d.ts files.

### Enable Type Checking Per File

Add `// @ts-check` at the top of any JavaScript file:

```javascript
// @ts-check

const { cacheEvents } = require('./Modules/CacheEvents');

cacheEvents.invalidate('server:123:config', {
  reason: 'test',
  userId: 123 // ❌ Error: userId should be string!
});
```

### JSConfig for Project-Wide Type Checking

Create `jsconfig.json`:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": false
  },
  "include": ["**/*.js"],
  "exclude": ["node_modules"]
}
```

---

## Examples

### Example 1: Cache Events

```javascript
// @ts-check

const { cacheEvents, invalidateServerCaches } = require('./Modules/CacheEvents');

// Register handler with type safety
cacheEvents.onInvalidate('server:*:config', (key, data) => {
  console.log(`Invalidated: ${key}`);
  // VSCode shows: data has properties serverId, reason, etc.
});

// Invalidate with autocomplete
invalidateServerCaches('123456789', [
  'config',      // ✅ Autocomplete suggests valid types
  'permissions',
  'roles'
]);
```

### Example 2: Command Definition

```javascript
// @ts-check

/** @type {import('./types').CommandObject} */
const kickCommand = {
  name: 'kick',
  permissions: ['KICK_MEMBERS'], // Autocomplete works!
  botPermissions: ['KICK_MEMBERS'],
  guildOnly: true,
  cooldown: 3,
  args: [
    { name: 'user', type: 'string', required: true },
    { name: 'reason', type: 'string', required: false }
  ],
  async execute(message, args) {
    // args is typed based on the definition
    const user = args.user;
    const reason = args.reason || 'No reason provided';
  }
};

module.exports = kickCommand;
```

### Example 3: Database Operations

```javascript
// @ts-check

/**
 * Update server configuration
 * @param {string} serverId
 * @param {Partial<import('./types').ServerConfig>} updates
 */
async function updateServerConfig(serverId, updates) {
  const server = await Servers.findOne(serverId);
  
  if (!server) {
    throw new Error('Server not found');
  }
  
  // TypeScript validates updates structure
  server.query.set('config.commandPrefix', updates.commandPrefix);
  server.query.set('config.language', updates.language);
  
  await server.save();
}
```

### Example 4: Middleware Chain

```javascript
// @ts-check

const { CommandMiddleware, loggingMiddleware } = require('./Internals/CommandMiddleware');

/** @type {import('./types').MiddlewareFunction} */
const timingMiddleware = async (context, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`Command took ${duration}ms`);
};

const middleware = new CommandMiddleware();
middleware.use(loggingMiddleware, 10);
middleware.use(timingMiddleware, 20);

// Execute with type-safe context
async function runCommand(context) {
  const result = await middleware.execute(context);
  
  if (!result.continue) {
    console.error(result.error); // TypeScript knows error exists
  }
}
```

---

## Common Patterns

### Pattern 1: Type-Safe Event Handlers

```javascript
// @ts-check

const { cacheEvents } = require('./Modules/CacheEvents');

/**
 * @param {string} key
 * @param {import('./types').CacheInvalidationData} data
 */
function handleInvalidation(key, data) {
  console.log(`${key} invalidated: ${data.reason}`);
}

cacheEvents.onInvalidate('*', handleInvalidation);
```

### Pattern 2: Generic Database Queries

```javascript
// @ts-check

/**
 * Find document by ID with type safety
 * @template T
 * @param {import('./types').Model<T>} model
 * @param {string} id
 * @returns {Promise<import('./types').Document<T> | null>}
 */
async function findById(model, id) {
  return await model.findOne(id);
}

// Usage with autocomplete
const server = await findById(Servers, '123');
const user = await findById(Users, '456');
```

### Pattern 3: Command Validation

```javascript
// @ts-check

const CommandExecutor = require('./Internals/CommandExecutor');

/**
 * @param {import('./types').CommandObject} command
 * @param {any} context
 * @returns {Promise<boolean>}
 */
async function isCommandValid(command, context) {
  const executor = new CommandExecutor(global.bot);
  
  const permCheck = executor.validatePermissions(command, context);
  if (!permCheck.valid) return false;
  
  const contextCheck = executor.validateContext(command, context);
  if (!contextCheck.valid) return false;
  
  return true;
}
```

---

## Troubleshooting

### Issue: No Autocomplete

**Solution:**
1. Restart VSCode/IDE
2. Check `package.json` has `"types": "./types/index.d.ts"`
3. Verify `types/index.d.ts` exists
4. Enable JavaScript language features in IDE settings

### Issue: Types Not Found

**Solution:**
```javascript
// Use explicit import type
/** @type {import('./types').ServerDocument} */
let server;

// Or import at file level
/**
 * @typedef {import('./types').ServerDocument} ServerDocument
 * @typedef {import('./types').UserDocument} UserDocument
 */
```

### Issue: Conflicting Types

**Solution:**
- Clear TypeScript cache: Delete `.tsbuildinfo` files
- Restart IDE
- Run `npm run types:check` to identify conflicts

---

## Best Practices

### DO:
- ✅ Use `@type` annotations for complex objects
- ✅ Import types for function parameters
- ✅ Enable `// @ts-check` for critical files
- ✅ Use autocomplete to discover available properties
- ✅ Check types before committing with `npm run types:check`

### DON'T:
- ❌ Use `@ts-ignore` to suppress errors (fix the type instead)
- ❌ Define duplicate types (use existing ones from `./types`)
- ❌ Cast types with `/** @type {any} */` (defeats purpose)

---

## Migration Path

### Level 1: No Changes Required

Your existing JavaScript works as-is with autocomplete.

### Level 2: Add Type Hints

```javascript
/** @type {import('./types').ServerDocument} */
let server;
```

Gain autocomplete without changing logic.

### Level 3: Enable Type Checking

```javascript
// @ts-check
```

Catch errors before runtime.

### Level 4: Full TypeScript (Optional)

Rename `.js` to `.ts` and use full TypeScript features.

---

## Type Definition Locations

| Module | Type Location |
|--------|---------------|
| Database | `types/index.d.ts` (ServerDocument, UserDocument, etc.) |
| CacheEvents | `types/index.d.ts` (CacheInvalidationData, etc.) |
| CommandExecutor | `types/index.d.ts` (CommandObject, ValidationResult, etc.) |
| CommandMiddleware | `types/index.d.ts` (MiddlewareFunction, etc.) |
| NetworkValidator | `types/index.d.ts` (UrlValidationResult, etc.) |
| Serializers | `types/index.d.ts` (SerializedMessage, etc.) |
| Web | `types/index.d.ts` (DashboardRequest, etc.) |
| Logger | `Internals/Logger.d.ts` |

---

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run types:check` | Validate type usage without building |
| `npm run types:generate` | Generate .d.ts files (currently manual) |

---

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [VSCode JavaScript Language Features](https://code.visualstudio.com/docs/languages/javascript)

---

## Summary

TypeScript definitions provide:
- **Zero Runtime Cost**: Types are compile-time only
- **Gradual Adoption**: Add types file-by-file
- **Better DX**: Autocomplete, inline docs, error detection
- **No Rewrite Required**: Keep using JavaScript

**Quick Start:**
1. Open any file in VSCode
2. Start typing `cacheEvents.` → See autocomplete!
3. Hover over functions → See documentation!
4. Add `// @ts-check` → Get type validation!

**That's it!** Types are already working. No build step, no configuration needed.
