import { PrismaClient, AuthAttempt, AttemptState, LoginToken, AuthorizationCode } from '@prisma/client';

export interface CreateAttemptInput {
  applicationId: string;
  phoneNumber: string;
  fullName?: string | null;
  email?: string | null;
  challengeHash: string;
  challengePrefix: string;
  redirectUri: string;
  stateParam?: string | null;
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

export class AuthAttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateAttemptInput): Promise<AuthAttempt> {
    return this.prisma.authAttempt.create({
      data: {
        applicationId: input.applicationId,
        phoneNumber: input.phoneNumber,
        fullName: input.fullName || null,
        email: input.email || null,
        challengeHash: input.challengeHash,
        challengePrefix: input.challengePrefix,
        redirectUri: input.redirectUri,
        stateParam: input.stateParam,
        codeChallenge: input.codeChallenge,
        codeChallengeMethod: input.codeChallengeMethod || 'S256',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt: input.expiresAt,
        state: AttemptState.INITIATED,
      },
    });
  }

  async findById(id: string): Promise<AuthAttempt | null> {
    return this.prisma.authAttempt.findUnique({
      where: { id },
      include: { application: true, user: true },
    });
  }

  async findActiveByPhoneAndChallenge(
    phoneNumber: string,
    challengeHash: string
  ): Promise<AuthAttempt | null> {
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    // 1. Try finding attempt by phone format variations + challengeHash
    const attempt = await this.prisma.authAttempt.findFirst({
      where: {
        OR: [
          { phoneNumber },
          { phoneNumber: `+${cleanDigits}` },
          { phoneNumber: cleanDigits },
          { phoneNumber: { contains: last10 } },
        ],
        challengeHash,
        state: { in: [AttemptState.INITIATED, AttemptState.WAITING_FOR_WHATSAPP, AttemptState.PROCESSING] },
        expiresAt: { gt: new Date() },
      },
      include: { application: true },
      orderBy: { createdAt: 'desc' },
    });

    if (attempt) return attempt;

    // 2. Fallback: match by unexpired challengeHash
    return this.prisma.authAttempt.findFirst({
      where: {
        challengeHash,
        state: { in: [AttemptState.INITIATED, AttemptState.WAITING_FOR_WHATSAPP, AttemptState.PROCESSING] },
        expiresAt: { gt: new Date() },
      },
      include: { application: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateState(
    id: string,
    state: AttemptState,
    extraData?: { verifiedAt?: Date; userId?: string }
  ): Promise<AuthAttempt> {
    return this.prisma.authAttempt.update({
      where: { id },
      data: {
        state,
        ...extraData,
      },
    });
  }

  async incrementFailedAttempts(id: string): Promise<AuthAttempt> {
    return this.prisma.authAttempt.update({
      where: { id },
      data: {
        failedAttempts: { increment: 1 },
      },
    });
  }

  async createLoginToken(
    authAttemptId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<LoginToken> {
    return this.prisma.loginToken.create({
      data: {
        authAttemptId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findLoginToken(tokenHash: string): Promise<(LoginToken & { authAttempt: AuthAttempt & { application: any } }) | null> {
    return this.prisma.loginToken.findUnique({
      where: { tokenHash },
      include: {
        authAttempt: {
          include: { application: true },
        },
      },
    });
  }

  async consumeLoginToken(id: string): Promise<LoginToken> {
    return this.prisma.loginToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async createAuthorizationCode(data: {
    authAttemptId: string;
    applicationId: string;
    userId: string;
    codeHash: string;
    redirectUri: string;
    expiresAt: Date;
  }): Promise<AuthorizationCode> {
    return this.prisma.authorizationCode.create({
      data: {
        authAttemptId: data.authAttemptId,
        applicationId: data.applicationId,
        userId: data.userId,
        codeHash: data.codeHash,
        redirectUri: data.redirectUri,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findAuthorizationCode(
    codeHash: string
  ): Promise<(AuthorizationCode & { authAttempt: AuthAttempt; application: any; user: any }) | null> {
    return this.prisma.authorizationCode.findUnique({
      where: { codeHash },
      include: {
        authAttempt: true,
        application: true,
        user: true,
      },
    });
  }

  async consumeAuthorizationCode(id: string): Promise<AuthorizationCode> {
    return this.prisma.authorizationCode.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async listRecent(options?: {
    applicationId?: string;
    state?: AttemptState;
    phoneNumber?: string;
    limit?: number;
  }): Promise<AuthAttempt[]> {
    const where: any = {};
    if (options?.applicationId) where.applicationId = options.applicationId;
    if (options?.state) where.state = options.state;
    if (options?.phoneNumber) where.phoneNumber = { contains: options.phoneNumber };

    return this.prisma.authAttempt.findMany({
      where,
      take: options?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: { application: true, user: true },
    });
  }
}
