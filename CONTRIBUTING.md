# Contributing to VoIP SaaS Platform

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start infrastructure: `npm run docker:dev`
5. Run migrations: `npm run db:migrate`
6. Start development: `npm run dev`

## Code Style

- **TypeScript** for all new code
- **ESLint** for linting
- **Prettier** for formatting
- Follow existing patterns in codebase

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

## Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Pull Requests

1. Create feature branch from `main`
2. Make changes with clear commits
3. Add/update tests as needed
4. Ensure all tests pass: `npm run test:e2e`
5. Submit PR with description

## Project Structure

```
packages/
├── backend/    # Node.js API
├── frontend/   # React web app
└── mobile/     # React Native app
```

## Questions?

Open an issue for discussion.
