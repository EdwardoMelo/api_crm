import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreditCardDTORequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  holderName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(19)
  number: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  expiryMonth: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  expiryYear: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  ccv: string;
}

export class CreditCardHolderDTORequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  cpfCnpj: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  addressNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressComplement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobilePhone?: string;
}

export class CreateBillingCheckoutDTORequest {
  @IsIn(['PIX', 'BOLETO', 'CREDIT_CARD'])
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardDTORequest)
  creditCard?: CreditCardDTORequest;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardHolderDTORequest)
  creditCardHolderInfo?: CreditCardHolderDTORequest;
}
