# Contributing

**This repository's issues section is only for bug tracking, code contribution, questions about the inner workings of CGN-Bot/design decisions or other code-related purposes. For help on how to use the bot, please visit [our Discord Server](https://discord.gg/GSZfe5sBp6) instead.**

CGN-Bot is open source, as such, anyone can clone, fork, and host their own instance. Before you do so, please make sure you're up-to-date on [our license](https://github.com/scarecr0w12/CGN-Bot/blob/main/LICENSE) and its terms. If you want to contribute to the bot's development, you can help us track down bugs and report them [via our issue tracker](https://github.com/scarecr0w12/CGN-Bot/issues). If you want to contribute to the codebase, make sure you follow [our ESLint rules](https://github.com/scarecr0w12/CGN-Bot/blob/main/.eslintrc.js), your Pull Request must not contain any ESLint errors, or it will not be merged.

## Commit Guidelines

When naming your commits, please use [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `chore:` for maintenance tasks
- `refactor:` for code refactoring
- `test:` for adding tests
- `perf:` for performance improvements

*Pro Tip: Using an editor that has ESLint syntax checking is super useful when working on the bot!*

## Setup

To get ready to edit the code, do the following:

1. Fork & clone the repository, and make sure you're on the **main** branch
2. Copy `Configurations/config.template.js` to `Configurations/config.js` and fill in your values
3. Copy `Configurations/auth.template.js` to `Configurations/auth.js` and add your tokens
4. Run `npm install`
5. Start coding, making sure to document changes using JSDoc accordingly
6. Run `npm run lint` to check for ESLint errors
7. Run the bot and test that your changes work
8. [Submit a pull request](https://github.com/scarecr0w12/CGN-Bot/compare)

## Pull Request Labels

Use appropriate labels on your PRs to help with changelog generation:

- `feature` / `enhancement` - New features
- `bug` / `fix` - Bug fixes
- `documentation` - Documentation updates
- `chore` / `maintenance` - Maintenance work

Happy coding!
