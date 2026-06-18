import { Injectable, Logger } from '@nestjs/common';
import { UpsertTenantFiscalInfoDTORequest } from '../dto/request/UpsertTenantFiscalInfoDTORequest';
import { TenantFiscalInfoDTOResponse } from '../dto/response/TenantFiscalInfoDTOResponse';
import { TenantFiscalRepository } from '../repository/TenantFiscalRepository';

@Injectable()
export class TenantFiscalService {
  private readonly logger = new Logger(TenantFiscalService.name);

  constructor(private readonly tenantFiscalRepository: TenantFiscalRepository) {}

  async getFiscalInfo(): Promise<TenantFiscalInfoDTOResponse | null> {
    const entity = await this.tenantFiscalRepository.findByTenantId();
    return entity ? TenantFiscalInfoDTOResponse.fromEntity(entity) : null;
  }

  async upsertFiscalInfo(
    dto: UpsertTenantFiscalInfoDTORequest,
  ): Promise<TenantFiscalInfoDTOResponse> {
    try {
      const entity = await this.tenantFiscalRepository.upsert({
        razaoSocial: dto.razaoSocial,
        nomeFantasia: dto.nomeFantasia ?? null,
        cnpj: dto.cnpj,
        inscricaoEstadual: dto.inscricaoEstadual ?? null,
        inscricaoMunicipal: dto.inscricaoMunicipal ?? null,
        regimeTributario: dto.regimeTributario ?? null,
        cnaePrincipal: dto.cnaePrincipal ?? null,
        emailFiscal: dto.emailFiscal ?? null,
        telefone: dto.telefone ?? null,
        logradouro: dto.logradouro ?? null,
        numero: dto.numero ?? null,
        complemento: dto.complemento ?? null,
        bairro: dto.bairro ?? null,
        cep: dto.cep ?? null,
        cidade: dto.cidade ?? null,
        uf: dto.uf?.toUpperCase() ?? null,
        codigoIbgeMunicipio: dto.codigoIbgeMunicipio ?? null,
        updatedAt: new Date(),
      });
      return TenantFiscalInfoDTOResponse.fromEntity(entity);
    } catch (error) {
      this.logger.error('Erro ao salvar dados fiscais do tenant', (error as Error).stack);
      throw error;
    }
  }
}
