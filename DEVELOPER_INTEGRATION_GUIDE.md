# 🛠️ DEVELOPER INTEGRATION GUIDE: Adding WhatsApp Auth to Your Existing Website

This guide walks you through integrating self-hosted WhatsApp passwordless authentication into an existing web application (Next.js, Express, Django, Laravel, Rails, or FastAPI).

---

## 🧭 The Core Architecture in 30 Seconds

```
Your Website (e.g. https://myapp.example.com)
     ↓ 1. Collects Name, Email, Phone & calls /api/v1/auth/initiate
Auth Server (e.g. https://auth.example.com)
     ↓ 2. Returns WhatsApp deep link with challenge: AUTH-XXXX-XXXX
User's Phone & WhatsApp App
     ↓ 3. Sends challenge message to your WhatsApp bot
Auth Server & WhatsApp Worker
     ↓ 4. Verifies challenge & replies with magic link: https://auth.example.com/continue/<TOKEN>
User Taps Link in WhatsApp
     ↓ 5. Auth Server consumes token & redirects to: https://myapp.example.com/auth/callback?code=<CODE>
Your Website Backend
     ↓ 6. Calls /api/v1/auth/token with code & receives verified { id, fullName, email, phoneNumber }
Authenticated User Session Created!
```

---

## Step 1: Self-Host the Auth Platform

Start the Auth Server and expose port 4000 to the public internet:

```bash
# Clone & start with Docker
git clone https://github.com/your-org/whatsapp-auth.git
cd whatsapp-auth
cp .env.example .env
docker compose up -d
```

Ensure your Auth Server has a public HTTPS URL (e.g. `https://auth.example.com` or Cloudflare Tunnel `https://abc123.trycloudflare.com`).

---

## Step 2: Connect Your WhatsApp Bot Account

1. Open your Dashboard at `http://localhost:3000`.
2. Navigate to **WhatsApp Connection**.
3. Open WhatsApp on your bot phone → **Settings** → **Linked Devices** → **Link a Device**.
4. Scan the QR code on the screen. The status will update to **CONNECTED**.

---

## Step 3: Register Your Application in the Dashboard

1. In the Dashboard, click **Applications** → **Create Application**.
2. Provide:
   - **Application Name**: `My Website`
   - **Auth Server URL**: `https://auth.example.com` *(public endpoint where your Auth Server is hosted)*
   - **Redirect URL**: `https://myapp.example.com/auth/callback` *(callback route on your website)*
3. Copy the generated **Client ID** (`wa_client_...`) and **Client Secret** (`wa_sec_...`).

---

## Step 4: Configure Your Website Backend

Add the credentials to your website's `.env`:

```env
AUTH_API_URL=https://auth.example.com
AUTH_CLIENT_ID=wa_client_xxxxxxxxxxxxxxxxxxxxxxxx
AUTH_CLIENT_SECRET=wa_sec_yyyyyyyyyyyyyyyyyyyyyyyy
AUTH_REDIRECT_URI=https://myapp.example.com/auth/callback
```

---

## Step 5: Implement Authentication Routes in Your App

### Node.js / Express Example (Using `@whatsapp-auth/sdk`)

```bash
npm install @whatsapp-auth/sdk express cookie-parser
```

```javascript
import express from 'express';
import cookieParser from 'cookie-parser';
import { WhatsAppAuthClient } from '@whatsapp-auth/sdk';

const app = express();
app.use(express.json());
app.use(cookieParser());

const authClient = new WhatsAppAuthClient({
  baseUrl: process.env.AUTH_API_URL,
  clientId: process.env.AUTH_CLIENT_ID,
  clientSecret: process.env.AUTH_CLIENT_SECRET,
});

// 1. Start Authentication
app.post('/api/auth/start', async (req, res) => {
  const { fullName, email, phone } = req.body;

  try {
    const result = await authClient.initiate({
      fullName,
      email,
      phoneNumber: phone,
      redirectUri: process.env.AUTH_REDIRECT_URI,
      state: 'csrf_protection_state_token',
    });

    res.json({
      success: true,
      whatsappDeepLink: result.whatsappDeepLink,
      sseUrl: result.sseUrl,
      challenge: result.challenge,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Handle OAuth 2.0 Callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  try {
    const { user, accessToken } = await authClient.exchangeCode({
      code: String(code),
      redirectUri: process.env.AUTH_REDIRECT_URI,
    });

    // Verified User Profile returned by Auth Server:
    console.log('User ID:', user.id);
    console.log('Full Name:', user.fullName);
    console.log('Email:', user.email);
    console.log('Mobile Number:', user.phoneNumber);

    // Save session in your own database / cookie
    res.cookie('session_token', accessToken, { httpOnly: true, secure: true });
    res.redirect('/dashboard');
  } catch (err) {
    res.status(400).send(`Authentication failed: ${err.message}`);
  }
});
```

---

## Step 6: Frontend Form & WhatsApp Handoff

```html
<!-- Login Form -->
<form id="login-form">
  <input type="text" id="fullName" placeholder="Full Name" required />
  <input type="email" id="email" placeholder="Email Address" required />
  <input type="tel" id="phone" placeholder="Mobile Number (+1...)" required />
  <button type="submit">Continue with WhatsApp 💬</button>
</form>

<script>
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    const res = await fetch('/api/auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone }),
    });
    const data = await res.json();

    if (data.success) {
      // Automatically open WhatsApp with pre-filled verification challenge
      window.location.href = data.whatsappDeepLink;

      // Optional: Listen for live status update via Server-Sent Events (SSE)
      const sse = new EventSource(data.sseUrl);
      sse.addEventListener('auth_update', (event) => {
        const payload = JSON.parse(event.data);
        if (payload.state === 'COMPLETED') {
          window.location.href = '/dashboard';
        }
      });
    } else {
      alert('Error: ' + data.error);
    }
  });
</script>
```

---

## ❓ Frequently Asked Questions

### 1. Do I need to build a `/continue` route on my website?
**No.** The continuation route (`/continue/:token`) is owned and handled entirely by the self-hosted Auth Server. When the user taps the link in WhatsApp, the Auth Server consumes the one-time token, converts it into a standard OAuth authorization code, and redirects the user to your registered **Redirect URL** (`/auth/callback`).

### 2. Can I use this without the SDK?
**Yes.** The platform uses standard OAuth 2.0 endpoints. You can use native `fetch` or standard OAuth client libraries in Python, PHP, Ruby, or Go. (See `docs/rest-api.md` for raw JSON schemas).
