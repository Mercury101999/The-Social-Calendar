# The Social Calendar

A lively, seasonal social calendar that gets people out with friends, on their own, and meeting someone new. It isn't just another calendar app.

## Features (planned)
- Sign-up that asks for your likes, dislikes, and favorite seasonal activities
- A personal calendar with a theme for each season, plus the weather
- Hand-curated events with RSVPs and monthly topics (local happenings, movies, TV, anime)
- Friend levels (Connection, Friend, Best Friend) that control who can see your calendar
- Outing suggestions based on interests you share
- Reminders to get out, like "Don't let Spring pass you by"
- Private event photos, a seasonal memories gallery, and end-of-season recaps

## Tech stack
| Layer | Choice |
| --- | --- |
| Mobile app | React Native, Expo, Expo Router, TypeScript |
| Backend | Supabase (Auth, Postgres, Storage, Edge Functions) |
| Security | Postgres row-level security based on friend level |
| Builds | EAS Build / EAS Update |

## Getting started
```bash
npm install
npx expo start
```
Scan the QR code with Expo Go (Android) or the Camera app (iOS).
On Windows PowerShell, use `npx.cmd` if script execution is blocked.

## Environment variables
Copy `.env.example` to `.env` and fill in your Supabase project values.
Never commit `.env`, and never put the Supabase service-role key in the app.

## Project docs
- [NOTES.md](NOTES.md) for decisions and open questions
- [CHANGELOG.md](CHANGELOG.md) for what changed and when

## Roadmap
- [x] Phase 0: Setup
- [ ] Phase 1: One journey (sign in, find an event, RSVP, see it on the calendar)
- [ ] Phase 2: Protect the data (security rules, storage permissions, deletion)
- [ ] Phase 3: Memories, seasons, and themes
- [ ] Phase 4: Social layer (friend levels, privacy, suggestions)
- [ ] Phase 5: Quality (tests, CI, error states)
- [ ] Phase 6: Pilot
- [ ] Phase 7: App Store and Google Play launch

## License
MIT
