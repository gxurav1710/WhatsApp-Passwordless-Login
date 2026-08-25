# 📦 RELEASE CANDIDATES: Complete File-by-File Classification
**Status:** Audit Only (Phase 1 — No files modified)

---

## 1. Classification Categories
- `[KEEP IN SOURCE]` — Essential production source code or configuration.
- `[GENERATE DURING BUILD]` — Built artifacts (`dist/`, `.next/`, prisma generated client).
- `[RUNTIME-ONLY / SENSITIVE DATA]` — Runtime state and authentication keys. **Must NOT be in Git.**
- `[ADD TO .gitignore]` — Machine-specific or persistent session folders to ignore.
- `[REMOVE BEFORE RELEASE]` — Obsolete development artifacts, scratch files, or dead scripts.
- `[DOCUMENT]` — Documentation files needing minor accuracy alignment.

---

## 2. Root Directory Files & Folders

| File / Path | Classification | Rationale |
| :--- | :--- | :--- |
| **`.baileys_auth/`** | `[RUNTIME-ONLY / SENSITIVE DATA]`, `[ADD TO .gitignore]` | Contains real WhatsApp multi-device encryption keys, device tokens, and phone numbers. Must be excluded from Git repository. |
| **`.wwebjs_auth_vis/`** | `[REMOVE BEFORE RELEASE]`, `[ADD TO .gitignore]` | Leftover Chrome profile cache from legacy `whatsapp-web.js` tests. |
| **`.wwebjs_cache/`** | `[REMOVE BEFORE RELEASE]`, `[ADD TO .gitignore]` | Dead browser cache from legacy tests. |
| **`.env`** | `[RUNTIME-ONLY / SENSITIVE DATA]`, `[ADD TO .gitignore]` | Local development configuration. Already ignored by `.gitignore`. |
| **`.env.example`** | `[KEEP IN SOURCE]` | Template environment file for new developers. |
| **`.gitignore`** | `[KEEP IN SOURCE]` | Needs future update to include `.baileys_auth/` and `folder-structure.txt`. |
| **`folder-structure.txt`** | `[REMOVE BEFORE RELEASE]` | 1.2MB recursive text dump generated during development. |
| **`LICENSE`** | `[KEEP IN SOURCE]` | MIT Open-Source License. |
| **`README.md`** | `[KEEP IN SOURCE]`, `[DOCUMENT]` | Main repository onboarding guide. |
| **`package.json`** | `[KEEP IN SOURCE]` | Root monorepo workspace definition. |
| **`package-lock.json`** | `[KEEP IN SOURCE]` | Dependency lockfile. |
| **`pnpm-workspace.yaml`** | `[KEEP IN SOURCE]` | PNPM monorepo configuration. |
| **`turbo.json`** | `[KEEP IN SOURCE]` | Turborepo pipeline configuration. |
| **`tsconfig.base.json`** | `[KEEP IN SOURCE]` | Base TypeScript compiler options. |
| **`vitest.config.ts`** | `[KEEP IN SOURCE]` | Automated testing runner configuration. |
| **`docker-compose.yml`** | `[KEEP IN SOURCE]` | Multi-container Docker orchestration for PostgreSQL, API, Worker, and Dashboard. |
| **`build-all.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/build-all.ps1`. |
| **`control.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/control.ps1`. |
| **`start-local.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/start-local.ps1`. |
| **`start-docker.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/start-docker.ps1`. |
| **`stop-docker.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/stop-docker.ps1`. |
| **`pause-docker.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/pause-docker.ps1`. |
| **`resume-docker.bat`** | `[KEEP IN SOURCE]` | Windows batch wrapper for `scripts/resume-docker.ps1`. |
| **`launch-whatsapp-web.bat`**| `[REMOVE BEFORE RELEASE]` | Obsolete wrapper calling deleted `whatsapp-web.js` adapter. |
| **`structure.bat`** | `[REMOVE BEFORE RELEASE]` | Development helper used to generate `folder-structure.txt`. |

---

## 3. Applications (`apps/`)

### A. Auth Core API (`apps/api`)
- `apps/api/package.json` — `[KEEP IN SOURCE]`
- `apps/api/tsconfig.json` — `[KEEP IN SOURCE]`
- `apps/api/src/index.ts` — `[KEEP IN SOURCE]` (Entry point)
- `apps/api/src/server.ts` — `[KEEP IN SOURCE]` (Fastify server & plugin registration)
- `apps/api/src/config.ts` — `[KEEP IN SOURCE]` (Environment validation)
- `apps/api/src/routes/auth.routes.ts` — `[KEEP IN SOURCE]` (Public OAuth endpoints)
- `apps/api/src/routes/continue.routes.ts` — `[KEEP IN SOURCE]` (One-time token consumption)
- `apps/api/src/routes/admin.routes.ts` — `[KEEP IN SOURCE]` (Dashboard admin endpoints)
- `apps/api/src/routes/internal.routes.ts` — `[KEEP IN SOURCE]` (Worker webhook receivers)
- `apps/api/src/services/auth.service.ts` — `[KEEP IN SOURCE]` (Core auth state coordinator)
- `apps/api/src/services/worker-client.service.ts` — `[KEEP IN SOURCE]` (API to Worker client)
- `apps/api/src/sse/sse-manager.ts` — `[KEEP IN SOURCE]` (Live SSE channel manager)
- `apps/api/dist/` — `[GENERATE DURING BUILD]`

