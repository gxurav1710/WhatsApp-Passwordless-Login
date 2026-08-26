# Getting Started with WhatsApp Auth

This guide walks you through setting up and running your own self-hosted WhatsApp Authentication system.

---

## Prerequisites

- **Node.js**: v20.x or higher
- **PostgreSQL**: v14.x or higher (or Docker)
- **WhatsApp Account**: A phone number with WhatsApp installed (for production linking)

---

## 1. Quick Start with Docker (Recommended)

The easiest way to run the entire stack is with Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/your-org/whatsapp-auth.git
cd whatsapp-auth

# 2. Copy environment template
cp .env.example .env

# 3. Launch Docker Compose stack
docker compose up -d
```

Once running:
- **Developer Dashboard**: `http://localhost:3000`
- **Auth Core API**: `http://localhost:4000`
- **Health Check Probe**: `http://localhost:4000/health`
- **Swagger Documentation**: `http://localhost:4000/docs`

---

## 2. Quick Start for Local Development

To run services locally on your machine:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Build packages and push database schema
npm run build
npm --workspace=@whatsapp-auth/db run prisma:push

# 4. Start unified dev runner
npm run dev
```

---

## 3. Pairing Your WhatsApp Account

1. Open the Developer Dashboard at `http://localhost:3000`.
2. Navigate to **WhatsApp Connection** (or follow the **Setup Wizard**).
3. Scan the displayed QR code with your phone:
   - WhatsApp → **Settings** → **Linked Devices** → **Link a Device**.
4. Once paired via Baileys multi-device WebSockets, the status turns green (`CONNECTED`) displaying your bot's phone number.

> **Note**: For automated CI testing without a real WhatsApp phone, set `WHATSAPP_ADAPTER=mock` in your `.env`.

---

## 4. Creating Your First Application (2-URL Model)

1. Open the dashboard and go to **Applications** → **Create Application**.
2. Enter:
   - **Application Name**: (e.g. `My SaaS Web App`)
   - **Auth Server URL**: Public HTTPS URL of the Auth Server (e.g. `https://auth.example.com` or your Cloudflare tunnel)
   - **Redirect URL**: Whitelisted callback URL on your own website (e.g. `https://myapp.example.com/auth/callback` or `http://localhost:5000/auth/callback`)
3. Save your generated **Client ID** (`wa_client_...`) and single-view **Client Secret** (`wa_sec_...`).
4. Use `@whatsapp-auth/sdk` to integrate authentication into your website!
