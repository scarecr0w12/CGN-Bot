# @cgn-bot/extension-sdk

Official SDK for developing CGN-Bot extensions with TypeScript support, testing framework, and CLI tools.

## Installation

```bash
npm install @cgn-bot/extension-sdk
```

## Quick Start

### Create a Command Extension

```typescript
import { ExtensionBuilder } from '@cgn-bot/extension-sdk';

const helloExtension = ExtensionBuilder
  .command('Hello Command', 'hello')
  .description('Says hello to the user')
  .version('1.0.0')
  .author('Your Name', 'your-discord-id')
  .addScope('send_messages')
  .usageHelp('!hello')
  .execute(async (context) => {
    await context.msg.channel.send(`Hello, ${context.msg.author.username}!`);
    return { success: true };
  })
  .build();

// Export for upload
console.log(helloExtension.toCode());
```

### Create an Event Extension

```typescript
import { ExtensionBuilder } from '@cgn-bot/extension-sdk';

const welcomeExtension = ExtensionBuilder
  .event('Welcome Message', 'guildMemberAdd')
  .description('Welcomes new members')
  .version('1.0.0')
  .author('Your Name')
  .addScope('send_messages')
  .execute(async (context) => {
    const member = context.event.member;
    const channel = context.guild.channels.find(c => c.name === 'welcome');
    
    if (channel) {
      await channel.send(`Welcome to the server, ${member.user.username}!`);
    }
    
    return { success: true };
  })
  .build();
```

### Testing Your Extension

```typescript
import { ExtensionTester, MockContextBuilder } from '@cgn-bot/extension-sdk/testing';

const tester = ExtensionTester.for(helloExtension);

tester.addTest({
  name: 'should send hello message',
  context: MockContextBuilder
    .command('hello')
    .message({ author: { username: 'testuser' } })
    .build(),
  expect: {
    success: true,
  },
});

const { passed, failed, results } = await tester.test();
console.log(`Tests: ${passed}/${passed + failed} passed`);
```

## Features

- **TypeScript Support**: Full type definitions for all extension APIs
- **Fluent Builder API**: Easy-to-use builder pattern for creating extensions
- **Testing Framework**: Built-in testing utilities with mocking
- **Validation**: Automatic validation of extension metadata
- **Type Safety**: Compile-time checks for scopes, events, and fields

## Extension Types

### Command Extensions
Triggered by a specific command key (e.g., `!hello`)

```typescript
ExtensionBuilder
  .command('My Command', 'mycommand')
  .execute(async (context) => {
    // Access message: context.msg
    // Access config: context.config
    return { success: true };
  })
  .build();
```

### Keyword Extensions
Triggered when a message contains specific keywords

```typescript
ExtensionBuilder
  .keyword('Keyword Handler', ['keyword1', 'keyword2'])
  .caseSensitive(false)
  .execute(async (context) => {
    // React to messages containing keywords
    return { success: true };
  })
  .build();
```

### Event Extensions
Triggered by Discord events

```typescript
ExtensionBuilder
  .event('Event Handler', 'messageDelete')
  .execute(async (context) => {
    // Access event data: context.event
    return { success: true };
  })
  .build();
```

## Available Scopes

Extensions must declare the permissions (scopes) they require:

### Moderation
- `ban` - Ban members
- `kick` - Kick members
- `mute` - Mute members
- `warn` - Issue warnings

### Roles
- `manage_roles` - Manage roles and assignments
- `create_role` - Create new roles
- `delete_role` - Delete roles

### Channels
- `manage_channels` - Modify channel settings
- `create_channel` - Create channels
- `delete_channel` - Delete channels

### Messages
- `send_messages` - Send messages in all channels
- `delete_messages` - Delete messages
- `pin_messages` - Pin/unpin messages

### Network
- `network_allowlist_only` - HTTPS requests to allowlisted domains
- `network` - HTTPS requests to any domain
- `network_advanced` - HTTP/HTTPS with advanced features

