import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { LoginDTORequest } from '../dto/request/LoginDTORequest';
import { RegisterDTORequest } from '../dto/request/RegisterDTORequest';
import { AuthDTOResponse } from '../dto/response/AuthDTOResponse';
import { MeDTOResponse } from '../dto/response/MeDTOResponse';
import { RegisterDTOResponse } from '../dto/response/RegisterDTOResponse';
import { AuthService } from '../service/AuthService';
import { AuthenticatedUser } from '../types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDTORequest): Promise<RegisterDTOResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDTORequest): Promise<AuthDTOResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<MeDTOResponse> {
    return this.authService.getMe(user.id);
  }
}
