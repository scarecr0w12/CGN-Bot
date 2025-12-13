# Premium Extensions System - Planning Document

## Executive Summary

This document outlines the plan to build a comprehensive "Premium Extensions" marketplace system. Any user who creates an extension can mark it as premium, set a point-based price, and earn points when other users purchase their extensions. These earned points can be used to purchase premium tiers for their own servers or to acquire other premium extensions.

> **Terminology Note**: Throughout this document, "developer" simply refers to any user who has created an extension. There is no separate "developer account" - all users can create extensions and earn from them using their standard account.

---

## Current State Analysis

### Existing Systems That Will Be Leveraged

#### 1. Vote Rewards Points System (Primary Currency)

- **Location**: `Modules/VoteRewardsManager.js`, `Database/Schemas/userSchema.js`
- **Balance Field**: `userDocument.vote_rewards.balance`
- **This is SEPARATE from SkynetPoints** (`userDocument.points` - used for upvoting/trivia)
- **Earning Methods**:
  - Voting on bot lists (top.gg, discordbotlist) - configurable points per vote
  - Direct purchase with money (Stripe/BTCPay)
- **Existing Functions**:
  - `addPoints(userId, amount, type, metadata)` - Add points to user
  - `deductPoints(userId, amount, type, metadata)` - Remove points from user
  - `getBalance(userId)` - Get current balance
  - `getTransactionHistory(userId, limit)` - Transaction log
- **Transaction Tracking**: `Database/VoteRewardTransactions` collection

#### 2. Partial Premium Extension Support (Already Exists!)

- **Location**: `Database/Schemas/gallerySchema.js`
- **Existing Schema Fields**:

  ```javascript
  premium: {
    is_premium: Boolean,      // Whether extension is premium
    price_points: Number,     // Point cost to purchase
    purchases: Number,        // Total purchase count
  },
  purchased_by: [String],     // User IDs who have purchased
  ```

- **Existing Functions** in `VoteRewardsManager.js`:
  - `redeemForExtension(userId, extensionId)` - Purchase a premium extension
  - `hasUserPurchasedExtension(userId, extensionId)` - Check if user owns it

> **Gap Identified**: The existing `redeemForExtension()` deducts points from the buyer and increments `premium.purchases`, but does NOT credit the extension creator. Points currently "disappear" (platform keeps 100%). This function needs to be expanded to split revenue between platform and creator.

#### 3. Payment Systems

- **Stripe**: Subscription checkout, point purchases
- **BTCPay**: Cryptocurrency payments for subscriptions and points
- **Location**: `Web/controllers/membership.js`, `Web/controllers/webhooks.js`
- **Vote Points Purchase**: `Web/routes/account.js` - `/account/vote-rewards/purchase`

#### 4. Extension Gallery System

- **Location**: `Web/controllers/extensions.js`, `Database/Schemas/gallerySchema.js`
- **States**: `saved` → `queue` → `gallery` (or `version_queue`)
- **Installation Flow**: Gallery → Install Page → Server Dashboard
- **Server Storage**: `serverDocument.extensions[]` (via `serverGallerySchema.js`)

#### 5. Tier/Membership System

- **Location**: `Modules/TierManager.js`
- **Already supports**: `redeemForTier(userId, serverId, tierId, durationDays)`
- Premium is per-server, not per-user

---

## What Needs To Be Built

### Phase 1: Developer Earnings System

#### 1.1 Schema Changes

**gallerySchema.js - Add Developer Earnings Tracking**:

```javascript
premium: {
  is_premium: Boolean,
  price_points: Number,
  purchases: Number,
  // NEW FIELDS:
  developer_earnings: {
    type: Number,
    default: 0,        // Total points earned by developer
  },
  revenue_share: {
    type: Number,
    default: 70,       // Developer gets 70% of sale price
    min: 0,
    max: 100,
  },
  lifetime_revenue: {
    type: Number,
    default: 0,        // Total points ever earned (before withdrawals)
  },
},
// Track individual purchases with timestamps
purchase_history: [new Schema({
  user_id: String,
  purchased_at: Date,
  points_paid: Number,
  extension_creator_share: Number,
})],
```

**userSchema.js - Add Extension Earnings Tracking**:

```javascript
// Extension earnings (for any user who creates extensions)
// NOT a separate account type - all users can earn from extensions
extension_earnings: new Schema({
  balance: {
    type: Number,
    default: 0,        // Points available to withdraw/use
  },
  lifetime_earned: {
    type: Number,
    default: 0,        // Total ever earned from extension sales
  },
  total_withdrawn: {
    type: Number,
    default: 0,        // Total withdrawn to vote_rewards balance
  },
}),
```

**siteSettingsSchema.js - Add Marketplace Settings**:

```javascript
premium_extensions: new Schema({
  isEnabled: {
    type: Boolean,
    default: false,
  },
  default_revenue_share: {
    type: Number,
    default: 70,       // Platform takes 30%, extension creator gets 70%
  },
  min_price_points: {
    type: Number,
    default: 100,      // Minimum extension price
  },
  max_price_points: {
    type: Number,
    default: 100000,   // Maximum extension price
  },
  approval_required: {
    type: Boolean,
    default: true,     // Maintainers must approve premium pricing
  },
}),
```

