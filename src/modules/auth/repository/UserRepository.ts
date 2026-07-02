import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserWithTenant } from '../dto/response/MeDTOResponse';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithTenant | null> {
    return this.prisma.users.findFirst({
      where: { email },
      include: {
        tenants: {
          select: {
            id: true,
            nome: true,
            slug: true,
            ativo: true,
            billingStatus: true,
            accessExpiresAt: true,
          },
        },
      },
    });
  }

  findByIdWithTenant(id: number): Promise<UserWithTenant | null> {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        tenants: {
          select: {
            id: true,
            nome: true,
            slug: true,
            ativo: true,
            billingStatus: true,
            accessExpiresAt: true,
          },
        },
      },
    });
  }
}
