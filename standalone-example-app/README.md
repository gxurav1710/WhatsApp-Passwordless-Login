# Standalone WhatsApp Authentication Consumer App

A completely **self-contained, standalone web application** demonstrating passwordless WhatsApp authentication with **Full Name**, **Email Address**, and **Mobile Number** verification.

> 📦 **Zero Monorepo Dependencies**: You can copy this entire `standalone-example-app` folder to **any drive, folder, machine, or server** and run it independently!

---

## ⚡ Quick Start (Run in 4 Steps)

### 1. Copy Folder Anywhere (Optional)
You can run this app directly in this folder or copy `standalone-example-app` to any directory or server:
* `C:\Projects\my-whatsapp-app`
* `/home/user/my-app`

### 2. Install Dependencies
Open your terminal inside `standalone-example-app` and run:
```bash
npm install
```

> **Note:** A build step (`npm run build`) is **not required** because this standalone application runs directly with standard Node.js (`node src/index.js`).

### 3. Configure `.env`
Copy the environment template:
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit your `.env` file with your WhatsApp Auth Server and registered Application credentials:
```env
PORT=5000
AUTH_API_URL=http://localhost:4000
AUTH_CLIENT_ID=YOUR_CLIENT_ID
AUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET
REDIRECT_URI=http://localhost:5000/auth/callback
```

#### How to get your Client ID & Secret:
1. Ensure your WhatsApp Auth Server & Dashboard are running (`http://localhost:3000`).
2. Navigate to **Applications** → **Create Application**.
3. Set **Application Name**: `Standalone Example App`.
4. Set **Redirect URI**: `http://localhost:5000/auth/callback`.
5. Copy the generated **Client ID** and **Client Secret** into your `.env` file.

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
