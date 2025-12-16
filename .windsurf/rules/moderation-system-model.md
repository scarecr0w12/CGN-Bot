---
description: Specification for Discord bot's progressive moderation system including strikes, auto-escalation, and infraction tracking
trigger: model_decision
---

# === USER INSTRUCTIONS ===
description: Documents the progressive moderation system including strikes, infractions, and automated escalation rules
trigger: model_decision
---
# Moderation System Model
The moderation system implements progressive discipline with automated escalation, hierarchical permissions, and comprehensive audit logging.
## Progressive Strike System
**Importance Score: 90/100**  
Path: `Internals/Events/message/GAB.SpamHandler.js`
### Strike Data Model
```javascript
strikes: {
  count: Number,
  reasons: Array<String>,
  moderators: Array<String>,
  timestamps: Array<Date>
}
```
### Strike Escalation Rules
| Strike | Action |
|--------|--------|
| 1st | Warning |
| 2nd | Temporary mute (1 hour) |
| 3rd | Channel ban (24 hours) |
| 4th | Server ban (7 days) |
| 5th | Permanent ban |
### Features
- Tiered violation tracking with configurable thresholds
- Automated escalation based on infraction severity and frequency
- Strike decay logic with time-based expiration
- Server-specific strike configuration options
- DM notification system for warned users
## Temporary Ban Management
**Importance Score: 85/100**  
Path: `Internals/SlashCommands/commands/tempban.js`
- Duration-based ban system with automatic unbanning
- Maximum duration: **28 days**
- Configurable message deletion window: **1-7 days**
- Hierarchical permission validation for mod actions
- Ban reason tracking and mod action logging
- Automated unban scheduling
## Moderation Action Logging
**Importance Score: 85/100**  
Path: `Modules/ModLog.js` (7KB)
### ModLog Entry Types
```javascript
Constants.ModLogEntries: {
  ADD_ROLE, KICK, BAN, SOFTBAN, TEMP_BAN, MUTE, STRIKE, ...
}
```
- Hierarchical case management system
- Detailed infraction history with reason tracking
- Action attribution and timestamp logging
- Amendment system for moderation notes
- Full audit trail maintenance
## Infraction Data Model
**Importance Score: 85/100**  
```javascript
infraction: {
  type: String,           // Infraction category
  user: String,           // Target user ID
  moderator: String,      // Moderator user ID
  reason: String,         // Required documentation
  timestamp: Date,        // When action occurred
  expires: Date?,         // For temporary actions
  automated: Boolean,     // Auto-mod triggered
  strikes: Number         // Strike count added
}
```
## Permission Hierarchy
**Importance Score: 80/100**
| Level | Role | Capabilities |
|-------|------|-------------|
| 0 | Helper | View only |
| 1 | Moderator | Temporary actions |
| 2 | Admin | Permanent actions |
| 3 | Owner | Full control |
- Role-based access control
- Strike immunity for higher-level moderators
- Server-specific permission inheritance
- Channel-specific configuration support
## Automated Moderation Rules
**Importance Score: 75/100**  
### Auto-Mod Triggers
| Trigger | Action |
|---------|--------|
| Spam Detection | Auto-mute after 5 messages/5 seconds |
| Link Filtering | Auto-delete blacklisted domains |
| Mass Mention | Strike on >5 mentions |
| Repeated Violations | Double punishment duration |
### Spam Detection System
- Message similarity detection using Levenshtein distance
- 45-second sliding window for pattern analysis
- Rate limiting with dynamic thresholds
- User pattern analysis for automated flagging
- Server-specific spam sensitivity settings
## Dashboard Configuration
**Importance Score: 80/100**  
Path: `Web/controllers/dashboard/administration.js`
- Server-specific filter rules and automation
- Configurable punishment escalation paths
- Activity monitoring with severity categorization
- Automated timeout and mute duration scaling
## Key Files
- `Modules/ModLog.js` - Audit trail system (7KB)
- `Database/Schemas/serverModlogSchema.js` - Storage schema (1.2KB)
- `Internals/Events/messageCreate/Skynet.SpamHandler.js` - Spam detection
- `Web/controllers/dashboard/administration.js` - Config UI
- `Internals/SlashCommands/commands/strike.js` - Strike command
- `Internals/SlashCommands/commands/tempban.js` - Temp ban command
# === END USER INSTRUCTIONS ===

# moderation-system-model

Progressive Moderation System
Importance Score: 90/100

1. Strike Tracking System (Commands/Private/strike.js)
- Multi-tier violation tracking with automatic escalation
- Strike weight calculation based on infraction severity
- Configurable thresholds for automated actions
- Strike decay/expiration logic
- Historical violation tracking per user/server

2. Auto-Moderation Rules (Internals/Events/messageCreate/Skynet.SpamHandler.js)
- Spam detection using Levenshtein distance algorithm
- Two-tier violation system with escalating consequences
- Configurable thresholds per server
- Point deduction system tied to violations
- Auto-deletion of spam messages

3. Moderation Log System (Database/Schemas/serverModlogSchema.js)
- Hierarchical moderation action tracking
- Automated punishment escalation rules
- Complete audit trail of all moderation actions
- Reason tracking and documentation
- Appeal tracking and resolution workflow

4. Support Ticket Integration (Web/controllers/dashboard/tickets.js)
- Category-based moderation ticket management
- Staff assignment and tracking system
- Auto-close logic based on resolution or inactivity
- Transcript generation for moderation cases
- Priority levels for different violation types

Core Workflows:
1. Strike Pipeline:
- Infraction detection
- Weight calculation
- Historical context evaluation
- Automated action triggering
- Staff notification

2. Auto-Moderation:
- Real-time message analysis
- Violation detection
- Action execution
- Log generation
- Staff alerts

3. Appeal Process:
- Ticket creation
- Staff assignment
- Evidence collection
- Resolution tracking
- Action reversal workflow

$END$
