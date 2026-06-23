import { ActorContextService } from '../audit';

export const mockActorContextProvider = {
  provide: ActorContextService,
  useValue: {
    getActorId: () => '1',
    getActorIdOrSystem: () => '1',
  },
};
