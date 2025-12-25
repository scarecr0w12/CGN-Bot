# Breaking Changes - Security Update (December 24, 2024)

## Extension API Changes

### Removed Modules

The following modules have been **removed from the Extension API** due to security vulnerabilities in their underlying packages:

#### 1. `modules.rss` (feed-read)

**Status:** ❌ Removed

**Reason:** The `feed-read` package depends on the deprecated `request` package which has critical security vulnerabilities (form-data CVE-2025-7783).

**Migration Path:**
- Use `modules.fetch` to retrieve RSS/ATOM feeds directly
- Parse XML using `modules.xmlparser`
- Example:
```javascript
const rssData = await modules.fetch('https://example.com/feed.xml');
const parsed = modules.xmlparser(rssData);
```

**Audit Results:**
- ✅ Scanned all 234 existing extension files
- ✅ **0 extensions** found using `modules.rss`
- ✅ **No migration required** for existing extensions

**Future Extensions:**
- Extension Builder will show deprecation warnings
- Documentation updated with migration guide

**Wolfram Alpha Command:**
- Wolfram slash command has been disabled (moved to `_disabled/` folder)
- The command relied on `wolfram-node` package with vulnerable dependencies
- Consider using direct Wolfram Alpha API calls via `modules.fetch` if needed

---

## OAuth Provider Upgrades

### passport-twitch-new (0.0.2 → 0.0.3)

**Breaking Change:** ⚠️ Major version update

**Changes:**
- Updated to fix jsonwebtoken vulnerabilities (CVE-2022-23539, CVE-2022-23540, CVE-2022-23541)
- No API changes expected for existing Twitch OAuth integrations
- Verify Twitch account linking still works in testing

### passport-patreon (1.0.1 → 1.0.0)

**Breaking Change:** ⚠️ Downgrade to stable release

**Changes:**
- Rolled back to remove dependency on vulnerable `request` package
- Patreon OAuth integration should continue to work
- Test Patreon account linking and tier assignment

---

## Testing Checklist

Before deploying to production:

- [ ] Test extension sandbox with `modules.fetch` and `modules.xmlparser`
- [ ] Verify extensions using RSS feeds are updated
- [ ] Test Twitch account linking (`/auth/twitch/link`)
- [ ] Test Patreon account linking and tier assignment
- [ ] Verify no broken extension commands
- [ ] Check extension gallery for broken RSS-based extensions

---

## Security Improvements

As a result of these changes:

- ✅ Reduced vulnerabilities from **24 → 0**
- ✅ Removed 2 critical, 6 high-severity issues
- ✅ Eliminated deprecated `request` package dependency chain
- ✅ Added comprehensive XSS protection middleware
- ✅ Fixed high-priority code vulnerabilities

---

## Rollback Instructions

If issues occur, you can temporarily rollback:

```bash
npm install feed-read@0.0.1 wolfram-node@latest
npm install passport-twitch-new@0.0.2 passport-patreon@1.0.1
```

⚠️ **Warning:** This will reintroduce security vulnerabilities. Only use as a temporary measure while fixing extensions.

---

## Future Deprecations

The following packages will be evaluated for removal in future updates:

- **restler** - Deprecated HTTP client with xml2js vulnerabilities
- Consider modern alternatives: axios, got, undici

---

## Support

If you have extensions that relied on `modules.rss`:

1. Review the Extension Development documentation
2. Update your extension code to use `modules.fetch` + `modules.xmlparser`
3. Resubmit to the gallery with updated version

For questions or assistance, open an issue on GitHub.