#### 1.2 New Module: PremiumExtensionsManager.js

**Location**: `Modules/PremiumExtensionsManager.js`

**Core Functions**:

```javascript
// Set extension as premium (by extension creator)
setPremiumStatus(extensionId, ownerId, pricePoints, isPremium)

// Purchase extension (deduct from buyer, credit to extension creator)
purchaseExtension(buyerUserId, extensionId)

// Get user's extension earnings balance
getExtensionEarnings(userId)

// Withdraw extension earnings to vote_rewards balance
withdrawEarnings(userId, amount)

// Get user's created extensions with earnings stats
getUserExtensions(userId)

// Get marketplace stats (for maintainer console)
getMarketplaceStats()

// Check if server can install premium extension
canServerInstallExtension(serverId, extensionId, installerUserId)
```

#### 1.3 Database Migration

Create migration: `Database/migrations/XXX_add_premium_extensions.sql`

- Add new columns to gallery table
- Add extension_earnings fields to users table
- Create purchase_history table/collection

---

### Phase 2: Extension Creator UI

> Any user can create extensions - these UI updates apply to the standard extension builder available to all users.

#### 2.1 Extension Builder Updates

**File**: `Web/views/pages/extensions.ejs` (mode: "builder")

> Note: The extension builder uses the same `extensions.ejs` template with different modes. The gallery extension builder is accessed at `/extensions/builder`.

**Add Premium Settings Section**:

- Toggle: "Mark as Premium Extension"
- Input: Price in Points (with min/max validation)
- Display: Estimated extension creator earnings (after platform fee)
- Note: "Premium extensions require maintainer approval"

#### 2.2 My Extensions Page Updates

**File**: `Web/views/pages/extensions.ejs` (mode: "my")

> Note: The "My Extensions" page reuses `extensions.ejs` with mode="my". Accessed at `/extensions/my`.

**Add Earnings Dashboard** (visible to any user who has created extensions):

- Total Extension Earnings Balance (available to withdraw)
- Lifetime Earnings
- Per-extension breakdown:
  - Extension name
  - Price
  - Total purchases
  - Revenue earned
- "Withdraw to Vote Balance" button

#### 2.3 New API Endpoints

**Routes**: `Web/routes/account.js`

```javascript
// Get extension earnings data (for any user with extensions)
GET /account/extensions/earnings

// Set extension premium status
POST /extensions/:extid/premium

// Withdraw extension earnings to vote_rewards balance
POST /account/extensions/withdraw

// Get extension sales history
GET /extensions/:extid/sales
```

---

### Phase 3: Buyer UI - Gallery & Installation

#### 3.1 Gallery Page Updates

**File**: `Web/views/pages/extensions.ejs` (mode: "gallery")

**Display Premium Indicators**:

- Premium badge/icon on extension cards
- Price display in points
- "Purchased" indicator if user owns it
- Filter: "Free Only" / "Premium Only" / "All"

#### 3.2 Extension Detail/Install Page Updates

**File**: `Web/views/pages/extension-installer.ejs`

**Premium Purchase Flow**:

- Show price if premium
- Show current vote rewards balance
- "Purchase for X points" button
- "Already Purchased" state
- Insufficient balance messaging with link to buy points

#### 3.3 Purchase API Endpoints

```javascript
// Purchase premium extension
POST /api/extensions/:extid/purchase

// Check if user has purchased extension
GET /api/extensions/:extid/ownership
```

---

### Phase 4: Installation Gate

#### 4.1 Server Extension Installation

**Files**:

- `Web/controllers/dashboard/other.js` (extensions.post)
- `Web/controllers/extensions.js` (installer)

**Logic Flow**:

```
1. User clicks "Install Extension" on server
2. Check if extension is premium
3. If premium:
   a. Check if installing user has purchased it
   b. If not purchased → redirect to purchase flow
   c. If purchased → allow installation
4. If not premium → allow installation (existing flow)
```

**Key Decision**: Premium extensions are purchased per-USER, not per-server

- Once a user purchases an extension, they can install it on any server they admin
- This encourages extension creators and avoids per-server complexity

#### 4.2 Extension Execution Gate

**File**: `Internals/Extensions/ExtensionManager.js`

**Add Check Before Execution**:

```javascript
// Before running extension, verify:
// 1. Extension is still published
// 2. If premium, a server admin has purchased it
// This prevents running unpurchased extensions
```

---

### Phase 5: Maintainer Console

#### 5.1 Premium Extension Approval Queue

**Files**:

- `Web/controllers/maintainer.js`
- `Web/views/pages/maintainer-*.ejs`

**New Section**: "Premium Extension Requests"

- List extensions pending premium approval
- Show: Extension name, extension creator, requested price
- Actions: Approve / Reject / Adjust Price

#### 5.2 Marketplace Analytics

**New Dashboard Section**:

