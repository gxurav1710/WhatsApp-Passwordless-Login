/**
 * Core Domain Enums & Model Types
 */

export enum AppStatus {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  DISABLED = 'DISABLED',
}

export enum AttemptState {
  INITIATED = 'INITIATED',
  WAITING_FOR_WHATSAPP = 'WAITING_FOR_WHATSAPP',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  LOGIN_LINK_CONSUMED = 'LOGIN_LINK_CONSUMED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export enum WhatsAppConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  INITIALIZING = 'INITIALIZING',
  QR_READY = 'QR_READY',
  AUTHENTICATED = 'AUTHENTICATED',
  CONNECTED = 'CONNECTED',
  FAILED = 'FAILED',
}

export interface ApplicationModel {
  id: string;
  name: string;
  clientId: string;
  clientSecretHash: string;
  authServerUrl?: string | null;
  redirectUris: string[];
  webhookUrl?: string | null;
  status: AppStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel {
  id: string;
  phoneNumber: string; // Normalized E.164
  fullName?: string | null;
  email?: string | null;
  countryCode?: string | null;
  isVerified: boolean;
  status: string;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthAttemptModel {
  id: string;
  applicationId: string;
  userId?: string | null;
  phoneNumber: string;
  fullName?: string | null;
  email?: string | null;
  challengeHash: string;
  challengePrefix: string;
  state: AttemptState;
  ipAddress?: string | null;
  userAgent?: string | null;
  redirectUri: string;
  stateParam?: string | null;
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
  expiresAt: Date;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginTokenModel {
  id: string;
  authAttemptId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  createdAt: Date;
}

export interface AuthorizationCodeModel {
  id: string;
  authAttemptId: string;
  applicationId: string;
  userId: string;
  codeHash: string;
  redirectUri: string;
  expiresAt: Date;
  consumedAt?: Date | null;
  createdAt: Date;
}

export interface UserSessionModel {
  id: string;
  userId: string;
  applicationId: string;
  sessionToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

export interface WhatsAppSessionModel {
  id: string;
  sessionName: string;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string | null;
  qrCode?: string | null;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogModel {
  id: string;
  applicationId?: string | null;
  eventType: string;
  ipAddress?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: Date;
}
