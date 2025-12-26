# Skynet Bot SEO Strategy & Optimization Plan

## 1. Technical SEO Improvements (Implemented)

### Structured Data (JSON-LD)
We have implemented comprehensive Schema.org structured data across the site to help search engines understand our content:

*   **Landing Page:** `FAQPage`, `Organization`, `SoftwareApplication`
*   **Extension Installer:** `SoftwareApplication` (ApplicationCategory: BotExtension)
*   **Extension Detail Pages:** `SoftwareApplication` with `AggregateRating`, `BreadcrumbList` (NEW - SEO landing pages at `/extensions/view/:id/:slug`)
*   **Wiki Pages:** `TechArticle` (better for documentation than generic WebPage)
*   **Blog Posts:** `Article` with author and publisher metadata
*   **Public Server Pages:** `Organization` with `BreadcrumbList`, member count, interaction statistics, founding date (ENHANCED)
*   **Activity/Stats Pages:** `CollectionPage` with `ItemList` for server/user directories
*   **Membership Page:** `Product` with multiple `Offer` schemas (monthly/yearly), `FAQPage` (NEW)
*   **Vote Page:** `HowTo` schema for voting process, `ItemList` for voting sites (NEW)

### Performance
*   **Lazy Loading:** Added `loading="lazy"` to below-the-fold images on the landing page.
*   **Meta Tags:** Optimized default keywords to include high-value terms like "music bot", "ticket system", and "developer tools".
*   **Canonical URLs:** Implemented dynamic canonical tags to prevent duplicate content issues, especially for Extensions (slug redirection) and Public Server pages.

## 2. Keyword Opportunities

Based on current features (v1.6.0), we should target these keyword clusters:

### Primary (High Volume, High Competition)
*   "Discord bot"
*   "Free Discord bot"
*   "Discord moderation bot"
*   "Discord music bot"

### Secondary (Medium Volume, Specific Intent)
*   "Discord ticket bot"
*   "Discord leveling system"
*   "Discord custom commands"
*   "Discord AI chat bot"

### Long-Tail (Low Volume, High Conversion)
*   "How to make custom discord commands without coding" (Target with Extension Builder)
*   "Run code in discord" (Target with Developer Tools)
*   "Discord server backup and restore" (Target with future Backup features)
*   "Discord bot with web dashboard"

## 3. Content Strategy

### Blog Expansion
*   **Tutorials:** "How to set up a Ticket System in Discord", "Creating your first Skynet Extension".
*   **Comparisons:** "Skynet vs MEE6: Why we're free", "Best Music Bots for Discord 2025".
*   **Release Notes:** Continue detailed release posts (like v1.6.0) but focus on benefits ("What's new for Server Owners").

### Wiki Optimization
*   Ensure every major feature (Music, Tickets, AI) has a dedicated top-level Wiki page.
*   Use descriptive H1/H2 tags containing keywords (e.g., "Setting up the **Music System**" instead of just "Music").
*   Cross-link between Wiki pages and related Extensions in the gallery.

### Extension Marketplace
*   Encourage creators to write detailed descriptions.
*   The new Slug system (`/extensions/:id/:slug`) is great; ensure creators use keyword-rich names for extensions.
*   Create "Collections" or "Featured" lists for specific use cases (e.g., "Best RPG Extensions", "Essential Moderation Tools").

## 4. Off-Page Strategy (Future)
*   **Backlinks:** Encourage server owners to link to their Public Server Page on Skynet.
*   **Directories:** Ensure Skynet is listed on all major bot lists (top.gg, discordbotlist.com) with updated descriptions mentioning v1.6.0 features.
