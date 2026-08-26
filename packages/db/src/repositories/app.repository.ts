import { PrismaClient, Application, AppStatus } from '@prisma/client';
import { generateClientId, generateClientSecret, hashClientSecret } from '@whatsapp-auth/security';

export interface CreateAppInput {
  name: string;
  authServerUrl?: string | null;
  redirectUris: string[];
  webhookUrl?: string | null;
  status?: AppStatus;
}

export interface CreatedAppResult {
  app: Application;
  plainClientSecret: string;
}

export class AppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateAppInput): Promise<CreatedAppResult> {
    const clientId = generateClientId();
    const plainClientSecret = generateClientSecret();
    const clientSecretHash = hashClientSecret(plainClientSecret);

    const app = await this.prisma.application.create({
      data: {
        name: input.name,
        clientId,
        clientSecretHash,
        authServerUrl: input.authServerUrl || null,
        redirectUris: input.redirectUris,
        webhookUrl: input.webhookUrl,
        status: input.status || AppStatus.DEVELOPMENT,
      },
    });

    return { app, plainClientSecret };
  }

  async findById(id: string): Promise<Application | null> {
    return this.prisma.application.findUnique({ where: { id } });
  }

  async findByClientId(clientId: string): Promise<Application | null> {
    return this.prisma.application.findUnique({ where: { clientId } });
  }

  async list(): Promise<Application[]> {
    return this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    data: { name?: string; authServerUrl?: string | null; redirectUris?: string[]; webhookUrl?: string | null; status?: AppStatus }
  ): Promise<Application> {
    return this.prisma.application.update({
      where: { id },
      data,
    });
  }

  async rotateSecret(id: string): Promise<{ app: Application; plainClientSecret: string }> {
    const plainClientSecret = generateClientSecret();
    const clientSecretHash = hashClientSecret(plainClientSecret);

    const app = await this.prisma.application.update({
      where: { id },
      data: { clientSecretHash },
    });

    return { app, plainClientSecret };
  }

  async delete(id: string): Promise<Application> {
    return this.prisma.application.delete({ where: { id } });
  }
}
