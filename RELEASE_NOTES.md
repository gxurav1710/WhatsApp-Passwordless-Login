# 🚀 Release Notes — WhatsApp Auth v1.0.0

**Initial Public Open-Source Release**

WhatsApp Auth is an open-source, self-hosted identity provider that enables developers to authenticate users using WhatsApp without SMS carrier fees or manual OTP copying.

---

## 🌟 Key Capabilities

1. **Passwordless WhatsApp Authentication**: Users initiate login on your website, send an automated challenge string (`AUTH-XXXX-XXXX`) in WhatsApp, and receive a magic continuation link that seamlessly logs them into your application.
2. **Verified User Identity**: Collects and validates **Full Name**, **Email Address**, and **Mobile Number** without exposing PII in WhatsApp deep links.
3. **Standard OAuth 2.0 & PKCE**: Plugs directly into standard OAuth 2.0 / OpenID Connect authorization code exchange architectures.
4. **Developer Control Console**: Modern Next.js 14 dashboard for managing OAuth client credentials, monitoring active user sessions, viewing live WhatsApp connection status, and running integration tests.
5. **Robust SDK & Standalone Reference**: Official `@whatsapp-auth/sdk` client and zero-monorepo standalone Express consumer app.
6. **Multi-Device Baileys Transport**: Modern WebSocket connection to WhatsApp with QR streaming and auto-reconnect.

---

## 📋 System Requirements

- **Node.js**: v20.0.0+ (v22 and v24 supported)
- **Database**: PostgreSQL 14+ (or Docker Compose)
- **WhatsApp**: Any active WhatsApp phone number for the bot

---

## 🚀 Getting Started

```bash
git clone <YOUR_REPO_URL>
cd whatsapp-auth
cp .env.example .env
docker compose up -d
```

Access the dashboard at **`http://localhost:3000`** and the API at **`http://localhost:4000`**.

---

## 🔒 Security Best Practices

- Always replace `CHANGE_ME_...` secrets in `.env` before deploying to production.
- Do not commit `.baileys_auth/` (it is protected by `.gitignore`).
- Ensure your Auth Server URL is secured with HTTPS in production.
