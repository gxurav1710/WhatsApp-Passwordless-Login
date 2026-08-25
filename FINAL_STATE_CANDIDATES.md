# 📦 FINAL STATE CANDIDATES: Complete File-by-File Classification
**Status:** Audit Only (Pre-Shipment State — No Existing Project Files Modified)

---

## 1. Classification Definitions
- `[KEEP]` — Core source code, tests, and configuration required for the public release repository.
- `[GENERATE]` — Build outputs (`dist/`, `.next/`, Prisma generated client).
- `[RUNTIME-ONLY / SENSITIVE DATA]` — Active session state, credentials, and cryptographic keys. **Must NOT be committed to Git.**
- `[IGNORE]` — Folders/files that must be added to `.gitignore`.
- `[REMOVE]` — Obsolete development artifacts, scratch scripts, or dead code.
- `[GENERALIZE / DOCUMENT]` — Configuration or docs containing test/personal URLs needing placeholder normalization.

---

## 2. Root Directory Files & Folders

| File / Path | Category | Release Action | Rationale |
| :--- | :--- | :--- | :--- |
| **`.baileys_auth/`** | `RUNTIME DATA` | `[RUNTIME-ONLY / SENSITIVE DATA]`, `[IGNORE]` | Contains active WhatsApp multi-device private encryption keys, tokens, and bot phone number (`+918796266491`). Must be untracked from Git before publishing. |
| **`.wwebjs_auth_vis/`** | `RUNTIME DATA` | `[REMOVE]`, `[IGNORE]` | Dead Chrome cache from obsolete `whatsapp-web.js` tests. |
| **`.wwebjs_cache/`** | `RUNTIME DATA` | `[REMOVE]`, `[IGNORE]` | Dead browser cache from obsolete tests. |
| **`.env`** | `CONFIGURATION` | `[RUNTIME-ONLY / SENSITIVE DATA]`, `[IGNORE]` | Local developer environment configuration. |
| **`.env.example`** | `CONFIGURATION` | `[KEEP]`, `[GENERALIZE / DOCUMENT]` | Clean template environment file for new developers. |
| **`.gitignore`** | `CONFIGURATION` | `[KEEP]` | Update to explicitly ignore `.baileys_auth/`, `apps/whatsapp-worker/.baileys_auth/`, `.wwebjs_auth_vis/`, `folder-structure.txt`. |
| **`folder-structure.txt`**| `BUILD ARTIFACT` | `[REMOVE]` | 1.2 MB text dump generated during development. |
| **`LICENSE`** | `DOCUMENTATION` | `[KEEP]` | Open-source MIT license. |
| **`README.md`** | `DOCUMENTATION` | `[KEEP]`, `[GENERALIZE / DOCUMENT]` | Main repository README and quickstart guide. |
| **`package.json`** | `CONFIGURATION` | `[KEEP]` | Root monorepo workspace definition. |
| **`package-lock.json`** | `CONFIGURATION` | `[KEEP]` | Dependency lockfile. |
| **`pnpm-workspace.yaml`**| `CONFIGURATION` | `[KEEP]` | Monorepo workspace config. |
| **`turbo.json`** | `CONFIGURATION` | `[KEEP]` | Turborepo pipeline configuration. |
| **`tsconfig.base.json`** | `CONFIGURATION` | `[KEEP]` | Shared TypeScript compiler configuration. |
| **`vitest.config.ts`** | `CONFIGURATION` | `[KEEP]` | Vitest test runner configuration. |
| **`docker-compose.yml`** | `CONFIGURATION` | `[KEEP]` | Docker orchestration file for PostgreSQL, API, Worker, and Dashboard. |
| **`build-all.bat`** | `CONFIGURATION` | `[KEEP]` | Windows batch build wrapper. |
| **`control.bat`** | `CONFIGURATION` | `[KEEP]` | Windows interactive control center wrapper. |
| **`start-local.bat`** | `CONFIGURATION` | `[KEEP]` | Local single-window runner wrapper. |
| **`start-docker.bat`** | `CONFIGURATION` | `[KEEP]` | Docker compose up wrapper. |
| **`stop-docker.bat`** | `CONFIGURATION` | `[KEEP]` | Docker compose down wrapper. |
| **`pause-docker.bat`** | `CONFIGURATION` | `[KEEP]` | Docker container pause wrapper. |
| **`resume-docker.bat`** | `CONFIGURATION` | `[KEEP]` | Docker container resume wrapper. |
| **`launch-whatsapp-web.bat`**| `LEGACY` | `[REMOVE]` | Obsolete batch wrapper for deleted `whatsapp-web.js` adapter. |
| **`structure.bat`** | `LEGACY` | `[REMOVE]` | Development helper used to generate `folder-structure.txt`. |

