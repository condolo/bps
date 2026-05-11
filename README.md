# BPS — Behaviour Point System

A multi-tenant SaaS platform for managing student behaviour across schools. Track merits, demerits, interventions, appeals, and house standings — accessible from any device.

## Live Demo

**Demo school (Mascit Lab Academy):** Add `?school=demo` to the app URL  
**Real school (St. Austin's Academy):** Default or `?school=saa`

Demo accounts (Mascit Lab Academy):

| Role | Email | PIN |
|------|-------|-----|
| Admin | demo.admin@mascitlab.ac.ke | 0000 |
| Pastoral Dean | demo.pastoral@mascitlab.ac.ke | 1111 |
| KS3 Coordinator | demo.ks3@mascitlab.ac.ke | 2222 |
| Class Teacher | demo.teacher@mascitlab.ac.ke | 3333 |
| Discipline | demo.discipline@mascitlab.ac.ke | 4444 |
| Student | demo.student@mascitlab.ac.ke | 5555 |
| Parent | demo.parent@mascitlab.ac.ke | 6666 |

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

All endpoints require `X-School-Id` header (e.g. `saa` or `demo`).

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

1. Run `SCHOOL_ID=newschool SCHOOL_NAME="New School" node scripts/seed-school.js`
2. Access via `?school=newschool`

## Schools

| ID | School | Status |
|----|--------|--------|
| `saa` | St. Austin's Academy, Nairobi | Production |
| `demo` | Mascit Lab Academy | Demo |
