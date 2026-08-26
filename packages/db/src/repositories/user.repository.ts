import { PrismaClient, User } from '@prisma/client';

export interface UserProfileData {
  fullName?: string | null;
  email?: string | null;
  countryCode?: string | null;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByPhone(phoneNumber: string, profile?: UserProfileData): Promise<User> {
    const updateData: any = {
      lastLoginAt: new Date(),
    };
    if (profile?.fullName !== undefined && profile?.fullName !== null) {
      updateData.fullName = profile.fullName;
    }
    if (profile?.email !== undefined && profile?.email !== null) {
      updateData.email = profile.email;
    }
    if (profile?.countryCode !== undefined && profile?.countryCode !== null) {
      updateData.countryCode = profile.countryCode;
    }

    const createData: any = {
      phoneNumber,
      fullName: profile?.fullName || null,
      email: profile?.email || null,
      countryCode: profile?.countryCode || null,
      isVerified: true,
      status: 'ACTIVE',
      lastLoginAt: new Date(),
    };

    return this.prisma.user.upsert({
      where: { phoneNumber },
      update: updateData,
      create: createData,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userSessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          include: { application: true },
        },
      },
    });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phoneNumber } });
  }

  async list(options?: { limit?: number; skip?: number; search?: string }): Promise<User[]> {
    const where: any = {};
    if (options?.search && options.search !== 'undefined' && options.search.trim() !== '') {
      const searchTerm = options.search.trim();
      where.OR = [
        { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.skip || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { userSessions: true, authAttempts: true },
        },
      },
    });
  }
}
