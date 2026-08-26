# ⚡ 5-Minute Quickstart Guide

Get the complete WhatsApp Auth platform running in 5 minutes.

---

## 1. Start the Platform

```bash
git clone https://github.com/your-org/whatsapp-auth.git
cd whatsapp-auth
cp .env.example .env
docker compose up -d
```

---

## 2. Connect Your WhatsApp Account

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. In WhatsApp on your bot phone, go to **Settings** → **Linked Devices** → **Link a Device**.
3. Scan the QR code displayed on the screen.

---

## 3. Register Your App

1. In Dashboard, click **Applications** → **Create Application**.
2. Enter:
   - **Auth Server URL**: `http://localhost:4000` *(or your public HTTPS tunnel)*
   - **Redirect URL**: `http://localhost:5000/auth/callback`
3. Copy your **Client ID** and **Client Secret**.

---

## 4. Run the Standalone Example App

```bash
cd standalone-example-app
cp .env.example .env
# Edit .env with your Client ID and Client Secret
npm install
npm run dev
```

Open **[http://localhost:5000](http://localhost:5000)** and test the complete login flow!