---

## 3. Applications (`apps/`)

### A. Auth Core API (`apps/api`)
- `apps/api/package.json` — `[KEEP]`
- `apps/api/tsconfig.json` — `[KEEP]`
- `apps/api/src/index.ts` — `[KEEP]` (API process bootstrap)
- `apps/api/src/server.ts` — `[KEEP]` (Fastify server, `/health`, CORS, Swagger, error handling)
- `apps/api/src/config.ts` — `[KEEP]` (Environment configuration loader)
- `apps/api/src/routes/auth.routes.ts` — `[KEEP]` (OAuth endpoints: `/initiate`, `/token`, `/verify-session`, SSE)
- `apps/api/src/routes/continue.routes.ts` — `[KEEP]` (One-time token verification & 302 redirect: `/continue/:token`)
- `apps/api/src/routes/admin.routes.ts` — `[KEEP]` (Dashboard management endpoints: `/api/v1/admin/*`)
- `apps/api/src/routes/internal.routes.ts` — `[KEEP]` (Worker internal webhooks: `/api/v1/internal/*`)
- `apps/api/src/services/auth.service.ts` — `[KEEP]` (Core auth state machine coordinator)
- `apps/api/src/services/worker-client.service.ts` — `[KEEP]` (API → Worker HTTP client)
- `apps/api/src/sse/sse-manager.ts` — `[KEEP]` (Live SSE connection and event broadcaster)
- `apps/api/dist/` — `[GENERATE]`

### B. WhatsApp Worker Daemon (`apps/whatsapp-worker`)
- `apps/whatsapp-worker/package.json` — `[KEEP]`
- `apps/whatsapp-worker/tsconfig.json` — `[KEEP]`
- `apps/whatsapp-worker/src/index.ts` — `[KEEP]` (Daemon process entry point)
- `apps/whatsapp-worker/src/worker.ts` — `[KEEP]` (Fastify daemon endpoints: `/internal/status`, `/internal/send`, `/internal/start-pairing`)
- `apps/whatsapp-worker/src/diagnostic.ts` — `[KEEP]` (CLI socket connectivity verification tool)
- `apps/whatsapp-worker/src/adapters/whatsapp-adapter.interface.ts` — `[KEEP]`
- `apps/whatsapp-worker/src/adapters/baileys-adapter.ts` — `[KEEP]` (Active Baileys multi-device socket adapter)
- `apps/whatsapp-worker/src/adapters/mock-adapter.ts` — `[KEEP]` (Offline mock adapter for automated CI tests)
- `apps/whatsapp-worker/dist/` — `[GENERATE]`

### C. Developer Dashboard (`apps/dashboard`)
- `apps/dashboard/package.json` — `[KEEP]`
- `apps/dashboard/next.config.js` — `[KEEP]`
- `apps/dashboard/tailwind.config.js` — `[KEEP]`
- `apps/dashboard/src/app/page.tsx` — `[KEEP]`
- `apps/dashboard/src/app/layout.tsx` — `[KEEP]`
- `apps/dashboard/src/app/globals.css` — `[KEEP]`
- `apps/dashboard/src/components/ApplicationsView.tsx` — `[KEEP]` (2-URL Model: Auth Server URL + Redirect URL)
- `apps/dashboard/src/components/SetupWizard.tsx` — `[KEEP]`
- `apps/dashboard/src/components/IntegrationWizardView.tsx` — `[KEEP]`
- `apps/dashboard/src/components/SandboxTesterView.tsx` — `[KEEP]`
- `apps/dashboard/src/components/UsersSessionsView.tsx` — `[KEEP]`
- `apps/dashboard/src/components/WhatsAppView.tsx` — `[KEEP]`
- `apps/dashboard/src/components/LogsView.tsx` — `[KEEP]`
- `apps/dashboard/src/components/HealthDocsView.tsx` — `[KEEP]`
- `apps/dashboard/src/context/WhatsAppContext.tsx` — `[KEEP]`
- `apps/dashboard/src/lib/api-client.ts` — `[KEEP]`
- `apps/dashboard/.next/` — `[GENERATE]`

