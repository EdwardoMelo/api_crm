import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

const superCanActivate = jest.fn().mockReturnValue(true);

jest.mock('@nestjs/passport', () => ({
  AuthGuard: (_strategy: string) =>
    class MockAuthGuard {
      canActivate(context: ExecutionContext) {
        return superCanActivate(context);
      }
    },
}));

describe('JwtAuthGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: JwtAuthGuard;

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    superCanActivate.mockClear();
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  it('permite rota publica sem chamar super', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it('delega para super quando rota nao e publica', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    guard.canActivate(context);
    expect(superCanActivate).toHaveBeenCalledWith(context);
  });
});
