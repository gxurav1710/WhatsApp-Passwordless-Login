# 🚨 RELEASE BLOCKERS: Pre-Publish Checklist
**Audit Status:** Phase 1 Complete (Audit Only)

This document lists issues that **MUST be addressed before creating a public Git commit / publishing the repository**.

---

## 🛑 Blocker 1: Live WhatsApp Authentication Keys in `.baileys_auth`

- **Severity:** `CRITICAL (HIGH RISK OF SECURITY / CREDENTIAL EXPOSURE)`
- **Affected Path:** `.baileys_auth/` (specifically `creds.json`, `session-*.json`, `session-info.json`)
- **Why it Blocks Release:**
  The `.baileys_auth` folder contains active multi-device cryptographic session keys linked to a real WhatsApp phone number (`+918796266491`). If committed to a public Git repository, anyone could clone the repository and gain full access to the linked WhatsApp account.
- **Recommended Action (Future Phase):**
  1. Add `.baileys_auth/` to `.gitignore`.
  2. Ensure `.baileys_auth/` is removed from Git staging before initial release commit.
  3. Provide an empty `.gitkeep` or automated startup directory initialization in `apps/whatsapp-worker`.

---

## 🛑 Blocker 2: `.gitignore` Missing Baileys Session Directory

- **Severity:** `HIGH`
- **Affected File:** [`.gitignore`](file:///c:/Users/gaura/.gemini/antigravity-ide/scratch/WhatsApp%20Auth%20Login/.gitignore)
- **Why it Blocks Release:**
  `.gitignore` currently contains `.wwebjs_auth/` (from the old Puppeteer implementation) but **omits `.baileys_auth/`**. Any developer who clones the repo and runs the app will accidentally stage their private WhatsApp session into git.
- **Recommended Action (Future Phase):**
  Update `.gitignore` to:
  ```gitignore
  .baileys_auth/
  apps/whatsapp-worker/.baileys_auth/
  .wwebjs_auth/
  .wwebjs_auth_vis/
  .wwebjs_cache/
  folder-structure.txt
  ```

---

## 🛑 Blocker 3: Obsolete Scripts Referencing Deleted `whatsapp-web.js`

- **Severity:** `MEDIUM (BROKEN DEVELOPER TOOLING)`
- **Affected Files:**
  - `launch-whatsapp-web.bat`
  - `scripts/launch-whatsapp-web.ps1`
  - `scripts/control.ps1` (Option 4)
- **Why it Blocks Release:**
  Running Option 4 in `control.ps1` or executing `launch-whatsapp-web.bat` triggers an unhandled Node error trying to import `dist/adapters/whatsapp-webjs-adapter.js`, which no longer exists in the codebase.
- **Recommended Action (Future Phase):**
  1. Remove `launch-whatsapp-web.bat` and `scripts/launch-whatsapp-web.ps1`.
  2. Update Option 4 in `control.ps1` to display the pairing status or trigger terminal QR pairing.

---

## 🛑 Blocker 4: Legacy `WHATSAPP_ADAPTER=whatsapp-web.js` in `.env`

- **Severity:** `LOW (CONFUSING CONFIGURATION)`
- **Affected File:** [`.env`](file:///c:/Users/gaura/.gemini/antigravity-ide/scratch/WhatsApp%20Auth%20Login/.env)
- **Why it Blocks Release:**
  The `.env` file lists `WHATSAPP_ADAPTER=whatsapp-web.js`. The worker code gracefully defaults non-mock values to `baileys`, but having `whatsapp-web.js` in `.env` confuses new developers reading the config.
- **Recommended Action (Future Phase):**
  Change `.env` default to `WHATSAPP_ADAPTER=baileys`.

---

## 🛑 Blocker 5: 1.2 MB `folder-structure.txt` Artifact in Workspace Root

- **Severity:** `LOW (REPOSITORY BLOAT)`
- **Affected File:** `folder-structure.txt`
- **Why it Blocks Release:**
  The root directory contains a 1.2 MB full recursive directory dump file from development that bloats repository clone size.
- **Recommended Action (Future Phase):**
  Delete `folder-structure.txt` and `structure.bat`.