### Data
- `storage` - Persistent key-value storage (25KB limit)
- `database_read` - Read guild database
- `database_write` - Write to guild database

## Extension Storage

Extensions have access to persistent storage:

```typescript
.execute(async (context) => {
  // Write data
  await context.storage.write('counter', 5);
  
  // Read data
  const counter = context.storage.get('counter');
  
  // Delete data
  await context.storage.delete('counter');
  
  // Clear all
  await context.storage.clear();
  
  return { success: true };
})
```

**Storage Limits:**
- Maximum size: 25KB
- JSON-serializable values only

## Configuration Fields

Add user-configurable options to your extension:

```typescript
.addField({
  name: 'welcomeChannel',
  label: 'Welcome Channel',
  type: 'string',
  required: true,
  description: 'Channel name for welcome messages',
})
.addField({
  name: 'enableLogging',
  label: 'Enable Logging',
  type: 'boolean',
  default: true,
})
.execute(async (context) => {
  const channel = context.config.welcomeChannel;
  const logging = context.config.enableLogging;
  // Use config values...
})
```

**Field Types:**
- `string` - Text input
- `number` - Numeric input
- `boolean` - Checkbox
- `select` - Dropdown (single choice)
- `multiselect` - Multiple choice

## Testing

### Basic Testing

```typescript
import { ExtensionTester, MockContextBuilder } from '@cgn-bot/extension-sdk/testing';

const tester = ExtensionTester.for(myExtension);

tester.addTest({
  name: 'test case name',
  context: MockContextBuilder.command('test').build(),
  expect: {
    success: true,
  },
  timeout: 5000,
});

await tester.test();
```

### Mock Context

```typescript
import { MockContextBuilder, createMockGuild, createMockMessage } from '@cgn-bot/extension-sdk/testing';

const context = MockContextBuilder
  .command('mycommand')
  .guild(createMockGuild({ name: 'Test Server' }))
  .message(createMockMessage({ content: 'test message' }))
  .config({ welcomeChannel: 'general' })
  .build();
```

### Test Suites

```typescript
import { TestRunner } from '@cgn-bot/extension-sdk/testing';

const runner = new TestRunner();

runner.addSuite({
  name: 'My Extension Tests',
  extensions: [extension1, extension2],
  setup: async () => {
    // Setup code
  },
  teardown: async () => {
    // Cleanup code
  },
});

const allPassed = await runner.test();
```

## Utilities

### Validation

```typescript
import { validateMetadata, validateField } from '@cgn-bot/extension-sdk/utils';

const { valid, errors } = validateMetadata(extension.metadata);
if (!valid) {
  console.error('Validation errors:', errors);
}
```

### Scope Descriptions

```typescript
import { getScopeDescriptions } from '@cgn-bot/extension-sdk/utils';

const descriptions = getScopeDescriptions(['ban', 'kick']);
// [{ scope: 'ban', description: '...' }, ...]
```

## Constants

```typescript
import { ALLOWED_EVENTS, EXTENSION_SCOPES, STORAGE_LIMITS, NETWORK_LIMITS } from '@cgn-bot/extension-sdk';

console.log('Max storage:', STORAGE_LIMITS.MAX_SIZE); // 25000 bytes
console.log('Request timeout:', NETWORK_LIMITS.TIMEOUT_MS); // 6000ms
```

## Examples

See the `examples/` directory for complete extension examples:
- `hello-command.ts` - Simple command extension
- `welcome-bot.ts` - Event-based extension with storage
- `role-manager.ts` - Advanced role management
- `keyword-response.ts` - Keyword-triggered extension

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## API Reference

Full API documentation: https://docs.cgnbot.com/extension-sdk

## License

MIT © CGN-Bot

## Contributing

Contributions welcome! Please see CONTRIBUTING.md

## Support

- Documentation: https://docs.cgnbot.com
- Discord: https://discord.gg/cgnbot
- Issues: https://github.com/scarecr0w12/CGN-Bot/issues
