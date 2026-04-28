# Run Guide

## Prerequisites

- **Node.js 24+** — [nodejs.org](https://nodejs.org)
- **pnpm 10+** — `npm install -g pnpm`
- **PostgreSQL** — running locally or a hosted connection string

---

## 1. Install Dependencies

```bash
pnpm install
```

---

## 2. Environment Variables

Create a `.env` file (or set these in your shell) before running any service.

### API Server (`artifacts/api-server/`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/datacollector` |
| `PORT` | Port the server listens on | `8080` |
| `NODE_ENV` | Runtime environment | `development` |

Create `artifacts/api-server/.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/datacollector
PORT=8080
NODE_ENV=development
```

### Mockup Sandbox (`artifacts/mockup-sandbox/`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port for the Vite dev server | `8081` |
| `BASE_PATH` | Base URL path | `/` |

Create `artifacts/mockup-sandbox/.env`:

```env
PORT=8081
BASE_PATH=/
```

---

## 3. Database Setup

Push the schema to your PostgreSQL database (run once, or after schema changes):

```bash
pnpm --filter @workspace/db run push
```

To force-overwrite an existing schema:

```bash
pnpm --filter @workspace/db run push-force
```

> `DATABASE_URL` must be set in your environment before running these commands.

---

## 4. Running the Services

### API Server (Backend)

```bash
pnpm --filter @workspace/api-server run dev
```

- Builds the server and starts it at `http://localhost:8080`
- Health check: `GET http://localhost:8080/healthz`

To run a pre-built version:

```bash

```
$env:PORT=8080; $env:NODE_ENV="development"; pnpm --filter @workspace/api-server run dev
---

### Mockup Sandbox (UI Component Dev)

```bash
pnpm --filter @workspace/mockup-sandbox run dev
```

- Starts the Vite dev server at `http://localhost:8081`
- Hot module replacement enabled

---

### Mobile App — Vitainspire (Expo / React Native)

> **Note:** The default `dev` script is configured for Replit. For local development use Expo CLI directly.

```bash
cd artifacts/vitainspire
npx expo start
```

Then choose your target:
- Press `w` — open in web browser
- Press `a` — open in Android emulator (requires Android Studio)
- Press `i` — open in iOS simulator (macOS + Xcode only)
- Scan QR code with **Expo Go** app on a physical device

---

## 5. Running Everything Together

Open three terminals and run each service in parallel:

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — UI Sandbox:**
```bash
pnpm --filter @workspace/mockup-sandbox run dev
```

**Terminal 3 — Mobile App:**
```bash
cd artifacts/vitainspire && npx expo start
```

---

## 6. Type Checking

Check types across the entire monorepo:

```bash
pnpm run typecheck
```

Check only shared libraries:

```bash
pnpm run typecheck:libs
```

---

## 7. Build for Production

Build all artifacts:

```bash
pnpm run build
```

This runs type checking first, then builds each artifact.

---

## 8. API Code Generation

If the OpenAPI spec changes, regenerate the client hooks and Zod schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Service Summary

| Service | Command | URL |
|---|---|---|
| API Server | `pnpm --filter @workspace/api-server run dev` | `http://localhost:8080` |
| UI Sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` | `http://localhost:8081` |
| Mobile App | `cd artifacts/vitainspire && npx expo start` | Expo DevTools |
| DB Schema Push | `pnpm --filter @workspace/db run push` | — |
