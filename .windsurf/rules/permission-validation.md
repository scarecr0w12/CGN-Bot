---
description: Discord permission validation patterns and security checks for bot operations
trigger: model_decision
globs: Internals/SlashCommands/**/*.js, Commands/**/*.js
---

# Permission Validation

**Added in v1.7.1 - Security audit of permission system**

**Importance Score: 85/100**

## Bot Permission Checks

### Pattern: Pre-Validation Before Operations

Always check if the bot has required permissions **before** attempting operations.

```javascript
// ✅ DO: Check bot permissions first
if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
        content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
        ephemeral: true,
    });
}

// Then perform operation
await channel.permissionOverwrites.edit(userId, permissions);

// ❌ DON'T: Attempt operation without checking
await channel.permissionOverwrites.edit(userId, permissions); // May fail silently
```

### Required Permissions by Operation

| Operation | Required Bot Permission |
|-----------|------------------------|
| Edit channel permission overwrites | `ManageRoles` |
| Lock/unlock channels | `ManageRoles` |
| Create/delete channels | `ManageChannels` |
| Manage voice states | `MuteMembers`, `DeafenMembers`, `MoveMembers` |
| Role assignment | `ManageRoles` |
| Verification systems | `ManageRoles` |

## User Permission Checks

### Slash Command Default Permissions

```javascript
// ✅ DO: Set appropriate default permissions
.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

// Examples:
// - Channel management: ManageChannels
// - Role management: ManageRoles
// - Moderation: ModerateMembers or BanMembers
```

### Runtime Permission Validation

```javascript
// ✅ DO: Validate user permissions at runtime
if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
        content: "❌ You need `Manage Channels` permission.",
        ephemeral: true,
    });
}
```

## Role Hierarchy Checks

### Pattern: Validate Role Position

```javascript
// ✅ DO: Check role hierarchy before operations
const botHighestRole = interaction.guild.members.me.roles.highest;
const targetRole = interaction.options.getRole('role');

if (targetRole.position >= botHighestRole.position) {
    return interaction.reply({
        content: "❌ I cannot manage roles equal to or higher than my highest role!",
        ephemeral: true,
    });
}

// ✅ DO: Check user's role position
const memberHighestRole = interaction.member.roles.highest;
if (targetRole.position >= memberHighestRole.position) {
    return interaction.reply({
        content: "❌ You cannot manage roles equal to or higher than your highest role!",
        ephemeral: true,
    });
}
```

## Channel Permission Overwrites

### Pattern: Voice Room Management

```javascript
// ✅ DO: Check bot permissions for voice operations
if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
        content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
        ephemeral: true,
    });
}

// Set voice room owner permissions
await voiceChannel.permissionOverwrites.edit(ownerId, {
    ViewChannel: true,
    Connect: true,
    ManageChannels: true,  // Voice room controls
    MuteMembers: true,
    DeafenMembers: true,
    MoveMembers: true,
});
```

### Pattern: Channel Lock/Unlock

```javascript
// ✅ DO: Use correct permission for channel operations
// channel.js uses ManageRoles to edit permission overwrites
const botPerms = interaction.channel.permissionsFor(interaction.guild.members.me);
if (!botPerms.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
        content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
        ephemeral: true,
    });
}

// Lock channel for @everyone
await interaction.channel.permissionOverwrites.edit(
    interaction.guild.roles.everyone,
    { SendMessages: false }
);
```

## Common Permission Issues Fixed in v1.7.1

### Issue: Channel Lock Commands Using Wrong Permission

**Before (Incorrect):**
```javascript
// ❌ DON'T: Lock/unlock required ManageChannels
.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
```

**After (Correct):**
```javascript
// ✅ DO: Use ManageRoles for permission overwrites
if (!botPerms.has(PermissionFlagsBits.ManageRoles)) {
    // Error handling
}
```

### Issue: Missing Bot Permission Validation

**Before (Missing Checks):**
```javascript
// ❌ DON'T: Assume bot has permissions
await voiceChannel.permissionOverwrites.edit(userId, permissions);
```

**After (With Validation):**
```javascript
// ✅ DO: Pre-validate bot permissions
if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("I need the **Manage Roles** permission...");
}
await voiceChannel.permissionOverwrites.edit(userId, permissions);
```

## Error Messages

### User-Friendly Permission Errors

```javascript
// ✅ DO: Provide clear, actionable error messages
return interaction.reply({
    content: "❌ I need the **Manage Roles** permission to modify channel permissions!",
    ephemeral: true,
});

// ✅ DO: Include what operation failed
throw new Error("I need the **Manage Roles** permission to verify members.");

// ❌ DON'T: Generic errors
throw new Error("Permission denied");
```

## Files with Permission Validation

| File | Validations |
|------|-------------|
| `Internals/SlashCommands/commands/voice.js` | Voice room management, ManageRoles checks |
| `Internals/SlashCommands/commands/channel.js` | Lock/unlock, ManageRoles checks |
| `Internals/SlashCommands/commands/server.js` | Server-wide operations, ManageRoles checks |
| `Internals/SlashCommands/commands/verify.js` | Verification system, ManageRoles checks |
| `Internals/SlashCommands/commands/role.js` | Role management, hierarchy checks |
| `Internals/SlashCommands/commands/roles.js` | Role panel system, ManageRoles checks |

## Best Practices

- **Always validate bot permissions before attempting operations**
- **Use ephemeral replies for permission errors**
- **Check role hierarchy for role management operations**
- **Provide clear error messages explaining what permission is needed**
- **Use `ManageRoles` for permission overwrites, not `ManageChannels`**
- **Set appropriate `setDefaultMemberPermissions()` on slash commands**
