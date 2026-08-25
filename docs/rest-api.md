# REST API Reference

The Auth Core API exposes public OAuth 2.0 endpoints for client applications, admin endpoints for management, and internal endpoints for the worker daemon.

---

## 1. Public Health Check
`GET /health`

Public service uptime and readiness probe.

### Response (200 OK)
```json
{
  "status": "healthy",
  "service": "whatsapp-auth-api",
  "version": "1.0.0",
  "timestamp": "2026-08-25T20:00:00.000Z"
}
```

---

## 2. Initiate Authentication
`POST /api/v1/auth/initiate`

Starts a passwordless WhatsApp authentication attempt collecting the user's Full Name, Email, and Mobile Number.

> **Privacy Note**: The generated `whatsapp_deep_link` contains **ONLY** the short challenge string (`AUTH-XXXX-XXXX`). No personal data (name/email) is placed in the WhatsApp deep link query parameters or message body.

### Request Body
```json
{
  "client_id": "wa_client_8f9a2b...",
  "full_name": "John Doe",
  "email": "user@example.com",
  "phone_number": "+14155552671",
  "redirect_uri": "https://myapp.example.com/auth/callback",
  "state": "csrf_state_xyz",
  "code_challenge": "E9Melhoa2OwvFrGMTJguCH5rtx64J_bW6-Z6gWDhuP4",
  "code_challenge_method": "S256"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `client_id` | `string` | Yes | OAuth 2.0 Client ID of the registered application |
| `phone_number` | `string` | Yes | User's mobile number (identity anchor) in E.164 or national format |
| `full_name` | `string` | No | User's full display name (min 2, max 100 characters) |
| `email` | `string` | No | User's email address (valid email format, normalized) |
| `redirect_uri` | `string` | Yes | Whitelisted callback URL for authorization code return |
| `state` | `string` | No | CSRF state parameter returned verbatim to callback |
| `code_challenge` | `string` | No | PKCE code challenge (SHA-256 base64url) |
| `code_challenge_method` | `string` | No | `'S256'` (recommended) or `'plain'` |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "attempt_id": "att_7a8b9c",
    "challenge": "AUTH-7K92-MX81",
    "whatsapp_deep_link": "https://wa.me/14155550199?text=AUTH-7K92-MX81",
    "expires_in": 300,
    "expires_at": "2026-08-25T20:05:00.000Z",
    "sse_url": "/api/v1/auth/events/att_7a8b9c"
  }
}
```

---

## 3. Real-Time Status Stream (SSE)
`GET /api/v1/auth/events/:attemptId`

Subscribes to live Server-Sent Events updates for an attempt.

### Event Format
```
event: auth_update
data: {"attemptId":"att_7a8b9c","state":"VERIFIED","timestamp":"2026-08-25T20:01:00Z"}
```

---

## 4. One-Time Continuation Link
`GET /continue/:token`

Clicked by the user in WhatsApp. Validates and burns the single-use token, creates a short-lived authorization code (60s TTL), and redirects (`302 Found`) to:

```
https://myapp.example.com/auth/callback?code=wa_code_123...&state=csrf_state_xyz
```

---

## 5. Authorization Code Exchange
`POST /api/v1/auth/token`

Exchanges the authorization code for verified user identity and full profile attributes.

### Request Body
```json
{
  "grant_type": "authorization_code",
  "client_id": "wa_client_8f9a2b...",
  "client_secret": "wa_sec_99a8b7...",
  "code": "wa_code_123...",
  "redirect_uri": "https://myapp.example.com/auth/callback",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "wa_acc_44b3c2...",
    "token_type": "Bearer",
    "expires_in": 2592000,
    "user": {
      "id": "usr_99281a",
      "phone_number": "+14155552671",
      "full_name": "John Doe",
      "email": "user@example.com",
      "verified_at": "2026-08-25T20:01:30.000Z",
      "status": "ACTIVE"
    }
  }
}
```

---

## 6. Verify Session Token
`POST /api/v1/auth/verify-session`

### Request Body
```json
{
  "token": "wa_acc_44b3c2..."
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "active": true,
    "user": {
      "id": "usr_99281a",
      "phone_number": "+14155552671",
      "full_name": "John Doe",
      "email": "user@example.com",
      "verified_at": "2026-08-25T20:01:30.000Z",
      "status": "ACTIVE"
    }
  }
}
```
