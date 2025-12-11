---
description: Build and tag a new release with changelog generation
---

# Deploy Release

## Prerequisites
- All changes committed and pushed
- Tests passing
- CHANGELOG.md updated

## Steps

1. Check current version:
// turbo
```bash
grep '"version"' /root/bot/package.json
```

2. Review recent commits for changelog:
// turbo
```bash
git log --oneline -20
```

3. Update version in package.json (follow semver):
   - MAJOR: Breaking changes
   - MINOR: New features, backward compatible
   - PATCH: Bug fixes

4. Update CHANGELOG.md with release notes:
// turbo
```bash
head -50 /root/bot/CHANGELOG.md
```

5. Commit version bump:
```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
```

6. Create and push release tag:
```bash
# Replace X.Y.Z with actual version
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --tags
```

7. The GitHub Actions workflow will automatically:
// turbo
```bash
cat /root/bot/.github/workflows/release.yml
```
   - Create GitHub Release
   - Generate changelog from commits
   - Attach release assets

8. Verify release on GitHub:
   - Check https://github.com/scarecr0w12/CGN-Bot/releases

9. Deploy to production (if applicable):
```bash
# On production server
git pull origin main
docker compose up -d --build bot
```

## Rollback

If issues occur after release:
```bash
# Revert to previous version
git checkout vPREVIOUS.VERSION
docker compose up -d --build bot
```
