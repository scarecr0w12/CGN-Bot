---
description: Specifications for the server activity scoring and ranking algorithms used across the platform
trigger: model_decision
---

# Activity Scoring Algorithm

The activity scoring system implements a weighted formula to calculate server engagement levels for ranking and categorization.

## Core Scoring Formula

**Importance Score: 90/100**

```
ActivityScore = (MessageScore * 0.5) + (VoiceScore * 0.3) + (EngagementScore * 0.2)

Where:
- MessageScore = Sum of time-weighted messages
- VoiceScore = Minutes * ParticipantMultiplier
- EngagementScore = Reactions + Emojis + ThreadBonus
```

### Base Activity Calculation
Path: `Web/controllers/activity.js`

```javascript
// Base formula
activityScore = (1.5 * memberCount) + (0.5 * messagesCount * (0.005 * memberCount))
```

- Activity decay factor: 0.95 per day of inactivity
- Weighted average across 7-day window
- Bonus multipliers for voice activity and unique member interactions

## Message Activity Weighting

**Importance Score: 85/100**

Time-weighted message frequency scoring:
- Recent messages (< 24h): weighted at **1.0x**
- Messages 1-7 days old: weighted at **0.7x**
- Messages > 7 days old: weighted at **0.3x**

Path: `Internals/SlashCommands/commands/points.js`

## Voice Channel Participation

**Importance Score: 80/100**

Path: `Internals/Events/voiceStateUpdate/Skynet.VoiceStateUpdate.js`

- Active voice minutes tracked with minimum thresholds
- Solo voice time: discounted by **0.5x**
- Multi-user voice channels: weighted at **1.0x**
- AFK channel time: **excluded** from calculations
- Voice activity weight multiplier: **1.5x**

## Server Engagement Metrics

**Importance Score: 75/100**

Path: `Web/controllers/activity.js`

| Metric | Points |
|--------|--------|
| Reaction usage | 0.2 points each |
| Custom emoji usage | 0.5 points each |
| Thread participation | 1.2x multiplier |
| Channel creation/management | Bonus points |

## Ranking System

**Importance Score: 70/100**

Path: `Web/controllers/dashboard/stats.js`

### Tier Thresholds
| Tier | Points Range |
|------|--------------|
| Bronze | 0 - 1,000 |
| Silver | 1,001 - 5,000 |
| Gold | 5,001 - 20,000 |
| Platinum | 20,000+ |

### Multi-Factor Rank Determination
- Raw activity score: **40% weight**
- Member engagement ratio: **35% weight**
- Growth rate: **25% weight**
- Weekly rank recalculation with smoothing

## Score Modifiers

| Modifier | Multiplier |
|----------|------------|
| Weekend activity bonus | 1.25x |
| Holiday event | 1.5x |
| Premium server boost | 1.1x |
| Inactive channel penalty | 0.75x |
| New member activity (first 24h) | 1.2x |

## Business Rules

1. Minimum **100 members** for rank eligibility
2. Activity scores cannot decrease by more than **15% per day**
3. Server must maintain minimum activity for **7 days** to qualify
4. Premium features unlock at specific activity score thresholds
5. Automatic tier demotion after **14 days** below threshold

## Key Files

- `Web/controllers/activity.js` - Server activity calculator
- `Web/controllers/stats.js` - Member activity tracker
- `Web/controllers/dashboard/stats.js` - Server rank calculator
- `Internals/Events/voiceStateUpdate/` - Voice activity tracking
