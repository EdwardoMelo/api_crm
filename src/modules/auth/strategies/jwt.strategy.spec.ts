import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../service/AuthService';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('lanca quando JWT_SECRET ausente', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const authService = {} as AuthService;
    expect(() => new JwtStrategy(config, authService)).toThrow('JWT_SECRET');
  });

  it('validate retorna usuario autenticado', async () => {
    const config = { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
    const authService = {
      validateJwtPayload: jest.fn().mockResolvedValue({ id: 1, email: 'a@t.com' }),
    } as unknown as AuthService;
    const strategy = new JwtStrategy(config, authService);
    const user = await strategy.validate({ sub: 1, email: 'a@t.com' } as never);
    expect(user.id).toBe(1);
  });

  it('validate lança UnauthorizedException em falha', async () => {
    const config = { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
    const authService = {
      validateJwtPayload: jest.fn().mockRejectedValue(new Error('invalid')),
    } as unknown as AuthService;
    const strategy = new JwtStrategy(config, authService);
    await expect(strategy.validate({ sub: 1 } as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
