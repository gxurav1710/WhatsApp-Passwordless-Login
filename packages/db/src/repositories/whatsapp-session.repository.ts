import { PrismaClient, WhatsAppSession, WhatsAppConnectionStatus } from '@prisma/client';

export class WhatsAppSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getSession(sessionName: string = 'default'): Promise<WhatsAppSession | null> {
    return this.prisma.whatsAppSession.findUnique({
      where: { sessionName },
    });
  }

  async updateStatus(
    sessionName: string = 'default',
    data: {
      status: WhatsAppConnectionStatus;
      phoneNumber?: string | null;
      qrCode?: string | null;
      platform?: string | null;
    }
  ): Promise<WhatsAppSession> {
    return this.prisma.whatsAppSession.upsert({
      where: { sessionName },
      update: {
        status: data.status,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
        qrCode: data.qrCode !== undefined ? data.qrCode : undefined,
        platform: data.platform !== undefined ? data.platform : undefined,
        lastActiveAt: new Date(),
      },
      create: {
        sessionName,
        status: data.status,
        phoneNumber: data.phoneNumber,
        qrCode: data.qrCode,
        platform: data.platform,
        lastActiveAt: new Date(),
      },
    });
  }
}
