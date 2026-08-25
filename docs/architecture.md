# WhatsApp Auth — System Architecture & Design

## Architectural Philosophy

WhatsApp Auth is an open-source, application-agnostic, self-hosted identity provider. It enables developers to authenticate end-users via WhatsApp collecting verified user profile identity (**Full Name, Email Address, Mobile Number**) without traditional SMS carrier fees or OTP copying.

```
+-----------------------------------------------------------------------------------+
|                                DEVELOPER SERVER                                   |
|                                                                                   |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  | Developer Dashboard |   |    Auth Core API    |   |     WhatsApp Worker     |  |
|  | (Next.js 14 Console)|<->| (Fastify / Node.js) |<->| (Baileys WebSockets)    |  |
|  | - Setup Wizard      |   | - Challenge Engine  |   | - Baileys Adapter       |  |
|  | - App Management    |   | - OAuth2 / PKCE     |   | - QR Code Generator     |  |
|  | - Live Test Suite   |   | - SSE Event Bus     |   | - Inbound/Outbound msgs |  |
|  +---------------------+   +----------+----------+   +------------+------------+  |
|                                       |                           |               |
|                                       |   +-------------------+   |               |
|                                       +-->| PostgreSQL / DB   |<--+               |
|                                           | (Prisma ORM)      |                   |
|                                           +-------------------+                   |
+-----------------------------------------------------------------------------------+
```

---

## 1. Component Boundaries

### `apps/api` (Auth Core API)
- Fastify server with strict routing, request validation, OpenAPI documentation, and public health probe.
- Responsible for:
  - Cryptographic challenge generation (`AUTH-XXXX-XXXX`) and constant-time verification.
  - State machine lifecycle management (`INITIATED` -> `WAITING_FOR_WHATSAPP` -> `VERIFIED` -> `COMPLETED`).
  - OAuth 2.0 Authorization Code exchange and PKCE validation.
  - Client application management and exact redirect URI allowlisting.
  - Dynamic continuation URL generation per developer application.
  - Rate limiting and SSE event broadcasting.

### `apps/whatsapp-worker` (WhatsApp Automation Worker)
- Isolated Node.js daemon running `@whiskeysockets/baileys` multi-device WebSockets.
- Implements `IWhatsAppAdapter` interface for modularity.
- Responsible for:
  - Multi-device pairing and QR code streaming.
  - Persistent multi-device key storage in `.baileys_auth`.
  - Normalizing incoming messages to E.164.
  - Forwarding messages to Auth Core via internal authenticated webhook.
  - Sending outbound one-time login links to verified users.

### `apps/dashboard` (Developer Console)
- Next.js 14 React UI designed for self-hosting developers.
- Contains:
  - First-run setup wizard.
  - Real-time QR code display for WhatsApp device linking.
  - Application credential generator (Auth Server URL + Redirect URL).
  - Interactive live integration debugger and sandbox.
  - User and active session explorer with revocation.
  - Traceable audit logs.

---

## 2. Pluggable WhatsApp Adapter Pattern

The WhatsApp layer is isolated behind the `IWhatsAppAdapter` interface:

```typescript
export interface IWhatsAppAdapter {
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): WhatsAppConnectionStatus;
  getQrCode(): string | null;
  sendMessage(to: string, message: string): Promise<boolean>;
  on(event: 'qr' | 'ready' | 'message' | 'status' | 'disconnected', handler: any): void;
}
```

This allows swapping `BaileysAdapter` with `MockWhatsAppAdapter` for offline automated testing or future enterprise Meta Cloud API adapters with zero changes to the Auth API or database.
