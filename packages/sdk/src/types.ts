export interface WhatsAppAuthConfig {
  baseUrl: string; // e.g. "http://localhost:4000" or "https://auth.mydomain.com"
  clientId: string;
  clientSecret?: string; // Optional for public clients
  fetch?: typeof globalThis.fetch;
}

export interface InitiateLoginParams {
  phoneNumber: string;
  fullName?: string;
  email?: string;
  redirectUri: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

export interface InitiateLoginResult {
  attemptId: string;
  challenge: string;
  whatsappDeepLink: string;
  expiresIn: number;
  expiresAt: string;
  sseUrl: string;
}

export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface AuthenticatedUser {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber: string;
  verifiedAt: string;
  status?: string;
}

export interface TokenExchangeResult {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUser;
}
