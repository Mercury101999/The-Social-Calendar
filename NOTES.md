# Project Notes

## Decisions
| # | Date | Decision | Why |
| --- | --- | --- | --- |
| 1 | 2026-10-18 | React Native + Expo for the app | Builds on my React/JS skills; the code lives in Git for the portfolio; one codebase for iOS and Android |
| 2 | 2026-10-18 | Supabase for the backend | Auth, Postgres, and storage in one place; row-level security maps directly onto friend levels |
| 3 | 2026-10-28 | Expo Router + TypeScript (Expo default template) | File-based navigation; types catch bugs early |
| 4 | 2026-10-28 | Public GitHub repo, MIT license | Portfolio visibility; secrets are kept out of the repo |
| 5 | 2026-10-28 | Conventional commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`) | Readable history that's consistent across the project |

## Open questions
- Name for the lowest friend level (replacing "acquaintance"). Ideas: Connection, Mutual, New Face, Circle.
- Promotion rule: how many hangouts before the app suggests a level up?
- Event sources: hand-curated at first; which automated sources come later?
- Launch region: NYC first, or open to everyone?
- Weather API provider (the key must stay server-side in an Edge Function)

## Naming conventions
- Database tables: `snake_case`, plural (`events`, `rsvps`, `friendships`)
- TypeScript: `camelCase` variables, `PascalCase` components
- Files: components in `PascalCase.tsx`, routes follow Expo Router
