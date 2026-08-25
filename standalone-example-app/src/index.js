import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WhatsAppAuthClient } from './whatsapp-auth-client.js';

// Load .env relative to project directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const redirectUri = process.env.REDIRECT_URI || `http://localhost:${port}/auth/callback`;

const authApiUrl = process.env.AUTH_API_URL || 'http://localhost:4000';
const authClientId = process.env.AUTH_CLIENT_ID || '';
const authClientSecret = process.env.AUTH_CLIENT_SECRET || '';

const defaultFullName = process.env.DEFAULT_FULL_NAME || '';
const defaultEmail = process.env.DEFAULT_EMAIL || '';
const defaultPhone = process.env.DEFAULT_PHONE || '';

if (!authClientId) {
  console.warn('[CONFIG WARNING] ⚠️ AUTH_CLIENT_ID is not set in .env! Please set AUTH_CLIENT_ID in your .env file.');
}

// Initialize Standalone WhatsApp Auth Client purely from environment configuration
const authClient = new WhatsAppAuthClient({
  baseUrl: authApiUrl,
  clientId: authClientId,
  clientSecret: authClientSecret || undefined,
});

// In-memory session store for demo app
const sessions = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. Home / Login Page
app.get('/', (req, res) => {
  const sessionId = req.cookies.session_id;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (session) {
    return res.redirect('/dashboard');
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in with WhatsApp | Standalone Consumer App</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0b0f19;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #111827;
      border: 1px solid #1f293d;
      border-radius: 20px;
      padding: 36px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(37, 211, 102, 0.12);
      color: #25d366;
      border: 1px solid rgba(37, 211, 102, 0.25);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 8px;
    }
    p {
      color: #94a3b8;
      font-size: 13.5px;
      margin: 0 0 24px;
      line-height: 1.5;
    }
    .input-group {
      margin-bottom: 16px;
      text-align: left;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      color: #cbd5e1;
    }
    input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #1f293d;
      background: #090d16;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      border-color: #25d366;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
    }
    .btn {
      width: 100%;
      background: #25d366;
      color: #0b0f19;
      font-weight: 700;
      padding: 14px;
      border-radius: 10px;
      border: none;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s, transform 0.1s;
      margin-top: 12px;
    }
    .btn:hover {
      background: #20ba5a;
    }
    .btn:active {
      transform: scale(0.99);
    }
    .btn-secondary {
      background: #1e293b;
      color: #f8fafc;
      font-size: 13px;
      padding: 10px 14px;
      text-decoration: none;
      margin-top: 12px;
      border: 1px solid #334155;
    }
    .btn-secondary:hover {
      background: #334155;
    }
    .status-box {
      display: none;
      margin-top: 24px;
      padding: 20px;
      background: #090d16;
      border: 1px solid #1f293d;
      border-radius: 14px;
      text-align: center;
      font-size: 14px;
    }
    .challenge-badge {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 16px;
      font-weight: 800;
      background: #111827;
      color: #38bdf8;
      padding: 8px 16px;
      border-radius: 8px;
      margin: 10px 0;
      border: 1px dashed #0284c7;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Standalone App</div>
    <h1>Sign in with WhatsApp</h1>
    <p>Secure, passwordless WhatsApp authentication collecting verified user identity.</p>

    <form id="login-form">
      <div class="input-group">
        <label for="fullName">Full Name</label>
        <input type="text" id="fullName" name="fullName" placeholder="e.g. John Doe" value="${defaultFullName}" required />
      </div>
      <div class="input-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" placeholder="e.g. user@example.com" value="${defaultEmail}" required />
      </div>
      <div class="input-group">
        <label for="phone">Mobile Number (with country code)</label>
        <input type="text" id="phone" name="phone" placeholder="e.g. +919876543210" value="${defaultPhone}" required />
      </div>
      <button type="submit" class="btn" id="submit-btn">
        <span>Continue with WhatsApp</span> 💬
      </button>
    </form>

    <div id="status-box" class="status-box">
      <div style="font-weight: 700; margin-bottom: 6px; color: #fff;" id="status-title">🚀 Handing off to WhatsApp...</div>
      <div style="color: #94a3b8; font-size: 13px;" id="status-desc">
        Opening WhatsApp with your pre-filled verification challenge:
      </div>
      <div id="challenge-display" class="challenge-badge">AUTH-....</div>
      <p style="color: #64748b; font-size: 12px; margin: 4px 0 14px;">
        Send this message in WhatsApp to verify your mobile number.
      </p>
      <a id="wa-direct-link" href="#" class="btn btn-secondary" target="_blank">
        Click here if WhatsApp didn't open automatically ↗
      </a>
    </div>
  </div>

  <script>
    const form = document.getElementById('login-form');
    const statusBox = document.getElementById('status-box');
    const submitBtn = document.getElementById('submit-btn');
    const challengeDisplay = document.getElementById('challenge-display');
    const waDirectLink = document.getElementById('wa-direct-link');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      submitBtn.disabled = true;
      submitBtn.innerText = 'Generating Challenge...';

      try {
        const res = await fetch('/api/auth/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, phone }),
        });

        const rawText = await res.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error('Server returned an unexpected non-JSON response (' + res.status + ' ' + res.statusText + '). Please verify that your Auth Server is running and that AUTH_API_URL is reachable.');
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to start login (' + res.status + ')');
        }

        const deepLink = data.whatsappDeepLink;
        const sseUrl = data.sseUrl;
        const challenge = data.challenge;

        if (challenge) challengeDisplay.innerText = challenge;
        if (deepLink) waDirectLink.href = deepLink;

        statusBox.style.display = 'block';
        submitBtn.style.display = 'none';

        if (deepLink) {
          window.location.href = deepLink;
        }

        // Live SSE status subscription
        if (sseUrl) {
          const evtSource = new EventSource(sseUrl);
          evtSource.addEventListener('auth_update', (e) => {
            const payload = JSON.parse(e.data);
            if (payload.state === 'VERIFIED') {
              document.getElementById('status-title').innerText = '✅ Challenge Received!';
              document.getElementById('status-desc').innerText = 'Check WhatsApp and tap the magic login link sent by the bot.';
              waDirectLink.style.display = 'none';
            } else if (payload.state === 'COMPLETED') {
              document.getElementById('status-title').innerText = '🎉 Login Complete!';
              document.getElementById('status-desc').innerText = 'Redirecting to your dashboard...';
              window.location.reload();
            }
          });
        }
      } catch (err) {
        alert(err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Continue with WhatsApp 💬';
      }
    });
  </script>
