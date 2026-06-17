import { TenantContextService } from '../tenant';

export const mockTenantContextProvider = {
  provide: TenantContextService,
  useValue: { getTenantId: () => 1 },
};
