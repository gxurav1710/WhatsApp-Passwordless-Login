import { FastifyReply } from 'fastify';
import { AttemptState, SSEAuthEventPayload, SSEWhatsAppEventPayload } from '@whatsapp-auth/protocol';

interface SSESubscriber {
  id: string;
  reply: FastifyReply;
  attemptId?: string;
  isDashboard?: boolean;
}

export class SSEManager {
  private subscribers = new Map<string, SSESubscriber>();

  public addSubscriber(id: string, reply: FastifyReply, options?: { attemptId?: string; isDashboard?: boolean }): void {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial keep-alive comment
    reply.raw.write(': connected\n\n');

    this.subscribers.set(id, {
      id,
      reply,
      attemptId: options?.attemptId,
      isDashboard: options?.isDashboard,
    });

    reply.raw.on('close', () => {
      this.subscribers.delete(id);
    });
  }

  public emitAttemptUpdate(attemptId: string, state: AttemptState, error?: string): void {
    const payload: SSEAuthEventPayload = {
      attemptId,
      state,
      timestamp: new Date().toISOString(),
      error,
    };

    const message = `event: auth_update\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const sub of this.subscribers.values()) {
      if (sub.attemptId === attemptId || sub.isDashboard) {
        try {
          sub.reply.raw.write(message);
        } catch {
          this.subscribers.delete(sub.id);
        }
      }
    }
  }

  public emitWhatsAppStatus(payload: SSEWhatsAppEventPayload): void {
    const message = `event: whatsapp_status\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const sub of this.subscribers.values()) {
      if (sub.isDashboard) {
        try {
          sub.reply.raw.write(message);
        } catch {
          this.subscribers.delete(sub.id);
        }
      }
    }
  }

  public broadcast(eventName: string, data: any): void {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const sub of this.subscribers.values()) {
      try {
        sub.reply.raw.write(message);
      } catch {
        this.subscribers.delete(sub.id);
      }
    }
  }
}