</body>
</html>
  `);
});

// 2. Initiate Auth Endpoint
app.post('/api/auth/start', async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const result = await authClient.initiate({
      fullName,
      email,
      phoneNumber: phone,
      redirectUri,
      state: 'csrf_standalone_token_123',
    });

    return res.json({
      success: true,
      attemptId: result.attemptId,
      challenge: result.challenge,
      whatsappDeepLink: result.whatsappDeepLink,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
      sseUrl: result.sseUrl,
    });
  } catch (err) {
    console.error('[STANDALONE APP] ❌ Failed to start auth:', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Application Continuation Route (Forwards click to Auth Server /continue/:token)
app.get('/continue/:token', (req, res) => {
  const { token } = req.params;
  return res.redirect(`${authApiUrl}/continue/${token}`);
});

// 4. OAuth 2.0 Callback Route
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code) {
    return res.status(400).send(`<h3>Authentication Failed</h3><p>${error || 'Missing authorization code'}</p>`);
  }

  try {
    const authResult = await authClient.exchangeCode({
      code,
      redirectUri,
    });

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessions.set(sessionId, {
      user: authResult.user,
      token: authResult.accessToken,
    });

    res.cookie('session_id', sessionId, { httpOnly: true });
    return res.redirect('/dashboard');
  } catch (err) {
    return res.status(400).send(`<h3>Exchange Failed</h3><p>${err.message}</p>`);
  }
});

// 5. Protected User Dashboard
app.get('/dashboard', (req, res) => {
  const sessionId = req.cookies.session_id;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    return res.redirect('/');
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Dashboard | Standalone App</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0b0f19;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #111827;
      border: 1px solid #1f293d;
      border-radius: 20px;
      padding: 36px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #25d366;
      color: #0b0f19;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
    }
    .info-row {
      background: #090d16;
      border: 1px solid #1f293d;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13.5px;
    }
    .info-label {
      color: #94a3b8;
      font-size: 12.5px;
      font-weight: 500;
    }
    .info-val {
      font-weight: 600;
      color: #f8fafc;
    }
    .badge-active {
      background: rgba(37, 211, 102, 0.12);
      color: #25d366;
      border: 1px solid rgba(37, 211, 102, 0.25);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .btn-logout {
      display: block;
      margin-top: 24px;
      text-align: center;
      background: #ef4444;
      color: #fff;
      padding: 12px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: background 0.2s;
    }
    .btn-logout:hover {
      background: #dc2626;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="avatar">✓</div>
      <div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Authenticated Successfully</h1>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Verified WhatsApp Identity Active</p>
      </div>
    </div>

    <div class="info-row">
      <span class="info-label">Full Name</span>
      <span class="info-val" style="color: #fff;">${session.user.fullName || 'Not Provided'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email Address</span>
      <span class="info-val" style="color: #38bdf8;">${session.user.email || 'Not Provided'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mobile Number</span>
      <span class="info-val" style="color: #25d366; font-family: monospace;">${session.user.phoneNumber}</span>
    </div>
    <div class="info-row">
      <span class="info-label">User ID</span>
      <span class="info-val" style="font-family: monospace; font-size: 12px; color: #94a3b8;">${session.user.id}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Status</span>
      <span class="badge-active">${session.user.status || 'ACTIVE'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Verified At</span>
      <span class="info-val" style="font-size: 12px;">${new Date(session.user.verifiedAt).toLocaleString()}</span>
    </div>

    <a href="/logout" class="btn-logout">Log Out</a>
  </div>
</body>
</html>
  `);
});

// 6. Logout Route
app.get('/logout', (req, res) => {
  const sessionId = req.cookies.session_id;
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie('session_id');
  res.redirect('/');
});

// Start local server if not in serverless runtime
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`📱 Standalone WhatsApp Auth App running at http://localhost:${port}`);
    console.log(`🔗 Target Auth API: ${authApiUrl}`);
    console.log(`🔑 Client ID: ${authClientId || '(Not configured in .env)'}`);
  });
}

export default app;
