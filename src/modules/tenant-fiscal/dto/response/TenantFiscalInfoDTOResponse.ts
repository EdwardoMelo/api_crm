import { tenant_fiscal_info } from '@prisma/client';

export class TenantFiscalInfoDTOResponse {
  id: number;
  tenantId: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  regimeTributario: string | null;
  cnaePrincipal: string | null;
  emailFiscal: string | null;
  telefone: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  codigoIbgeMunicipio: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: tenant_fiscal_info): TenantFiscalInfoDTOResponse {
    const dto = new TenantFiscalInfoDTOResponse();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.razaoSocial = entity.razaoSocial;
    dto.nomeFantasia = entity.nomeFantasia;
    dto.cnpj = entity.cnpj;
    dto.inscricaoEstadual = entity.inscricaoEstadual;
    dto.inscricaoMunicipal = entity.inscricaoMunicipal;
    dto.regimeTributario = entity.regimeTributario;
    dto.cnaePrincipal = entity.cnaePrincipal;
    dto.emailFiscal = entity.emailFiscal;
    dto.telefone = entity.telefone;
    dto.logradouro = entity.logradouro;
    dto.numero = entity.numero;
    dto.complemento = entity.complemento;
    dto.bairro = entity.bairro;
    dto.cep = entity.cep;
    dto.cidade = entity.cidade;
    dto.uf = entity.uf;
    dto.codigoIbgeMunicipio = entity.codigoIbgeMunicipio;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