### B. WhatsApp Worker Daemon (`apps/whatsapp-worker`)
- `apps/whatsapp-worker/package.json` — `[KEEP IN SOURCE]`
- `apps/whatsapp-worker/tsconfig.json` — `[KEEP IN SOURCE]`
- `apps/whatsapp-worker/src/index.ts` — `[KEEP IN SOURCE]` (Daemon entry point)
- `apps/whatsapp-worker/src/worker.ts` — `[KEEP IN SOURCE]` (Fastify worker service)
- `apps/whatsapp-worker/src/diagnostic.ts` — `[KEEP IN SOURCE]` (Useful developer diagnostic tool)
- `apps/whatsapp-worker/src/adapters/whatsapp-adapter.interface.ts` — `[KEEP IN SOURCE]`
- `apps/whatsapp-worker/src/adapters/baileys-adapter.ts` — `[KEEP IN SOURCE]` (Active primary transport)
- `apps/whatsapp-worker/src/adapters/mock-adapter.ts` — `[KEEP IN SOURCE]` (Mock transport for CI/unit tests)
- `apps/whatsapp-worker/dist/` — `[GENERATE DURING BUILD]`

### C. Developer Dashboard (`apps/dashboard`)
- `apps/dashboard/package.json` — `[KEEP IN SOURCE]`
- `apps/dashboard/next.config.js` — `[KEEP IN SOURCE]`
- `apps/dashboard/tailwind.config.js` — `[KEEP IN SOURCE]`
- `apps/dashboard/src/app/page.tsx` — `[KEEP IN SOURCE]`
- `apps/dashboard/src/app/layout.tsx` — `[KEEP IN SOURCE]`
- `apps/dashboard/src/app/globals.css` — `[KEEP IN SOURCE]`
- `apps/dashboard/src/components/*` — `[KEEP IN SOURCE]` (Overview, Applications, Wizard, Sandbox, Users, Logs, Docs)
- `apps/dashboard/src/context/*` — `[KEEP IN SOURCE]` (Live WhatsApp connection context)
- `apps/dashboard/src/lib/api-client.ts` — `[KEEP IN SOURCE]`
- `apps/dashboard/.next/` — `[GENERATE DURING BUILD]`

---

## 4. Shared Packages (`packages/`)

| Package | Files | Classification |
| :--- | :--- | :--- |
| **`packages/protocol`** | `auth.dto.ts`, `errors.ts`, `events.ts`, `models.ts`, `index.ts` | `[KEEP IN SOURCE]` |
| **`packages/security`** | `hash.ts`, `phone.ts`, `pkce.ts`, `random.ts`, `rate-limiter.ts`, `index.ts` | `[KEEP IN SOURCE]` |
| **`packages/core`** | `challenge-service.ts`, `token-service.ts`, `state-machine.ts`, `redirect-validator.ts`, `index.ts` | `[KEEP IN SOURCE]` |
| **`packages/db`** | `schema.prisma`, `client.ts`, `repositories/*`, `index.ts` | `[KEEP IN SOURCE]` |
| **`packages/sdk`** | `client.ts`, `types.ts`, `index.ts` | `[KEEP IN SOURCE]` (NPM Release candidate) |

---

## 5. Consumer & Reference Examples

| Path | Classification | Description |
| :--- | :--- | :--- |
| **`examples/example-app/`** | `[KEEP IN SOURCE]` | Monorepo consumer reference application. |
| **`standalone-example-app/`** | `[KEEP IN SOURCE]` | Isolated standalone consumer reference application (Vercel-ready). |

---

## 6. Scripts (`scripts/`)

| Script | Classification | Action for Future Release |
| :--- | :--- | :--- |
| `scripts/control.ps1` | `[KEEP IN SOURCE]` | Update Option 4 from legacy `launch-whatsapp-web.ps1` to QR inspection / pairing trigger. |
| `scripts/build-all.ps1` | `[KEEP IN SOURCE]` | Production/dev build orchestrator. |
| `scripts/start-local.ps1` | `[KEEP IN SOURCE]` | Local developer runner. |
| `scripts/start-docker.ps1` | `[KEEP IN SOURCE]` | Docker compose up script. |
| `scripts/stop-docker.ps1` | `[KEEP IN SOURCE]` | Docker compose down and process cleanup script. |
| `scripts/pause-docker.ps1` | `[KEEP IN SOURCE]` | Docker suspend script. |
| `scripts/resume-docker.ps1`| `[KEEP IN SOURCE]` | Docker resume script. |
| `scripts/launch-whatsapp-web.ps1` | `[REMOVE BEFORE RELEASE]` | Obsolete script attempting to import deleted `whatsapp-webjs-adapter.js`. |
