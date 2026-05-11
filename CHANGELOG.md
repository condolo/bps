# Changelog

All notable changes to BPS are documented here.

---

## [3.0.0] — 2026-05-11

### Added
- **SaaS multi-tenancy** — all data scoped by `schoolId`; multiple schools share one deployment
- **Mascit Lab Academy** — demo school with fictional students, full dummy accounts for all roles
- **School context via URL** — `?school=demo` loads demo school branding and quick-login buttons
- **Per-school brand** — each school has independent name, colours, motto, logo
- **`X-School-Id` request header** — all API calls carry school context automatically
- `scripts/seed-demo.js` — reproducible demo school seeder
- `scripts/add-school-ids.js` — migration adds `schoolId` field to all existing records
- `README.md` — full project documentation, API reference, deployment guide

### Changed
- `api.js` — resolves school from URL param or session; injects `X-School-Id` on every request
- `server.js` — middleware extracts school; all queries/inserts scoped to `schoolId`
- `Login.jsx` — quick-login buttons switch between SAA and demo based on active school
- Brand collection scoped per school (`schoolId` field on brand document)

---

## [2.3.0] — 2026-05-11

### Security
- Removed hardcoded MongoDB credentials from `server.js` and `migrate-to-mongo.js`
- Server exits on startup if `MONGODB_URI` env var is missing (no silent fallback)
- Rewrote entire git history (orphan branch + force push) to erase the leaked credential from all prior commits
- Rotated MongoDB Atlas password for `bps-admin`

---

## [2.2.0] — 2026-05-11

### Added
- **MongoDB Atlas** — replaced JSON file storage with persistent cloud database
- `migrate-to-mongo.js` — one-time script to move all data from `data.json` to MongoDB
- `render.yaml` — Render deployment config (build + start commands, `NODE_ENV=production`)
- Static file serving from Express in production (`dist/` folder)

### Changed
- `server.js` — fully rewritten to use MongoDB native driver; all route handlers async
- `serve-bps.js` — explicitly sets `PORT=3001` for backend to avoid collision with Vite's PORT injection

### Fixed
- Backend and Vite port conflict caused by preview framework injecting `PORT=5173`

---

## [2.1.0] — 2026-05-10

### Added
- Imported real student database: **202 students** from St. Austin's Academy (Term 3 2025–2026)
- Generated **202 student login accounts** (email: `firstname.surname@staustin.ac.ke`, PIN: last 4 digits of admission number)
- Generated **171 parent accounts** (email from spreadsheet or auto-generated, PIN: last 4 digits of phone)
- `import-students.js` — reads `.xlsx` via `xlsx` package, maps columns, writes to `data.json`
- Houses randomly assigned (to be updated manually via Admin panel)

---

## [2.0.0] — 2026-05-10

### Added
- **Express REST API** (`server.js`) with 15 endpoints
- **JSON file database** (`data.json`) — no native dependencies, works on Node v24
- **Vite + React 18** frontend with dev proxy (`/api` → `localhost:3001`)
- `useReducer` local UI state with optimistic updates (`serverDispatch`)
- `api.js` — all fetch calls centralised, `loadAll()` parallel fetch on mount
- `src/components/` — Login, StaffApp, StudentApp, ParentApp, Shared
- Demo seed data (4 students, 9 users, 5 logs, 3 notifications)
- `launch.json` — Claude Code launch config for both servers
- `serve-bps.js` — wrapper script to start backend + Vite from property project directory

### Changed
- Replaced localStorage-only SPA with persistent server-side storage
- Multi-device access enabled

---

## [1.0.0] — 2026-05-10

### Added
- Initial single-file React SPA (~1000 lines) built in Claude.ai chat
- localStorage-only storage (no backend, no persistence across devices)
- Full behaviour point logic: merits, demerits, house standings, intervention stages, appeals
- Roles: admin, principal, dean_pastoral, dean_academic, discipline, ks3, ks4, ks5, teacher, student, parent
- 4 houses: Impala (Yellow), Simba (Red), Twiga (Green), Chui (Blue)
