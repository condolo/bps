# BPS — Behaviour Point System

A multi-tenant SaaS platform for managing student behaviour across schools. Track merits, demerits, interventions, appeals, and house standings — accessible from any device.

## Portals

| URL | School | Purpose |
|-----|--------|---------|
| `/` (default) | Demo School | Public demo — all roles available |
| `?school=saa` | St. Austin's Academy | Private — direct link only |
| `?school=system` | BPS Platform | Super Admin — manage all schools (private) |

## Live Demo

**Demo school (Demo School):** Default URL — no param needed  
**Real schools:** Direct private links only (e.g. `?school=saa`) — never shown publicly

**Super Admin:** `?school=system` (private)

| Role | Email | PIN |
|------|-------|-----|
| Super Admin | super@bps.app | 9999 |

**Demo school:** default URL

| Role | Email | PIN |
|------|-------|-----|
| Admin | demo.admin@demo.bps.app | 0000 |
| Pastoral Dean | demo.pastoral@demo.bps.app | 1111 |
| KS3 Coordinator | demo.ks3@demo.bps.app | 2222 |
| Class Teacher | demo.teacher@demo.bps.app | 3333 |
| Discipline | demo.discipline@demo.bps.app | 4444 |
| Student | demo.student@demo.bps.app | 5555 |
| Parent | demo.parent@demo.bps.app | 6666 |

## Tech Stack

- **Backend:** Node.js + Express, MongoDB Atlas
- **Frontend:** Vite + React 18, useReducer with optimistic updates
- **Hosting:** Render (web service)
- **Auth:** Email + PIN (no OAuth dependency)

## Project Structure

```
BPP/
├── server.js              # Express REST API — all endpoints
├── migrate-to-mongo.js    # One-time migration: data.json → MongoDB
├── scripts/
│   ├── seed-demo.js       # Seeds Mascit Lab Academy demo school
│   └── add-school-ids.js  # Migration: adds schoolId to existing records
├── render.yaml            # Render deployment config
├── vite.config.js         # Dev proxy: /api → localhost:3001
├── index.html
└── src/
    ├── App.jsx            # Root: session, data loading, serverDispatch
    ├── api.js             # All fetch calls, schoolId header injection
    ├── reducer.js         # Local UI state
    ├── constants.js       # Houses, classes, behaviour matrix
    ├── helpers.js         # Merit/demerit totals, stage, milestone logic
    ├── styles.js          # Shared style objects
    └── components/
        ├── Login.jsx      # Login page + quick-login buttons per school
        ├── Shared.jsx     # BrandLogo, StatCard, Row
        ├── StaffApp.jsx   # All staff views
        ├── StudentApp.jsx # Student portal
        └── ParentApp.jsx  # Parent portal
```

## API Endpoints

### School endpoints
All require `X-School-Id` header (e.g. `saa` or `demo`).

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login with email + PIN |
| GET/POST | /api/students | List / add student |
| POST | /api/students/bulk | Bulk import |
| DELETE | /api/students/:id | Remove student |
| GET/POST | /api/users | List / add user |
| DELETE | /api/users/:id | Remove user |
| GET/POST | /api/logs | List / add behaviour log |
| GET | /api/notifications | List notifications (sorted) |
| PATCH | /api/notifications/:id/read | Mark notification read |
| GET/POST | /api/appeals | List / submit appeal |
| PATCH | /api/appeals/:id | Resolve appeal or add parent note |
| GET/PUT | /api/brand | Get / update school brand settings |

### Super Admin endpoints
Require `X-School-Id: system`. Return 403 for any other school.

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/super/stats | Platform-wide counts (schools, students, users) |
| GET | /api/super/schools | All schools with live student/staff/parent counts |
| POST | /api/super/schools | Register new school (creates brand + admin account) |
| PATCH | /api/super/schools/:id | Update school status (active/inactive) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `NODE_ENV` | Yes (Render) | Set to `production` |
| `PORT` | Auto (Render) | Server port |

## Local Development

```bash
# Install dependencies
npm install

# Set env var (PowerShell)
$env:MONGODB_URI = "mongodb+srv://..."

# Start both servers
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

## Deployment (Render)

Build command: `npm install && npm run build`  
Start command: `node server.js`

Set `MONGODB_URI` and `NODE_ENV=production` in Render environment variables.

## Adding a New School

**Via Super Admin portal (recommended):**
1. Go to `?school=system` → login as `super@bps.app` / `9999`
2. Click **Register School** → fill the form → submit
3. Admin credentials appear instantly in a success banner
4. School is live immediately at `?school=<id>`

**Via script (first-time setup / production seeding):**
```bash
node scripts/seed-super-admin.js   # creates super admin + schools collection
node scripts/seed-demo.js          # seeds Demo School demo data
node scripts/add-school-ids.js     # tags existing records with schoolId
```

## File Structure (scripts)

```
scripts/
├── seed-super-admin.js   # Super admin user + schools collection
├── seed-demo.js          # Demo School + dummy students
├── add-school-ids.js     # Migration: adds schoolId:'saa' to existing records
└── (migrate-to-mongo.js) # One-time JSON → MongoDB migration (already run)
```

## Schools

| ID | School | Status |
|----|--------|--------|
| `system` | BPS Platform (Super Admin) | Internal |
| `saa` | St. Austin's Academy, Nairobi | Production |
| `demo` | Demo School | Demo (default URL) |
