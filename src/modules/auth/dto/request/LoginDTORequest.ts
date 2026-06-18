import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../../common/decorators';

export class LoginDTORequest {
  @Trim()
  @IsEmail()
  @MaxLength(180)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
