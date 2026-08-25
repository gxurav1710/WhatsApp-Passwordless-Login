# @whatsapp-auth/sdk

Official TypeScript / JavaScript SDK for integrating self-hosted WhatsApp Passwordless Authentication into web and backend applications.

---

## 📦 Installation

```bash
npm install @whatsapp-auth/sdk
```

---

## 🚀 Quick Usage

```typescript
import { WhatsAppAuthClient } from '@whatsapp-auth/sdk';

const authClient = new WhatsAppAuthClient({
  baseUrl: process.env.AUTH_API_URL,           // e.g. https://auth.example.com
  clientId: process.env.AUTH_CLIENT_ID,         // e.g. wa_client_...
  clientSecret: process.env.AUTH_CLIENT_SECRET, // e.g. wa_sec_...
});

// Step 1: Initiate Login with Full Name, Email, and Mobile Number
const { whatsappDeepLink, sseUrl } = await authClient.initiate({
  fullName: 'John Doe',
  email: 'user@example.com',
  phoneNumber: '+14155552671',
  redirectUri: 'https://myapp.example.com/auth/callback',
});

// Step 2: In your OAuth callback route (/auth/callback)
const { user, accessToken } = await authClient.exchangeCode({
  code: req.query.code as string,
  redirectUri: 'https://myapp.example.com/auth/callback',
});

console.log('Verified user:', user.fullName, user.email, user.phoneNumber);
```

---

## 📚 API Reference

### `new WhatsAppAuthClient(config)`
- `baseUrl`: The public base URL of the Auth Server (e.g. `https://auth.example.com` or `http://localhost:4000`).
- `clientId`: Your application's OAuth 2.0 Client ID.
- `clientSecret` *(optional)*: Your application's Client Secret (for backend/confidential client code exchange).

### `authClient.initiate(params)`
Initiates an authentication attempt and returns `{ attemptId, challenge, whatsappDeepLink, sseUrl, expiresIn, expiresAt }`.

### `authClient.exchangeCode(params)`
Exchanges the single-use authorization code from `/auth/callback` for `{ accessToken, tokenType, expiresIn, user }`.

### `authClient.verifySession(token)`
Introspects an active session token and returns `{ active, user? }`.
