import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { tenant_fiscal_info_regimeTributario } from '@prisma/client';
import { Trim } from '../../../../common/decorators';

export { tenant_fiscal_info_regimeTributario as RegimeTributario };

export class UpsertTenantFiscalInfoDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  razaoSocial: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  nomeFantasia?: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos.' })
  cnpj: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(30)
  inscricaoEstadual?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(30)
  inscricaoMunicipal?: string;

  @IsOptional()
  @IsEnum(tenant_fiscal_info_regimeTributario)
  regimeTributario?: tenant_fiscal_info_regimeTributario;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(10)
  cnaePrincipal?: string;

  @IsOptional()
  @Trim()
  @IsEmail()
  @MaxLength(180)
  emailFiscal?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  logradouro?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  numero?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  complemento?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  bairro?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'CEP deve conter 8 dígitos numéricos.' })
  cep?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  cidade?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @Length(2, 2, { message: 'UF deve ter 2 caracteres.' })
  uf?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @Matches(/^\d{7}$/, { message: 'Código IBGE do município deve ter 7 dígitos.' })
  codigoIbgeMunicipio?: string;
}
