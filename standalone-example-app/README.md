# Standalone WhatsApp Authentication Consumer App

A completely **self-contained, standalone web application** demonstrating passwordless WhatsApp authentication with **Full Name**, **Email Address**, and **Mobile Number** verification.

> 📦 **Zero Monorepo Dependencies**: You can copy this entire `standalone-example-app` folder to **any drive, folder, machine, or server** and run it independently!

---

## ⚡ Quick Start (Run in 3 Steps)

### 1. Copy Folder Anywhere
Copy the `standalone-example-app` folder to any directory or drive of your choice, for example:
* `C:\Projects\my-whatsapp-app`
* `D:\standalone-example-app`
* `/home/user/my-app`

### 2. Install Standard Dependencies
Open your terminal in that folder and run:
```bash
npm install
```

### 3. Configure `.env`
Ensure your `.env` file points to your WhatsApp Auth Core Server:
```env
PORT=5000
AUTH_API_URL=http://localhost:4000
AUTH_CLIENT_ID=wa_client_15fde3b2ff8c8b25d9d9b480
AUTH_CLIENT_SECRET=wa_sec_XrAmOqeAVziXPNJfIA8VyzpvadzP7znULy7LkVDZZ9I
```

### 4. Start the Application
```bash
npm start
```
*(Or `npm run dev` for auto-reloading)*

Open your browser at **[http://localhost:5000](http://localhost:5000)**.

---

## 🏗️ Project Structure

```text
standalone-example-app/
├── .env                          # App & Auth Server configuration
├── .env.example                  # Template configuration
├── .gitignore                    # Git exclusions
├── package.json                  # Standalone NPM package definition
├── README.md                     # Documentation & usage guide
└── src/
    ├── index.js                  # Express web app (login, callback, dashboard)
    └── whatsapp-auth-client.js   # Zero-dependency WhatsApp Auth API client
```

---

## 🔄 Complete Authentication Flow

```text
1. User enters: Full Name, Email, Mobile Number
       ↓
2. App calls POST /api/v1/auth/initiate
       ↓
3. App receives pre-filled wa.me deep link with challenge (AUTH-XXXX-XXXX)
       ↓
4. User taps send in WhatsApp
       ↓
5. Auth Worker confirms challenge & replies with single-use magic login link
       ↓
6. User clicks login link in WhatsApp
       ↓
7. Auth Server validates link and redirects to /auth/callback?code=...
       ↓
8. App exchanges authorization code via POST /api/v1/auth/token
       ↓
9. Verified identity is established & displayed on User Dashboard:
   - Full Name
   - Email Address
   - Mobile Number
   - User ID
   - Status & Verified Timestamp
```

---

## 🔒 Security & Privacy Features

* **Privacy Guaranteed**: The WhatsApp message and URL contain **ONLY** the random challenge code (`AUTH-XXXX-XXXX`). No personal data (Name/Email) is transmitted through WhatsApp links or chats.
* **Phone Identity Anchor**: The verified WhatsApp mobile number serves as the cryptographic identity anchor.
* **Single-Use Authorization Codes**: OAuth 2.0 authorization codes expire in 60 seconds and can only be exchanged once.
