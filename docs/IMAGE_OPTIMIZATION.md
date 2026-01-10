# Image Optimization Guide

This document outlines the image optimization strategies implemented in the project to improve page load performance, Core Web Vitals, and user experience.

---

## Overview

The project uses a multi-layered approach to image optimization:
1. **Automatic WebP conversion** for supported browsers
2. **Native lazy loading** for off-screen images
3. **Explicit dimensions** to prevent layout shift (CLS)
4. **Optimized caching headers** for static assets
5. **Fetch priority hints** for critical images

---

## 1. Automatic WebP Conversion

**Location:** `Web/WebServer.js` (lines 468-477)

All images served from `/static/img/` are automatically converted to WebP format for browsers that support it.

```javascript
// Convert to WebP if supported and not already WebP/GIF
if (acceptsWebP && req.path.startsWith("/img") && ![".gif", ".webp"].includes(fileExtension)) {
  const webpPath = `${req.path.substring(0, req.path.lastIndexOf("."))}.webp`;
  return res.redirect(301, `/static${webpPath}`);
}
```

**Requirements:**
- Keep both original (PNG/JPG) and WebP versions of images
- GIF animations are excluded (no WebP conversion)
- Saves 25-35% file size on average

**File naming convention:**
```
/static/img/logo.png       → Original
/static/img/logo.webp      → WebP version (served to modern browsers)
```

---

## 2. Lazy Loading

### Native Lazy Loading
**Attribute:** `loading="lazy"`

Applied to all off-screen images to defer loading until needed:
```html
<img src="/path/to/image.jpg" alt="Description" width="48" height="48" loading="lazy">
```

### Advanced Lazy Loading (IntersectionObserver)
**Location:** `Web/public/js/lazy-load.js`

For more control, use the data-src pattern:
```html
<img data-src="/path/to/image.jpg" alt="Description" class="lazy">
```

**Features:**
- 50px preload margin (images load slightly before entering viewport)
- Graceful fallback for browsers without IntersectionObserver
- Turbolinks/Hotwire compatible
- API: `window.lazyLoad.init()`, `window.lazyLoad.observe(img)`

**Impact:**
- Reduces initial page weight by 40-70%
- Improves Time to Interactive (TTI) by 1-3 seconds
- Saves bandwidth for users who don't scroll

---

## 3. Layout Shift Prevention (CLS)

**All images must include explicit `width` and `height` attributes:**
```html
<!-- ✅ CORRECT -->
<img src="/avatar.jpg" alt="User" width="48" height="48" loading="lazy">

<!-- ❌ WRONG - Causes layout shift -->
<img src="/avatar.jpg" alt="User" style="width: 48px; height: 48px;">
```

**Why this matters:**
- Prevents Cumulative Layout Shift (CLS)
- Improves Core Web Vitals scores
- Better user experience (no content jumping)

**CSS still controls actual display size:**
```html
<img src="/avatar.jpg" width="48" height="48" style="width: 48px; height: 48px; border-radius: 50%;">
```
The `width/height` attributes reserve space; CSS applies styling.

---

## 4. Fetch Priority Hints

For critical above-the-fold images:
```html
<img src="/hero-image.png" width="1200" height="800" fetchpriority="high">
```

**Use cases:**
- Hero images (landing page)
- Logos in header (when visible immediately)
- Dashboard screenshots in above-the-fold content

**Do NOT use for:**
- Below-the-fold images
- Small icons/avatars
- Decorative images

---

## 5. Responsive Images (Future Enhancement)

For images that need different sizes based on screen width:
```html
<img src="/image-800.jpg"
     srcset="/image-400.jpg 400w,
             /image-800.jpg 800w,
             /image-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px,
            (max-width: 1200px) 800px,
            1200px"
     alt="Description"
     width="1200"
     height="800"
     loading="lazy">
```

**Not yet implemented project-wide** but recommended for:
- Hero images
- Blog post featured images
- Extension gallery screenshots

---

## 6. Caching Strategy

**Location:** `Web/WebServer.js` (lines 479-510)

