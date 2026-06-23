import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../../../common/decorators';

export enum AccountType {
  PESSOA_FISICA = 'PESSOA_FISICA',
  EMPRESA = 'EMPRESA',
}

export class RegisterDTORequest {
  @IsEnum(AccountType)
  accountType: AccountType;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  nome: string;

  @ValidateIf((dto: RegisterDTORequest) => dto.accountType === AccountType.EMPRESA)
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  nomeEmpresa?: string;

  @Trim()
  @IsEmail()
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string;
}
