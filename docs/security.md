# Security Model & Threat Mitigations

Security is an essential requirement for WhatsApp Auth. The system employs defense-in-depth principles across the entire authentication lifecycle.

---

## 1. Challenge Architecture & Storage

- **Entropy & Format**: Random 10-character alphanumeric challenges (`AUTH-XXXX-XXXX`, >50 bits of entropy).
- **Hashed at Rest**: Stored exclusively as SHA-256 digests in PostgreSQL.
- **Short TTL**: Valid for 5 minutes only.
- **Single-Use**: Automatically invalidated upon successful verification.

---

## 2. Token & Authorization Code Lifecycle

- **One-Time Login Tokens**: High-entropy 128-bit random tokens delivered in WhatsApp replies. Stored as SHA-256 hashes. Consumed atomically in database transactions with 2-minute TTL.
- **OAuth 2.0 Authorization Codes**: 60-second TTL. Burned immediately upon exchange.
- **PKCE Support**: Full RFC 7636 Proof Key for Code Exchange (S256) support for public mobile & Single Page Applications.

---

## 3. Strict Redirect Matching

- Registered redirect URIs are strictly matched using exact string URL equality.
- Open redirects, sub-domain wildcards, and non-HTTP/HTTPS protocols (e.g. `javascript:`, `data:`) are strictly forbidden.

---

## 4. Rate Limiting & Abuse Prevention

- Sliding-window rate limiters protect:
  - Client IP addresses (max 20 requests per minute).
  - Target phone numbers (max 5 active challenges per minute).
  - Webhook delivery endpoints.

---

## 5. Constant-Time Comparisons

All comparisons for hashes, PKCE verifiers, client secrets, and session tokens use `crypto.timingSafeEqual()` to eliminate side-channel timing attacks.
