import { Injectable } from '@nestjs/common';
import { AdminDashboardDTOResponse } from '../dto/response/AdminDashboardDTOResponse';
import { AdminTenantListItemDTOResponse } from '../dto/response/AdminTenantListItemDTOResponse';
import { ListAdminTenantDTOQuery } from '../dto/request/ListAdminTenantDTOQuery';
import { AdminRepository } from '../repository/AdminRepository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async listTenants(query?: ListAdminTenantDTOQuery): Promise<AdminTenantListItemDTOResponse[]> {
    const rows = await this.adminRepository.listTenants(query);

    return rows.map((row) => {
      const dto = new AdminTenantListItemDTOResponse();
      dto.id = row.id;
      dto.nome = row.nome;
      dto.slug = row.slug;
      dto.tipo = row.tipo;
      dto.ativo = row.ativo;
      dto.createdAt = row.createdAt;
      dto.totalUsuarios = 'totalUsuarios' in row ? row.totalUsuarios : row._count.users;
      dto.totalClientes = 'totalClientes' in row ? row.totalClientes : row._count.clients;
      return dto;
    });
  }

  async getDashboard(): Promise<AdminDashboardDTOResponse> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const metrics = await this.adminRepository.getDashboardMetrics(since);
    const dto = new AdminDashboardDTOResponse();
    Object.assign(dto, metrics);
    return dto;
  }
}
