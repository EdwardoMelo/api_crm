import { UnauthorizedException } from '@nestjs/common';
import { ActorContextService } from './actor-context.service';

describe('ActorContextService', () => {
  const buildService = (user?: { id: number; nome: string; email: string }) =>
    new ActorContextService({ user } as never);

  it('getActorId retorna id do usuario', () => {
    expect(buildService({ id: 5, nome: 'Ana', email: 'a@t.com' }).getActorId()).toBe('5');
  });

  it('getActorId lança sem usuario', () => {
    expect(() => buildService().getActorId()).toThrow(UnauthorizedException);
  });

  it('getActorIdOrSystem retorna system sem usuario', () => {
    expect(buildService().getActorIdOrSystem()).toBe('system');
  });

  it('getActorNome e getActorEmail com fallbacks', () => {
    const svc = buildService();
    expect(svc.getActorNome()).toBe('Equipe');
    expect(svc.getActorEmail()).toBe('');
  });
});
