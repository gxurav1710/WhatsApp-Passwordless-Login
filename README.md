# 💬 WhatsApp Auth — Self-Hosted Passwordless Authentication Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-45%2F45%20Passing-brightgreen.svg)](https://github.com/)

An **open-source, self-hosted, passwordless authentication platform** powered by WhatsApp. Collect verified user identity (**Full Name, Email Address, and Mobile Number**) with standard OAuth 2.0 and PKCE without SMS carrier fees or manual OTP entry.

---

## 🌟 How It Works

No SMS codes. No copy-pasting numbers. A frictionless reverse-challenge handshake:

```text
User fills Name, Email, and Mobile on your website
                       ↓
Website initiates auth & opens WhatsApp with pre-filled challenge: "AUTH-XXXX-XXXX"
                       ↓
User taps SEND in WhatsApp
                       ↓
Baileys Worker daemon verifies challenge in constant-time
                       ↓
WhatsApp bot replies with one-time magic continuation link:
"✅ Verified! Tap here to sign in: https://auth.example.com/continue/<TOKEN>"
                       ↓
User taps link → Auth Server consumes token (120s TTL) & generates 60s Authorization Code
                       ↓
Auth Server redirects to your application: https://myapp.example.com/auth/callback?code=<CODE>
                       ↓
Your server exchanges authorization code for verified user profile & creates session
```

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPER CONTROL CENTER                           │
│                      Next.js 14 Dashboard (:3000)                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST Admin / WS Status
                                       ▼
┌──────────────────────────────┐     ┌────────────────────────────────────────┐     ┌──────────────────────────────┐
│     Your Web Application     │OAuth│          Auth Core API (:4000)         │In-  │    WhatsApp Worker Daemon    │
│ (Next.js / Express / Django) │───> │     Fastify OAuth2 & Token Router      │ternal│    Baileys WebSockets (:4001)│
└──────────────────────────────┘     └───────────────────┬────────────────────┘     └──────────────┬───────────────┘
                                                         │                                         │
                                                         │ Prisma Client                           │ WhatsApp Socket
                                                         ▼                                         ▼
                                     ┌────────────────────────────────────────┐     ┌──────────────────────────────┐
                                     │        PostgreSQL Database (:5432)     │     │      WhatsApp Mobile App     │
                                     └────────────────────────────────────────┘     └──────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.0.0+ (v22 / v24 supported)
- **Database**: PostgreSQL 14+ (or Docker)
- **WhatsApp Account**: Any standard or business WhatsApp number for the bot

---

### Option A: Docker Deployment (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/whatsapp-auth.git
cd whatsapp-auth

# 2. Configure environment
cp .env.example .env

# 3. Start all services in Docker
docker compose up -d
```

### Option B: Local Node.js Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Build monorepo packages
npm run build

# 4. Push database schema
npm --workspace=@whatsapp-auth/db run prisma:push

# 5. Start unified local dev stack
npm run dev
```

