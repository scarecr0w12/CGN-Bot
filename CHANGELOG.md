# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Uptime Kuma integration for status monitoring
- Status page controller and API endpoints
- Web helpers module for shared utilities
- GitHub Actions release workflow with automated changelog generation
- Docker image publishing to GitHub Container Registry

### Changed

- Updated GitHub workflows to use Node.js 24.x
- Modernized CONTRIBUTING.md with conventional commits guidelines
- Consolidated CI workflows into single `ci.yml`

### Removed

- Deprecated Travis CI configuration
- Duplicate `node.js.yml` workflow

## [5.0.0] - 2024-01-01

### Added

- Initial v5.0.0 release
- Discord.js v14 support
- Modern extension system with sandboxed execution
- Activity scoring algorithm for server management
- Progressive moderation system with strike tracking

[Unreleased]: https://github.com/scarecr0w12/CGN-Bot/compare/v5.0.0...HEAD
[5.0.0]: https://github.com/scarecr0w12/CGN-Bot/releases/tag/v5.0.0
