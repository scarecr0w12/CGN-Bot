---
description: Specification for the Discord bot's server activity scoring and ranking algorithm implementation
trigger: model_decision
---

# === USER INSTRUCTIONS ===
---
description: Documentation of server activity scoring system logic and implementation
trigger: model_decision
---


# activity-scoring-algorithm

The activity scoring system implements a weighted formula to calculate server engagement levels:

## Core Scoring Components

### Activity Weight Calculation
- Message activity weight: 60%
- Member count metrics: 25% 
- Voice channel participation: 15%

The server activity score aggregates these weighted components using cross-server metrics for active/inactive status determination.

### Member Activity Metrics
Path: Web/controllers/activity.js
- Tracks individual member engagement scores
- Aggregates message frequency and timing patterns
- Monitors voice channel participation duration
- Custom server filtering and categorization logic for public listings

### Cross-Server Activity Aggregation
- Custom aggregation of metrics across multiple connected servers
- Active/inactive status determination based on threshold values
- Server categorization based on activity patterns

Importance Score: 75/100
The scoring algorithm provides essential business metrics for server health and engagement tracking.

Notable Implementations:
1. Weighted combination of member count and message activity
2. Cross-server metric aggregation
3. Server filtering and categorization logic

The system emphasizes message activity as the primary indicator while balancing member count and voice participation as supporting metrics.

$END$

 If you're using this file in context, clearly say in italics in one small line that "Context added by Giga activity-scoring-algorithm" along with specifying exactly what information was used from this file in a human-friendly way, instead of using kebab-case use normal sentence case.
# === END USER INSTRUCTIONS ===

# activity-scoring-algorithm

Server Activity Scoring System:

1. Message Activity Tracking
Path: Web/controllers/activity.js
- Server activity metric collection with customizable weighting
- Message frequency analysis across channels
- Active user participation scoring
Importance Score: 85

2. Server Activity Monitoring
- Public server listing with activity-based sorting
- Custom server filtering based on activity thresholds 
- Real-time activity metric updates
Importance Score: 75

3. Server Data Management 
Path: Web/controllers/dashboard/index.js
- Activity statistic processing for dashboard display
- Caching system for server activity data
- Server-specific configuration for activity tracking
Importance Score: 80

Core Activity Metrics:
- Message volume with channel-specific weights
- Active user participation rates
- Server engagement scores
- Public visibility ranking
- Custom filtering algorithms

The system places emphasis on accurate activity measurement while providing server administrators with customizable tracking options and public visibility controls.

$END$

 If you're using this file in context, clearly say in italics in one small line that "Context added by Giga activity-scoring-algorithm" along with specifying exactly what information was used from this file in a human-friendly way, instead of using kebab-case use normal sentence case.