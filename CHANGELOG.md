# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-25

### Added
- **Core Passwordless Engine**: Full reverse-challenge handshake mechanism via WhatsApp (`AUTH-XXXX-XXXX`).
- **OAuth 2.0 & PKCE**: Standard Authorization Code grant type with RFC 7636 Proof Key for Code Exchange (S256).
- **Verified Profile Collection**: First-class support for Full Name, Email Address, and Mobile Number identity collection with zero PII in deep links.
- **Baileys WebSockets**: Multi-device WhatsApp transport powered by `@whiskeysockets/baileys` with terminal and web QR streaming.
- **Single-Use Continuation Router**: Single-use cryptographic tokens (`/continue/:token`) burned atomically on consumption with 302 callback redirection.
- **2-URL Application Model**: Clean separation of Auth Server URL and Developer Website Redirect URL.
- **Developer Management Dashboard**: Next.js 14 console featuring Setup Wizard, Application credential manager, WhatsApp pairing, active session inspector, and test sandbox.
- **Official Client SDK**: `@whatsapp-auth/sdk` for Node.js and TypeScript applications with safe JSON response parsing.
- **Standalone Reference Consumer**: Zero-dependency Express reference application with Vercel serverless deployment support.
- **Docker Containerization**: Multi-container Docker Compose configuration with PostgreSQL 16, Fastify API, Worker daemon, and Dashboard.
- **Security Protections**: Constant-time `crypto.timingSafeEqual()` comparisons, sliding-window rate limiting, and exact redirect URI allowlisting.
