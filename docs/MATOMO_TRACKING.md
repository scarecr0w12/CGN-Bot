# Matomo Analytics Tracking Guide

## Overview

The bot uses Matomo for comprehensive analytics tracking. The implementation automatically tracks:

- **Page views** (including Turbolinks SPA navigation)
- **Outbound links**
- **File downloads** (.zip, .pdf, .skypkg, etc.)
- **Form submissions**
- **Custom events** via JavaScript API

## Automatic Tracking

### Virtual Page Views
Turbolinks navigation is automatically tracked as separate page views:
```javascript
document.addEventListener('turbolinks:load', function() {
  _paq.push(['setCustomUrl', window.location.href]);
  _paq.push(['setDocumentTitle', document.title]);
  _paq.push(['trackPageView']);
});
```

### Outbound Links
External links are automatically tracked when clicked.

### Downloads
Files with these extensions are tracked as downloads:
- `.zip`, `.pdf`, `.txt`, `.docx`, `.xlsx`, `.pptx`
- `.skypkg` (extension packages)
- `.json`

### Form Submissions
All form submissions are automatically tracked with the form ID or class name.

## Custom Event Tracking

Use the global `trackMatomoEvent()` function to track custom interactions:

```javascript
trackMatomoEvent(category, action, name, value);
```

### Examples

**Track button clicks:**
```javascript
document.getElementById('myButton').addEventListener('click', function() {
  trackMatomoEvent('Button', 'Click', 'Feature X Activated');
});
```

**Track extension installations:**
```javascript
trackMatomoEvent('Extensions', 'Install', extensionName);
```

**Track premium upgrades:**
```javascript
trackMatomoEvent('Premium', 'Upgrade', tierName, tierPrice);
```

**Track command usage:**
```javascript
trackMatomoEvent('Commands', 'Execute', commandName);
```

**Track AI interactions:**
```javascript
trackMatomoEvent('AI', 'Message', 'User Query');
```

## Dashboard Analytics

The bot includes a Matomo API proxy at `/api/matomo/analytics` for displaying metrics in the admin dashboard.

### Example Usage
```javascript
const response = await fetch('/api/matomo/analytics?method=VisitsSummary.get&period=day&date=today');
const data = await response.json();
console.log('Visits today:', data.nb_visits);
```

### Available Methods
- `VisitsSummary.get` - Overview statistics
- `Actions.getPageUrls` - Page view statistics
- `Actions.getDownloads` - Download tracking
- `Events.getCategory` - Event tracking by category
- `Live.getCounters` - Real-time visitor count

## Configuration

Matomo is configured via environment variables:

```env
MATOMO_URL=https://analytics.thecorehosting.net/
MATOMO_SITE_ID=14
MATOMO_TOKEN=your_auth_token_here
```

The tracking script only loads in production mode (`NODE_ENV=production`).

## Privacy

- User data is processed according to the Privacy Policy
- IP addresses can be anonymized in Matomo settings
- Users can opt-out via Matomo's opt-out functionality
- Tracking respects Do Not Track (DNT) headers when configured

## Monitoring Goals

Set up goals in Matomo to track:

1. **Bot Invitations** - Track `/add` page visits and OAuth completions
2. **Premium Conversions** - Track membership checkout completions
3. **Extension Installations** - Track extension install events
4. **Wiki Engagement** - Track time on wiki pages
5. **Form Completions** - Track specific form submissions

## Debugging

To test tracking in development:

1. Temporarily set `NODE_ENV=production` in `.env`
2. Check browser console for `_paq` variable
3. Use Matomo's Tag Manager debug mode
4. View real-time tracking in Matomo dashboard

```javascript
// Check if Matomo is loaded
console.log('Matomo loaded:', typeof _paq !== 'undefined');

// Manually trigger test event
if (typeof trackMatomoEvent === 'function') {
  trackMatomoEvent('Test', 'Debug', 'Manual Test Event');
}
```

## Best Practices

1. **Be specific** - Use clear category/action/name labels
2. **Consistent naming** - Use the same category names across the app
3. **Meaningful values** - Use numeric values for quantifiable metrics
4. **Avoid PII** - Don't track personally identifiable information
5. **Test thoroughly** - Verify events appear in Matomo dashboard

## Common Categories

- `Button` - Button clicks and interactions
- `Extensions` - Extension lifecycle events
- `Premium` - Subscription and payment events
- `Commands` - Bot command usage
- `AI` - AI chat interactions
- `Form` - Form submissions and validations
- `Navigation` - Menu and navigation interactions
- `Search` - Search queries and results
- `Social` - Social sharing and interactions
