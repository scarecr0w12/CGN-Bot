---
description: Scaffold a new Discord slash command with proper structure and registration
---

# Add New Slash Command

## Prerequisites
- Command name and description defined
- Target category: Public, PM, Private, or Shared

## Steps

1. Determine the command category and read the base template:
// turbo
```bash
cat /root/bot/Commands/Public/_base.js
```

2. Create the new command file at `Commands/<Category>/<command-name>.js` with this structure:

```javascript
module.exports = async(bot, db, config, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix, commandData) => {
    // Command implementation
};

module.exports.info = {
    name: "<command-name>",
    usage: "<command-name> [options]",
    description: "<description>",
    category: "<category>",
    defaults: {
        adminLevel: 0,          // 0 = everyone, 1-4 = admin levels
        isNSFW: false,
        cooldown: 5000,         // milliseconds
    },
    slashOptions: [
        // Add slash command options here if needed
        // { type: "STRING", name: "input", description: "Input text", required: false }
    ],
};
```

3. Register the command in `Configurations/commands.js`:
// turbo
```bash
grep -n "public:" /root/bot/Configurations/commands.js | head -5
```

4. Add the command to the appropriate array in `Configurations/commands.js`

5. Restart the bot to register the new slash command:
```bash
docker restart skynetbot
```

6. Verify command registration in logs:
// turbo
```bash
docker logs skynetbot 2>&1 | grep -i "command" | tail -10
```

## Slash Command Option Types
- `STRING` - Text input
- `INTEGER` - Whole number
- `BOOLEAN` - True/false
- `USER` - Discord user mention
- `CHANNEL` - Channel selection
- `ROLE` - Role selection
- `NUMBER` - Decimal number