- Total marketplace revenue (points transacted)
- Platform fee collected
- Top earning extension creators
- Top selling extensions
- Purchase volume over time

#### 5.3 Settings Management

**Add to Site Settings**:

- Enable/disable premium extensions marketplace
- Default revenue share percentage
- Min/max price limits
- Require approval toggle

---

### Phase 6: Notifications & Messaging

#### 6.1 Extension Creator Notifications

- Extension purchased (DM or dashboard notification)
- Premium status approved/rejected
- Monthly earnings summary (for users with premium extensions)

#### 6.2 Buyer Notifications

- Purchase confirmation
- Extension updates available

---

## Data Flow Diagrams

### Purchase Flow

```
User → Gallery → Click Premium Extension → Install Page
                                              ↓
                              Check: User purchased?
                                    ↓           ↓
                                  YES          NO
                                    ↓           ↓
                              Allow Install   Show Purchase UI
                                              ↓
                                    User clicks "Purchase"
                                              ↓
                                    Check vote_rewards.balance
                                              ↓
                                    Sufficient? → Deduct points
                                              ↓
                                    Credit extension creator
                                              ↓
                                    Add to purchased_by[]
                                              ↓
                                    Proceed to Install
```

### Extension Earnings Withdrawal Flow

```
User → My Extensions → View Earnings → Click Withdraw
                                              ↓
                                    Enter amount (≤ balance)
                                              ↓
                                    Deduct from extension_earnings.balance
                                              ↓
                                    Add to vote_rewards.balance
                                              ↓
                                    Log transaction
                                              ↓
                  User can now use points for:
                  - Purchase premium tier for their servers
                  - Purchase other premium extensions
                  - (Future: Cash out via payment system)
```

---

## Implementation Order

### Sprint 1: Backend Foundation

1. Schema migrations (gallery, user, siteSettings)
2. `PremiumExtensionsManager.js` module
3. Update `VoteRewardsManager.js` to integrate with new system
4. API endpoints for purchase and ownership check

### Sprint 2: Extension Creator Experience

1. Extension builder premium settings UI
2. My Extensions earnings dashboard (for users with extensions)
3. Withdrawal functionality
4. Creator notifications

### Sprint 3: Buyer Experience

1. Gallery premium indicators and filters
2. Install page purchase flow
3. Installation gate logic
4. Balance display in header/account

### Sprint 4: Administration

1. Maintainer premium approval queue
2. Marketplace analytics dashboard
3. Site settings for marketplace config
4. Abuse prevention (refund policy, fraud detection)

### Sprint 5: Polish & Launch

1. Email/DM notifications
2. Documentation
3. Testing all flows
4. Soft launch with limited developers

---

## Security Considerations

1. **Race Conditions**: Use atomic operations for balance changes
2. **Double Purchases**: Check `purchased_by` before deducting points
3. **Price Manipulation**: Lock price at purchase time, log in transaction
4. **Fraud Prevention**: Require maintainer approval for premium status
5. **Refunds**: Define clear refund policy (extension removed = refund?)
6. **Extension Removal**: What happens when premium extension is deleted?

---

## Open Questions

1. **Refund Policy**:
   - Should users get refunds if developer deletes extension?
   - Time-limited refund window?

2. **Revenue Share**:
   - Fixed 70/30 split or configurable per-developer?
   - Tiered rates based on sales volume?

3. **Minimum Payout**:
   - Should there be a minimum balance before withdrawal?
   - Prevent micro-transactions abuse?

4. **Extension Updates**:
   - Do purchasers get updates automatically?
   - Can developers charge for major version updates?

5. **Free Trial**:
   - Allow time-limited trials of premium extensions?
   - "Try before you buy" system?

6. **Gifting**:
   - Can users gift extensions to other users?
   - Gift points to other users?

7. **Cash Out** (Future):
   - Allow developers to cash out earnings to real money?
   - Would require tax/legal considerations

---

## Success Metrics

1. **Adoption**: Number of extensions marked as premium
2. **Revenue**: Total points transacted through marketplace
3. **Creator Satisfaction**: Extension creator retention, earnings per creator
4. **Buyer Satisfaction**: Purchase completion rate, support tickets
5. **Platform Health**: Platform fee revenue, abuse incidents

---

## Appendix: Existing Code References

### Vote Rewards Balance Operations

- `Modules/VoteRewardsManager.js:82-131` - addPoints()
- `Modules/VoteRewardsManager.js:141-188` - deductPoints()

### Existing Premium Extension Purchase

- `Modules/VoteRewardsManager.js:498-546` - redeemForExtension() (needs expansion)

### Extension Gallery Schema

- `Database/Schemas/gallerySchema.js:31-47` - Premium fields

### Extension Installation

- `Web/controllers/dashboard/other.js:219-272` - extensions.post (install handler)

### Payment Webhooks

- `Web/controllers/webhooks.js:346-395` - BTCPay invoice handling
- `Web/routes/account.js:564-687` - Vote points purchase checkout

---

*Document Version: 1.0*
*Created: December 2025*
*Status: Planning*