Static assets use optimized cache headers:
- **Fonts:** 1 year cache (immutable)
- **Images:** 1 week cache
- **JS/CSS:** Long cache with versioning via query strings
- **Vary: Accept** header for WebP negotiation

---

## Best Practices Checklist

When adding images to templates:

- [ ] **Always include `width` and `height` attributes** (exact pixel dimensions)
- [ ] **Use `loading="lazy"` for off-screen images**
- [ ] **Use `fetchpriority="high"` only for critical above-the-fold images**
- [ ] **Provide meaningful `alt` text** for accessibility
- [ ] **Ensure WebP version exists** for all static images
- [ ] **Optimize image file sizes** before uploading (use tools like ImageOptim, Squoosh)
- [ ] **Use appropriate image formats:**
  - PNG: logos, text, transparency
  - JPG: photos, complex images
  - SVG: icons, simple graphics
  - WebP: automatically served for supported browsers

---

## Performance Monitoring

Monitor image performance using:
- **Lighthouse** (Chrome DevTools → Audits)
- **PageSpeed Insights** (web.dev)
- **WebPageTest** (webpagetest.org)

**Key metrics:**
- **LCP (Largest Contentful Paint):** < 2.5s (Good)
- **CLS (Cumulative Layout Shift):** < 0.1 (Good)
- **FCP (First Contentful Paint):** < 1.8s (Good)

---

## Image Optimization Tools

**Recommended tools for creating optimized images:**

1. **Squoosh** (https://squoosh.app) - Web-based image compression
2. **ImageOptim** (macOS) - Lossless image optimization
3. **TinyPNG** (https://tinypng.com) - PNG/JPG compression
4. **cwebp** (command-line) - Convert to WebP format
   ```bash
   cwebp -q 85 input.png -o output.webp
   ```

---

## Common Mistakes to Avoid

### ❌ Don't do this:
```html
<!-- Missing dimensions -->
<img src="/avatar.jpg" alt="User" loading="lazy">

<!-- Using only CSS for dimensions -->
<img src="/avatar.jpg" alt="User" style="width: 48px; height: 48px;">

<!-- Lazy loading above-the-fold images -->
<img src="/hero.jpg" alt="Hero" width="1200" height="800" loading="lazy">

<!-- Overusing fetchpriority="high" -->
<img src="/small-icon.png" fetchpriority="high">
```

### ✅ Do this instead:
```html
<!-- Complete, optimized image -->
<img src="/avatar.jpg" alt="User Avatar" width="48" height="48" loading="lazy">

<!-- Critical above-the-fold image -->
<img src="/hero.jpg" alt="Dashboard" width="1200" height="800" fetchpriority="high">

<!-- Small decorative image -->
<img src="/icon.svg" alt="" width="24" height="24" loading="lazy">
```

---

## Testing

### Manual Testing
1. Open Chrome DevTools → Network tab
2. Throttle to "Fast 3G"
3. Check that:
   - WebP images are served (check headers)
   - Below-fold images don't load immediately
   - No layout shift when images load

### Automated Testing
```bash
# Run Lighthouse CI
npm run lighthouse

# Check Core Web Vitals
npm run cwv-check
```

---

## Future Improvements

1. **Implement srcset** for responsive images on key pages
2. **Add image CDN** (Cloudflare Images, imgix, or Cloudinary)
3. **Implement AVIF format** (next-gen format, even smaller than WebP)
4. **Add blur-up placeholders** (LQIP - Low Quality Image Placeholders)
5. **Consider progressive JPEG** for large photos
6. **Implement image sprite sheets** for small icons

---

## Related Files

- `Web/WebServer.js` - WebP conversion, caching headers
- `Web/public/js/lazy-load.js` - Advanced lazy loading
- `Web/views/partials/head.ejs` - Preconnect hints, DNS prefetch
- `docs/PERFORMANCE_OPTIMIZATION.md` - General performance guide

---

## Questions?

For issues or improvements, contact the development team or open an issue on GitHub.
