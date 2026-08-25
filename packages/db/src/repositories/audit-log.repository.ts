import { PrismaClient, AuditLog } from '@prisma/client';

export class AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async log(data: {
    eventType: string;
    applicationId?: string | null;
    ipAddress?: string | null;
    details?: Record<string, unknown> | null;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        eventType: data.eventType,
        applicationId: data.applicationId,
        ipAddress: data.ipAddress,
        details: data.details ? (data.details as any) : undefined,
      },
    });
  }

  async listRecent(options?: {
    limit?: number;
    applicationId?: string;
    eventType?: string;
  }): Promise<AuditLog[]> {
    const where: any = {};
    if (options?.applicationId) where.applicationId = options.applicationId;
    if (options?.eventType) where.eventType = options.eventType;

    return this.prisma.auditLog.findMany({
      where,
      take: options?.limit || 100,
      orderBy: { createdAt: 'desc' },
      include: { application: true },
    });
  }
}
