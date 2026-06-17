import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserWithTenant } from '../dto/response/MeDTOResponse';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTenantSlugAndEmail(tenantSlug: string, email: string): Promise<UserWithTenant | null> {
    return this.prisma.users.findFirst({
      where: {
        email,
        tenants: { slug: tenantSlug },
      },
      include: {
        tenants: {
          select: { id: true, nome: true, slug: true, ativo: true },
        },
      },
    });
  }

  findByIdWithTenant(id: number): Promise<UserWithTenant | null> {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        tenants: {
          select: { id: true, nome: true, slug: true, ativo: true },
        },
      },
    });
  }
}
