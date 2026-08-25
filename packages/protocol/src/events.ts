import { z } from 'zod';
import { WhatsAppConnectionStatus, AttemptState } from './models.js';

/**
 * Incoming WhatsApp Message Schema from Worker to API
 */
export const IncomingWhatsAppMessageSchema = z.object({
  from: z.string().min(5), // E.164 normalized phone e.g. "+14155552671"
  body: z.string().trim(),
  timestamp: z.number(),
  messageId: z.string().optional(),
});

export type IncomingWhatsAppMessage = z.infer<typeof IncomingWhatsAppMessageSchema>;

/**
 * Worker Status Update Event
 */
export const WorkerStatusUpdateSchema = z.object({
  status: z.nativeEnum(WhatsAppConnectionStatus),
  phoneNumber: z.string().nullable().optional(),
  qrCode: z.string().nullable().optional(), // Base64 or raw string
  platform: z.string().optional(),
  timestamp: z.number(),
});

export type WorkerStatusUpdate = z.infer<typeof WorkerStatusUpdateSchema>;

/**
 * Send Message Command Schema from API to Worker
 */
export const SendWhatsAppMessageCommandSchema = z.object({
  to: z.string().min(5), // E.164 normalized phone
  message: z.string().min(1),
  attemptId: z.string().optional(),
});

export type SendWhatsAppMessageCommand = z.infer<typeof SendWhatsAppMessageCommandSchema>;

/**
 * Server-Sent Event (SSE) Payload for Browser / Dashboard Live Updates
 */
export interface SSEAuthEventPayload {
  attemptId: string;
  state: AttemptState;
  timestamp: string;
  error?: string;
}

export interface SSEWhatsAppEventPayload {
  status: WhatsAppConnectionStatus;
  phoneNumber?: string | null;
  qrCode?: string | null;
  timestamp: string;
}
