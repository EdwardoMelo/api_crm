import { SetMetadata } from '@nestjs/common';

export const NO_IMPERSONATION_KEY = 'noImpersonation';

/** Bloqueia acesso quando SYSTEM_ADMIN está impersonando um tenant. */
export const NoImpersonation = () => SetMetadata(NO_IMPERSONATION_KEY, true);
