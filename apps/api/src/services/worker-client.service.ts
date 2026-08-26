import { SendWhatsAppMessageCommand } from '@whatsapp-auth/protocol';

export class WorkerClientService {
  constructor(
    private readonly workerUrl: string,
    private readonly workerSecret: string
  ) {}

  async sendMessage(to: string, message: string, attemptId?: string): Promise<boolean> {
    const payload: SendWhatsAppMessageCommand = { to, message, attemptId };
    const url = `${this.workerUrl}/internal/send`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.workerSecret}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`WorkerClientService: send failed (${response.status}): ${errorText}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('WorkerClientService: connection error to worker:', err);
      return false;
    }
  }

  async getStatus(): Promise<any> {
    const url = `${this.workerUrl}/internal/status`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.workerSecret}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return { status: 'DISCONNECTED', error: 'Worker returned non-200' };
    } catch (err) {
      return { status: 'DISCONNECTED', error: 'Worker unreachable' };
    }
  }

  async startPairing(visual: boolean = true): Promise<any> {
    const url = `${this.workerUrl}/internal/start-pairing`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.workerSecret}`,
        },
        body: JSON.stringify({ visual }),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Worker unreachable' };
    }
  }

  async logout(): Promise<any> {
    const url = `${this.workerUrl}/internal/logout`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.workerSecret}` },
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Worker unreachable' };
    }
  }

  async reconnect(): Promise<any> {
    const url = `${this.workerUrl}/internal/reconnect`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.workerSecret}` },
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Worker unreachable' };
    }
  }

  async simulateIncomingMessage(from: string, body: string): Promise<any> {
    const url = `${this.workerUrl}/internal/simulate`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.workerSecret}`,
        },
        body: JSON.stringify({ from, body }),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Worker unreachable' };
    }
  }
}
