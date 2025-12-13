---
layout: default
title: Extensions
nav_order: 4
parent: Guide
description: "Create and install extensions for SkynetBot"
permalink: /guide/extensions/
---

# Extensions Guide

Extensions add custom functionality to SkynetBot. Install community extensions or create your own.

---

## Overview

Extensions are sandboxed JavaScript modules that can:

- Add new commands
- React to messages
- Use Discord interactions (buttons, modals)
- Access the economy system
- Store persistent data

---

## Installing Extensions

### From Gallery

1. Go to Dashboard → Extensions → Gallery
2. Browse or search for extensions
3. Click "Install" on desired extension
4. Configure settings if needed

### From Package (.skypkg)

1. Go to Dashboard → Extensions → My Extensions
2. Click "Import Extension"
3. Upload the `.skypkg` file
4. Review and confirm import

---

## Creating Extensions

### Extension Builder

Use the built-in extension builder:

1. Go to `/extensions/builder`
2. Fill in extension details
3. Write your code
4. Test in sandbox
5. Save and submit for review

### Extension Structure

```javascript
// Extension metadata is set in the builder UI
// Your code starts here:

module.exports = {
  // Called when extension loads
  async init(context) {
    console.log('Extension loaded!');
  },

  // Handle commands
  async onCommand(context, command, args) {
    if (command === 'mycommand') {
      await context.reply('Hello from my extension!');
    }
  },

  // Handle messages (if scope granted)
  async onMessage(context, message) {
    // React to messages
  },

  // Handle interactions
  async onInteraction(context, interaction) {
    // Handle buttons, modals, etc.
  }
};
```

---

## Extension API

### Context Object

Every handler receives a `context` object:

```javascript
context.reply(text)           // Reply to command
context.send(channelId, text) // Send to channel
context.embed(options)        // Send embed
context.getUser(userId)       // Get user info
context.getServer()           // Get server info
context.storage.get(key)      // Get stored data
context.storage.set(key, val) // Store data
```

### Points Module

Access the economy system:

```javascript
const points = context.points;

// Get user's balance
const balance = await points.getBalance(userId);

// Add points
await points.add(userId, 100, 'Extension reward');

// Deduct points
await points.deduct(userId, 50, 'Extension purchase');

// Transfer points
await points.transfer(fromId, toId, amount);
```

### Discord Interactions

Create interactive elements:

```javascript
// Buttons
const button = context.button({
  id: 'my-button',
  label: 'Click Me',
  style: 'primary'
});

// Select menus
const select = context.selectMenu({
  id: 'my-select',
  placeholder: 'Choose...',
  options: [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' }
  ]
});

// Modals
const modal = context.modal({
  id: 'my-modal',
  title: 'Input Form',
  fields: [
    { id: 'name', label: 'Your Name', required: true }
  ]
});
```

### Slash Commands

Register slash commands:

```javascript
module.exports = {
  // Slash command definitions
  slashCommands: [
    {
      name: 'myslash',
      description: 'My slash command',
      options: [
        {
          name: 'input',
          description: 'Input text',
          type: 'STRING',
          required: true
        }
      ]
    }
  ],

  async onSlashCommand(context, interaction) {
    if (interaction.commandName === 'myslash') {
      const input = interaction.options.getString('input');
      await interaction.reply(`You said: ${input}`);
    }
  }
};
```

---

## Extension Scopes

Extensions must declare required scopes:

| Scope | Access |
|:------|:-------|
| `commands` | Register commands |
| `messages` | Read messages |
| `reactions` | Add reactions |
| `embeds` | Send embeds |
| `storage` | Persistent storage |
| `points` | Economy system |
| `users` | User information |
| `roles` | Role information |
| `channels` | Channel information |
| `interactions` | Buttons, modals, etc. |
| `slash_commands` | Slash commands |

Request only scopes you need - users see scope requirements before installing.

---

## Extension States

Extensions go through these states:

1. **Saved** - Draft, only visible to you
2. **Queue** - Submitted for review
3. **Gallery** - Approved and public
4. **Version Queue** - Update pending review

---

## Best Practices

### Security

- Never store sensitive data in code
- Validate all user input
- Use rate limiting for expensive operations
- Don't make external API calls without necessity

### Performance

- Avoid blocking operations
- Cache frequently used data
- Use storage efficiently
- Clean up old data

### User Experience

- Provide clear error messages
- Include help/usage information
- Use embeds for rich output
- Handle edge cases gracefully

---

## Example Extensions

### Simple Command

```javascript
module.exports = {
  async onCommand(context, command, args) {
    if (command === 'greet') {
      const name = args[0] || 'friend';
      await context.reply(`Hello, ${name}! 👋`);
    }
  }
};
```

### Economy Game

```javascript
module.exports = {
  async onCommand(context, command, args) {
    if (command === 'gamble') {
      const amount = parseInt(args[0]) || 10;
      const balance = await context.points.getBalance(context.userId);
      
      if (balance < amount) {
        return context.reply('Not enough points!');
      }
      
      const won = Math.random() > 0.5;
      
      if (won) {
        await context.points.add(context.userId, amount, 'Gamble win');
        await context.reply(`🎉 You won ${amount} points!`);
      } else {
        await context.points.deduct(context.userId, amount, 'Gamble loss');
        await context.reply(`😢 You lost ${amount} points!`);
      }
    }
  }
};
```

### Interactive Button Game

```javascript
module.exports = {
  async onCommand(context, command) {
    if (command === 'clickgame') {
      const button = context.button({
        id: 'click-me',
        label: 'Click Me!',
        style: 'success'
      });
      
      await context.reply({
        content: 'Click the button!',
        components: [button]
      });
    }
  },
  
  async onInteraction(context, interaction) {
    if (interaction.customId === 'click-me') {
      await context.points.add(interaction.user.id, 1, 'Button click');
      await interaction.reply('You earned 1 point! 🎯');
    }
  }
};
```

---

## Exporting & Sharing

### Export Extension

1. Go to My Extensions
2. Click "Export" on your extension
3. Download the `.skypkg` file
4. Share with others

### Package Format

```json
{
  "package_version": "1.0",
  "exported_at": "2025-01-01T00:00:00.000Z",
  "extension": {
    "name": "My Extension",
    "description": "Does cool things",
    "version": { "major": 1, "minor": 0 },
    "code": "module.exports = { ... }"
  },
  "source": {
    "original_id": "abc123",
    "original_owner": "user123"
  }
}
```

---

## Troubleshooting

### Extension Not Loading

- Check syntax errors in code
- Verify all required scopes are declared
- Check extension is enabled for server

### "Scope Not Allowed"

- Add required scope in extension builder
- Resubmit for review if changing scopes

### Storage Not Working

- Ensure `storage` scope is declared
- Check storage quota isn't exceeded
- Use valid key names

---

## Next Steps

- Browse the Extension Gallery on the dashboard
- Read the [API Reference](../api/)
- Check the EXTENSION_IDEAS.md in the repository
