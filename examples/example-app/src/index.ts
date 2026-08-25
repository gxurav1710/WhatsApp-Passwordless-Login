import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WhatsAppAuthClient } from '@whatsapp-auth/sdk';

// Load .env from current directory first, then root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback to root .env

const app = express();
const port = Number(process.env.EXAMPLE_APP_PORT || process.env.PORT || 5000);
const redirectUri = process.env.REDIRECT_URI || `http://localhost:${port}/auth/callback`;

const authApiUrl = (process.env.AUTH_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const authClientId = process.env.AUTH_CLIENT_ID || '';
const authClientSecret = process.env.AUTH_CLIENT_SECRET || '';

const defaultFullName = process.env.DEFAULT_FULL_NAME || '';
const defaultEmail = process.env.DEFAULT_EMAIL || '';
const defaultPhone = process.env.DEFAULT_PHONE || '';

if (!authClientId) {
  console.warn('[CONFIG WARNING] ⚠️ AUTH_CLIENT_ID is not set in .env! Please set AUTH_CLIENT_ID in your .env file.');
}

// Initialize WhatsApp Auth SDK Client purely from environment configuration
const authClient = new WhatsAppAuthClient({
  baseUrl: authApiUrl,
  clientId: authClientId,
  clientSecret: authClientSecret || undefined,
});

// In-memory session store for demo app
const sessions = new Map<string, { user: any; token: string }>();

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
  <title>Sign in with WhatsApp | Consumer App</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      font-weight: 800;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .input-group {
      margin-bottom: 16px;
      text-align: left;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #cbd5e1;
    }
    input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #475569;
      background: #0f172a;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: #25d366;
    }
    .btn {
      width: 100%;
      background: #25d366;
      color: #0f172a;
      font-weight: 700;
      padding: 14px;
      border-radius: 8px;
      border: none;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s;
      margin-top: 12px;
    }
    .btn:hover {
      background: #20ba5a;
    }
    .btn-secondary {
      background: #334155;
      color: #f8fafc;
      font-size: 13px;
      padding: 10px 14px;
      text-decoration: none;
      margin-top: 12px;
      border: 1px solid #475569;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .status-box {
      display: none;
      margin-top: 24px;
      padding: 20px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      text-align: center;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(37, 211, 102, 0.15);
      color: #25d366;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .challenge-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 15px;
      font-weight: 700;
      background: #1e293b;
      color: #38bdf8;
      padding: 6px 12px;
      border-radius: 6px;
      margin: 8px 0;
      border: 1px dashed #0284c7;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Consumer Application</span>
    <h1>Sign in with WhatsApp</h1>
    <p>Passwordless authentication using the WhatsApp Self-Hosted Auth System.</p>

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
      <div style="font-weight: 600; margin-bottom: 6px;" id="status-title">🚀 Handing off to WhatsApp...</div>
      <div style="color: #94a3b8; font-size: 13px;" id="status-desc">
        Opening WhatsApp with your pre-filled verification challenge:
      </div>
      <div id="challenge-display" class="challenge-badge">AUTH-....</div>
      <p style="color: #64748b; font-size: 12px; margin: 4px 0 12px;">
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

        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to start login (' + res.status + ')');

        const deepLink = data.whatsappDeepLink || data.whatsapp_deep_link;
        const sseUrl = data.sseUrl || data.sse_url;
        const challenge = data.challenge;

        if (challenge) challengeDisplay.innerText = challenge;
        if (deepLink) waDirectLink.href = deepLink;

        statusBox.style.display = 'block';
        submitBtn.style.display = 'none';

        if (deepLink) {
          window.location.href = deepLink;
        }

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
      state: 'csrf_state_random_token_123',
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
  } catch (err: any) {
    console.error('[EXAMPLE APP] ❌ Failed to start auth:', err.message);
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
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

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
  } catch (err: any) {
    return res.status(400).send(`<h3>Exchange Failed</h3><p>${err.message}</p>`);
  }
});

// 4. Protected User Dashboard
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
  <title>User Dashboard | Developer Example App</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
    }
    .info-row {
      background: #0f172a;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }
    .info-label {
      color: #94a3b8;
      font-size: 13px;
    }
    .info-val {
      font-weight: 600;
      color: #f8fafc;
    }
    .badge-active {
      background: rgba(37, 211, 102, 0.15);
      color: #25d366;
      border: 1px solid rgba(37, 211, 102, 0.3);
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
      border-radius: 8px;
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

// 5. Logout Route
app.get('/logout', (req, res) => {
  const sessionId = req.cookies.session_id;
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie('session_id');
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`📱 Example Developer Application running at http://localhost:${port}`);
  console.log(`🔗 Target Auth API: ${authApiUrl}`);
  console.log(`🔑 Client ID: ${authClientId || '(Not configured in .env)'}`);
});
