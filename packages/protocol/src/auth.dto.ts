import { z } from 'zod';
import { AppStatus, AttemptState } from './models.js';

/**
 * 1. Initiate Authentication Request & Response
 */
export const InitiateAuthRequestSchema = z.object({
  client_id: z.string().min(1, 'client_id is required'),
  phone_number: z.string().min(6, 'Valid phone number is required'),
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().trim().toLowerCase().pipe(z.string().email('Valid email address is required')).optional(),
  redirect_uri: z.string().url('redirect_uri must be a valid URL'),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(['S256', 'plain']).optional().default('S256'),
});

export type InitiateAuthRequest = z.infer<typeof InitiateAuthRequestSchema>;

export interface InitiateAuthResponse {
  success: true;
  data: {
    attempt_id: string;
    challenge: string;
    whatsapp_deep_link: string;
    expires_in: number;
    expires_at: string;
    sse_url: string;
  };
}

/**
 * 2. Token Exchange (OAuth 2.0 Authorization Code Grant)
 */
export const TokenExchangeRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  client_id: z.string().min(1),
  client_secret: z.string().optional(), // Required for confidential clients
  code: z.string().min(1, 'Authorization code is required'),
  redirect_uri: z.string().url(),
  code_verifier: z.string().optional(), // Required if code_challenge was provided
});

export type TokenExchangeRequest = z.infer<typeof TokenExchangeRequestSchema>;

export interface TokenExchangeResponse {
  success: true;
  data: {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    user: {
      id: string;
      full_name?: string | null;
      email?: string | null;
      phone_number: string;
      verified_at: string;
      status: string;
    };
  };
}

/**
 * 3. Session Verification & Introspection
 */
export const VerifySessionRequestSchema = z.object({
  token: z.string().min(1),
});

export type VerifySessionRequest = z.infer<typeof VerifySessionRequestSchema>;

export interface VerifySessionResponse {
  success: true;
  data: {
    active: boolean;
    user?: {
      id: string;
      full_name?: string | null;
      email?: string | null;
      phone_number: string;
      status: string;
    };
    application_id?: string;
    expires_at?: string;
  };
}

/**
 * 4. Application Management DTOs
 */
export const CreateApplicationSchema = z.object({
  name: z.string().trim().min(2, 'Application name must be at least 2 characters').max(100),
  auth_server_url: z
    .string()
    .trim()
    .url('Auth Server URL must be a valid URL (e.g. https://abc123.trycloudflare.com or http://localhost:4000)')
    .optional()
    .nullable(),
  redirect_uris: z
    .array(z.string().trim().url('Redirect URL must be a valid URL (e.g. https://standalone-example-app.vercel.app/auth/callback)'))
    .min(1, 'At least one redirect URI is required'),
  webhook_url: z.union([z.string().trim().url('Webhook URL must be a valid URL'), z.literal(''), z.null()]).optional(),
  status: z.nativeEnum(AppStatus).optional().default(AppStatus.DEVELOPMENT),
});

export type CreateApplicationRequest = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  auth_server_url: z.string().trim().url('Auth Server URL must be a valid URL').optional().nullable(),
  redirect_uris: z
    .array(z.string().trim().url('Each redirect URI must be a valid URL'))
    .min(1)
    .optional(),
  webhook_url: z.union([z.string().trim().url(), z.literal(''), z.null()]).optional(),
  status: z.nativeEnum(AppStatus).optional(),
});

export type UpdateApplicationRequest = z.infer<typeof UpdateApplicationSchema>;

/**
 * 5. Simulation Request DTO
 */
export const SimulateMessageRequestSchema = z.object({
  phone_number: z.string().min(5),
  message_body: z.string().min(1),
});

export type SimulateMessageRequest = z.infer<typeof SimulateMessageRequestSchema>;