---

## 4. Shared Packages (`packages/`)

| Package | Files | Category | Action |
| :--- | :--- | :--- | :--- |
| **`packages/protocol`** | `auth.dto.ts`, `errors.ts`, `events.ts`, `models.ts`, `index.ts` | `SOURCE CODE` | `[KEEP]` |
| **`packages/security`** | `hash.ts`, `phone.ts`, `pkce.ts`, `random.ts`, `rate-limiter.ts`, `index.ts` | `SOURCE CODE` | `[KEEP]` |
| **`packages/core`** | `challenge-service.ts`, `token-service.ts`, `state-machine.ts`, `redirect-validator.ts`, `index.ts` | `SOURCE CODE` | `[KEEP]` |
| **`packages/db`** | `schema.prisma`, `client.ts`, `repositories/*`, `index.ts` | `SOURCE CODE` | `[KEEP]` |
| **`packages/sdk`** | `client.ts`, `types.ts`, `index.ts`, `README.md` | `SOURCE CODE` | `[KEEP]` (Primary public package) |

---

## 5. Consumer & Reference Examples

| Path | Category | Action | Description |
| :--- | :--- | :--- | :--- |
| **`examples/example-app/`** | `TEST CODE` / `EXAMPLE` | `[KEEP]`, `[GENERALIZE / DOCUMENT]` | Monorepo reference Express app using `@whatsapp-auth/sdk`. |
| **`standalone-example-app/`**| `SOURCE CODE` / `EXAMPLE` | `[KEEP]`, `[GENERALIZE / DOCUMENT]` | Isolated consumer app with zero monorepo dependencies, native fetch client, and Vercel support. |

---

## 6. Scripts (`scripts/`)

| Script | Category | Action | Notes |
| :--- | :--- | :--- | :--- |
| `scripts/control.ps1` | `CONFIGURATION` | `[KEEP]` | Update Option 4 from legacy `launch-whatsapp-web.ps1` to QR pairing inspection. |
| `scripts/build-all.ps1` | `CONFIGURATION` | `[KEEP]` | Monorepo build orchestrator. |
| `scripts/start-local.ps1` | `CONFIGURATION` | `[KEEP]` | Local single-window runner. |
| `scripts/start-docker.ps1` | `CONFIGURATION` | `[KEEP]` | Docker startup script. |
| `scripts/stop-docker.ps1` | `CONFIGURATION` | `[KEEP]` | Docker shutdown and port cleanup script. |
| `scripts/pause-docker.ps1`| `CONFIGURATION` | `[KEEP]` | Docker suspend script. |
| `scripts/resume-docker.ps1`| `CONFIGURATION` | `[KEEP]` | Docker resume script. |
| `scripts/launch-whatsapp-web.ps1`| `LEGACY` | `[REMOVE]` | Obsolete script referencing deleted `whatsapp-webjs-adapter.js`. |

---

## 7. Docker Configurations (`docker/`)

| File | Category | Action | Notes |
| :--- | :--- | :--- | :--- |
| `docker/Dockerfile.api` | `CONFIGURATION` | `[KEEP]` | Uses `node:20-bullseye-slim` with OpenSSL 3.0 / 1.1 installed. |
| `docker/Dockerfile.worker`| `CONFIGURATION` | `[KEEP]` | Uses `node:20-bullseye-slim` for Baileys WebSockets. |
| `docker/Dockerfile.dashboard`| `CONFIGURATION` | `[KEEP]` | Uses `node:20-alpine` for Next.js 14 console. |

---

AUDIT ONLY — NO EXISTING PROJECT FILES WERE MODIFIED BY THIS AUDIT.
