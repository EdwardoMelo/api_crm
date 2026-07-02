import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { users_role } from '@prisma/client';
import { ACT_AS_TENANT_HEADER } from '../../../common/tenant/tenant.constants';
import { SystemAdminGuard } from './system-admin.guard';

describe('SystemAdminGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: SystemAdminGuard;

  const buildContext = (user?: object, impersonating = false) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          headers: impersonating ? { [ACT_AS_TENANT_HEADER]: '2' } : {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new SystemAdminGuard(reflector as unknown as Reflector);
  });

  it('permite SYSTEM_ADMIN', () => {
    expect(
      guard.canActivate(
        buildContext({ role: users_role.SYSTEM_ADMIN, id: 1, nome: 'Admin', email: 'a@t.com' }),
      ),
    ).toBe(true);
  });

  it('nega usuario comum', () => {
    expect(() =>
      guard.canActivate(buildContext({ role: users_role.ADMIN, id: 1, nome: 'A', email: 'a@t.com' })),
    ).toThrow(ForbiddenException);
  });

  it('nega sem usuario', () => {
    expect(() => guard.canActivate(buildContext())).toThrow(ForbiddenException);
  });

  it('nega impersonation quando NO_IMPERSONATION exigido', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(() =>
      guard.canActivate(
        buildContext(
          { role: users_role.SYSTEM_ADMIN, id: 1, nome: 'Admin', email: 'a@t.com' },
          true,
        ),
      ),
    ).toThrow('modo de visualização');
  });
});
