---
description: Web dashboard architecture, controller patterns, middleware, and EJS templates
trigger: model_decision
---

# Web Dashboard

The web dashboard provides server management, user accounts, and administrative interfaces using Express.js with EJS templates.

**Importance Score: 80/100**

## Architecture

```text
Web/
├── controllers/           # Route handlers (18 controllers)
│   ├── dashboard/        # Server dashboard sub-controllers
│   ├── activity.js
│   ├── api.js
│   ├── extensions.js     # 26KB
│   ├── maintainer.js     # 43KB (largest)
│   ├── membership.js     # 15KB
│   └── webhooks.js       # 16KB
├── routes/               # Express route definitions
├── middleware/           # Auth, cloudflare, etc.
├── views/                # EJS templates
│   ├── pages/
│   └── partials/
├── public/               # Static assets
│   ├── css/
│   │   └── modern-ui.css # Design system
│   ├── js/
│   ├── fonts/
│   └── img/
└── parsers.js            # Request parsing utilities
```

## Key Controllers

| Controller | Size | Purpose |
|------------|------|---------|
| `maintainer.js` | 43KB | Admin console (largest) |
| `extensions.js` | 26KB | Extension marketplace |
| `webhooks.js` | 16KB | Payment/integration webhooks |
| `membership.js` | 15KB | Subscription checkout |
| `activity.js` | - | Activity tracking/stats |
| `api.js` | - | Public API endpoints |
| `seo.js` | - | Sitemap, robots.txt |

### Dashboard Sub-Controllers

Path: `Web/controllers/dashboard/`

| Controller | Purpose |
|------------|---------|
| `administration.js` | Moderation settings |
| `commands.js` | Command configuration |
| `extensions.js` | Server extension management |
| `stats.js` | Server statistics |
| `other.js` | Export, misc settings |

## Middleware

Path: `Web/middleware/`

### Authentication

```javascript
const middleware = require('./middleware');

// Require logged in user
router.get('/account', middleware.requireAuth, controller.account);

// Require dashboard access for specific server
router.get('/dashboard/:svrid', 
    middleware.authorizeDashboardAccess,
    controller.dashboard
);
```

### Feature Gating

```javascript
// Require specific feature
router.get('/premium-page',
    middleware.requireFeature('feature_id'),
    controller.premiumPage
);

// Require minimum tier level
router.get('/enterprise',
    middleware.requireTierLevel(3),
    controller.enterprise
);
```

### Cloudflare

Path: `Web/middleware/cloudflare.js`

- Real IP extraction from CF headers
- Geo-location data
- Bot detection

## Routes

Path: `Web/routes/`

| Route File | Mounts At | Purpose |
|------------|-----------|---------|
| `general.js` | `/` | Public pages, auth |
| `api.js` | `/api` | REST API endpoints |
| `dashboard.js` | `/dashboard` | Server management |
| `account.js` | `/account` | User settings |
| `maintainer.js` | `/maintainer` | Admin console |
| `extensions.js` | `/extensions` | Extension marketplace |

### Route Pattern

```javascript
// Web/routes/dashboard.js
const router = require('express').Router();
const controllers = require('../controllers/dashboard');
const middleware = require('../middleware');

router.get('/:svrid', 
    middleware.authorizeDashboardAccess,
    controllers.main.get
);

router.post('/:svrid/settings',
    middleware.authorizeDashboardAccess,
    controllers.main.post
);

module.exports = router;
```

## Views (EJS Templates)

Path: `Web/views/`

### Page Templates

```text
Web/views/pages/
├── landing.ejs           # Homepage
├── dashboard.ejs         # Server dashboard
├── blog.ejs              # Blog system
├── membership.ejs        # Subscription page
├── maintainer-*.ejs      # Admin console pages
└── admin-*.ejs           # Dashboard pages
```

### Partials

```text
Web/views/partials/
├── head.ejs              # HTML head (scripts, styles)
├── header.ejs            # Navigation header
├── footer.ejs            # Page footer
├── admin-menu.ejs        # Dashboard sidebar
├── feedback-widget.ejs   # Feedback form
└── blog-article.ejs      # Blog post component
```

### Template Patterns

```ejs
<!-- Pass data to partials explicitly -->
<%- include('partials/blog-article', { blogPost: blogPost }) %>

<!-- Use escaped output for user content -->
<textarea><%= userContent %></textarea>

<!-- Unescaped for trusted HTML -->
<%- trustedHtml %>
```

## Static Assets

Path: `Web/public/`

### Modern UI CSS

Path: `Web/public/css/modern-ui.css`

Design system with CSS variables:

- Color palette
- Typography scale
- Spacing system
- Component styles
- Dark mode support

### JavaScript

Path: `Web/public/js/`

- `app.js` - Main frontend utilities
- `SkynetUtil` namespace for shared functions

## API Patterns

### REST API

Path: `Web/routes/api.js`

```javascript
// Public endpoints (no auth)
GET /api/status
GET /api/servers

// Protected endpoints (require api_access feature)
GET /api/server/:id/stats
POST /api/server/:id/action
```

### Rate Limiting

```javascript
// Standard: 150 requests/hour
// Premium (api_unlimited): No limit
```

## Common Controller Patterns

### GET Handler

```javascript
controllers.pageName = {};

controllers.pageName.get = async (req, res) => {
    const serverDoc = await Servers.findOne({ _id: req.svr.id });
    
    res.render('pages/page-name', {
        serverDoc,
        user: req.user,
        // ... other data
    });
};
```

### POST Handler

```javascript
controllers.pageName.post = async (req, res) => {
    const { setting1, setting2 } = req.body;
    
    await Servers.update(
        { _id: req.svr.id },
        { $set: { 'config.setting1': setting1 } }
    );
    
    res.redirect(`/dashboard/${req.svr.id}/page-name`);
};
```

## Integrations

### Matomo Analytics

Path: `Web/controllers/matomo-proxy.js`

- Proxy controller for Matomo tracking
- Environment: `MATOMO_URL`, `MATOMO_TOKEN`, `MATOMO_SITE_ID`

### Cloudflare

Path: `Web/controllers/cloudflare.js`

- SSL certificate management
- DNS management
- Environment: `CLOUDFLARE_API_KEY`, `CLOUDFLARE_ZONE_ID`

### Script Injector

Path: `Web/views/pages/maintainer-injection.ejs`

- Head script injection (supports raw HTML)
- Body script injection
- Custom CSS injection

## Key Files

| File | Purpose |
|------|---------|
| `Web/App.js` | Express app setup |
| `Web/parsers.js` | Request parsing utilities |
| `Web/middleware/index.js` | Middleware collection |
| `Web/public/css/modern-ui.css` | Design system |
| `Web/public/js/app.js` | Frontend utilities |