### Service Ports:
- **Developer Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Auth Core REST API**: [http://localhost:4000](http://localhost:4000)
- **Public API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **Interactive Swagger / OpenAPI Docs**: [http://localhost:4000/docs](http://localhost:4000/docs)
- **WhatsApp Worker Daemon**: [http://localhost:4001](http://localhost:4001)

---

## 📱 WhatsApp Device Pairing

1. Open the Developer Dashboard at [http://localhost:3000](http://localhost:3000).
2. Follow the **First-Run Setup Wizard** or click **WhatsApp Connection**.
3. Open WhatsApp on your dedicated bot phone:
   - Go to **Settings** → **Linked Devices** → **Link a Device**.
4. Scan the live QR code on your dashboard screen.
5. The status will immediately update to **CONNECTED** displaying the bot's phone number.

---

## 🔑 Creating Your Application (2-URL Model)

In the Dashboard, navigate to **Applications** → **Create Application**:

| Field | Description | Example |
| :--- | :--- | :--- |
| **Application Name** | Label for your project | `My SaaS Platform` |
| **Auth Server URL** | Public HTTPS endpoint of your Auth API | `https://auth.example.com` *(or tunnel)* |
| **Redirect URL** | Callback URL hosted on your website | `https://myapp.example.com/auth/callback` |

> 💡 **What about the Continuation URL?**  
> You do **not** configure a Continue URL. The Auth Server generates `https://auth.example.com/continue/<TOKEN>` automatically and handles the token verification and 302 callback redirection internally.

---

## 💻 Integrating Into Your Existing Website

### 1. Install the SDK

```bash
npm install @whatsapp-auth/sdk
```

*(Or use native `fetch` from the standalone example)*

### 2. Backend Implementation (Express / Next.js API route)

```typescript
import express from 'express';
import { WhatsAppAuthClient } from '@whatsapp-auth/sdk';

const app = express();
app.use(express.json());

const authClient = new WhatsAppAuthClient({
  baseUrl: process.env.AUTH_API_URL,           // e.g. https://auth.example.com
  clientId: process.env.AUTH_CLIENT_ID,         // e.g. wa_client_...
  clientSecret: process.env.AUTH_CLIENT_SECRET, // e.g. wa_sec_...
});

// Route 1: Initiate login with Name, Email & Phone
app.post('/api/auth/start', async (req, res) => {
  const { fullName, email, phone } = req.body;

  const result = await authClient.initiate({
    fullName,
    email,
    phoneNumber: phone,
    redirectUri: 'https://myapp.example.com/auth/callback',
    state: 'csrf_random_state_string',
  });

  // Returns { whatsappDeepLink, sseUrl, challenge, expiresIn }
  res.json({
    deepLink: result.whatsappDeepLink,
    sseUrl: result.sseUrl,
  });
});

// Route 2: OAuth 2.0 Callback Handler
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  const { user, accessToken } = await authClient.exchangeCode({
    code: String(code),
    redirectUri: 'https://myapp.example.com/auth/callback',
  });

  // User identity verified!
  console.log('User ID:', user.id);
  console.log('Full Name:', user.fullName);
  console.log('Email:', user.email);
  console.log('Mobile Number:', user.phoneNumber);

  // Set session cookie and redirect to user dashboard
  req.session.userId = user.id;
  res.redirect('/dashboard');
});
```

---

## 📡 REST API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service health & uptime probe |
| `GET` | `/docs` | Public | Interactive Swagger documentation |
| `POST` | `/api/v1/auth/initiate` | Client ID | Start login session & generate WhatsApp deep link |
| `GET` | `/api/v1/auth/events/:attemptId`| Public | Server-Sent Events (SSE) live auth status stream |
| `GET` | `/continue/:token` | Public | Single-use magic token consumption & 302 redirect |
| `POST` | `/api/v1/auth/token` | Client Secret | Exchange authorization code for verified user & token |
| `POST` | `/api/v1/auth/verify-session` | Bearer Token | Introspect active user session |
| `GET` | `/api/v1/admin/*` | Admin API Key| Applications, sessions, users & audit logs |

---

## 🌐 Testing on Mobile (Cloudflare Tunnel Setup)

When testing WhatsApp authentication from a real mobile phone, your phone's browser cannot reach `http://localhost:4000`. Expose port 4000 using Cloudflare Tunnel:

```bash
# Expose local Auth API on port 4000
cloudflared tunnel --url http://127.0.0.1:4000
```

1. Copy the generated `https://<tunnel-id>.trycloudflare.com` URL.
2. In Dashboard → **Applications**, set **Auth Server URL** to this tunnel URL.
3. In your application's `.env`, set `AUTH_API_URL=https://<tunnel-id>.trycloudflare.com`.

---

## 🛡️ Security Architecture

- **Zero PII in Deep Links**: User names and emails are never exposed in WhatsApp deep links or message text. Deep links only contain the random challenge string (`AUTH-XXXX-XXXX`).
- **Single-Use Burn Tokens**: Continuation tokens are hashed with SHA-256 and burned immediately upon first consumption (`VERIFIED` → `COMPLETED`), completely preventing replay attacks.
- **Strict Redirect Whitelisting**: Exact-match URL verification prevents open-redirect vulnerabilities.
- **PKCE Support**: Proof Key for Code Exchange (S256) protects public SPAs and native mobile apps.
- **Constant-Time Verification**: All challenge and hash comparisons use `crypto.timingSafeEqual()` to guard against timing attacks.

---

## 🧪 Testing

```bash
# Run unit test suite
npx vitest run tests/unit

# Run full monorepo build
npm run build
```

---

## 📄 License

Released under the [MIT License](LICENSE).
