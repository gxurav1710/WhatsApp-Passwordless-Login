import { PrismaClient, UserSession } from '@prisma/client';
import { generateSecureToken, sha256 } from '@whatsapp-auth/security';

export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSession(data: {
    userId: string;
    applicationId: string;
    ttlDays?: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ session: UserSession; rawToken: string }> {
    const rawToken = generateSecureToken(32);
    const sessionToken = sha256(rawToken);
    const ttlDays = data.ttlDays || 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.userSession.create({
      data: {
        userId: data.userId,
        applicationId: data.applicationId,
        sessionToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt,
      },
      include: {
        user: true,
        application: true,
      },
    });

    return { session, rawToken };
  }

  async findByRawToken(rawToken: string): Promise<(UserSession & { user: any; application: any }) | null> {
    const sessionToken = sha256(rawToken);
    return this.prisma.userSession.findUnique({
      where: { sessionToken },
      include: {
        user: true,
        application: true,
      },
    });
  }

  async revoke(id: string): Promise<UserSession> {
    return this.prisma.userSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async listActive(options?: { applicationId?: string; userId?: string; limit?: number }): Promise<UserSession[]> {
    const where: any = {
      revokedAt: null,
      expiresAt: { gt: new Date() },
    };
    if (options?.applicationId) where.applicationId = options.applicationId;
    if (options?.userId) where.userId = options.userId;

    return this.prisma.userSession.findMany({
      where,
      take: options?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        application: true,
      },
    });
  }
}
