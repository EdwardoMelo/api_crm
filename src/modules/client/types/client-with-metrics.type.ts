import { Client } from '@prisma/client';

export type ClientWithMetrics = Client & {
  valorOrcado: number;
  valorVendido: number;
};
