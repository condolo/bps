# Changelog

All notable changes to BPS are documented here.

---

## [3.4.0] — 2026-05-11

### Added
- **Edit users** — Admin can edit name, email, role, class assignment, and reset PIN for any user in their school via inline modal
- **Bulk upload users** — CSV upload for staff/users; template download with columns Name, Email, Role, Class, PIN; role names accepted as IDs or labels; duplicate email detection
- **New roles** — `School Counselor` and `Safeguarding Officer` added to role list; both receive full senior-level dashboard access (alerts, stage reports, serious incidents)
- **Editable houses** — Admin can rename all 4 houses and change their colours per school (stored in brand settings)
- **Editable behaviour matrix** — Admin can add/rename/delete categories and individual behaviour items, set custom merit/demerit point values; changes stored per school in MongoDB `settings` collection; Reset to Default button available
- `PATCH /api/users/:id` — update user fields (PIN only updated when provided)
- `POST /api/users/bulk` — bulk enrol users scoped to school
- `GET/PUT/DELETE /api/matrix` — per-school behaviour matrix stored in `settings` collection
- Admin panel now has three tabs: **Users**, **Houses**, **Behaviour Matrix**

### Changed
- `behavLabel()` now accepts optional custom matrix, falls back to default for backward compatibility with old log entries
- Award Points flow uses school's custom matrix when one exists
- CORS now correctly allows `X-School-Id` header

---

## [3.3.0] — 2026-05-11

### Changed
- **Default URL (`/`) now loads Demo School directly** — no landing page, no school selector shown publicly
- **Removed landing page** (`LandingPage.jsx` deleted) — SAA and all registered schools are private, accessible only via their dedicated `?school=<id>` links
- **Renamed demo school** from "Mascit Lab Academy" to "Demo School" everywhere: MongoDB `brand`, `schools`, and `users` collections, `seed-demo.js`, `seed-super-admin.js`, `Login.jsx` quick-login buttons
- **Demo email domain** changed from `@mascitlab.ac.ke` → `@demo.bps.app` across all 7 demo user accounts

### Security
- Real school portals no longer appear on any public-facing page — only accessible via private direct links

---

## [3.2.0] — 2026-05-11

### Added
- **Landing page** (`LandingPage.jsx`) shown at `/` — school selector cards for SAA and Demo *(replaced in v3.3.0)*

---

## [3.1.0] — 2026-05-11

### Added
- **Super Admin portal** — dedicated management interface at `?school=system`
- `SuperAdminApp.jsx` — platform-wide dashboard with schools table, stats, register form
- Stats bar: total schools, total students, total users across all tenants
- Schools table: name, ID, student / staff / parent counts, status badge, Open and Disable/Enable actions
- **Register School** form — creates brand + admin account in one step; displays credentials in a success banner
- **Enable / Disable school** — toggle school status without deleting data
- `/api/super/schools` (GET / POST) and `/api/super/stats` (GET) — protected by `requireSuper` middleware (403 if not `schoolId: system`)
- `/api/super/schools/:id` (PATCH) — update school status
- `scripts/seed-super-admin.js` — creates `super@bps.app` / PIN `9999` and populates `schools` collection
- `BPS Platform` brand for the `?school=system` login page (indigo theme)
- Super Admin quick-login button shown only on `?school=system`
- `schools` MongoDB collection tracks each tenant: id, name, motto, status, adminEmail, primaryColor, createdAt

### Changed
- `App.jsx` — routes `role: superadmin` to `SuperAdminApp` (bypasses all school data loading)
- `Login.jsx` — `QUICK_LOGINS.system` entry with Super Admin only
- `api.js` — four new super admin methods: `superStats`, `superSchools`, `superRegister`, `superUpdateSchool`

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
