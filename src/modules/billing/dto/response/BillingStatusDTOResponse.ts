import { tenants_billingStatus } from '@prisma/client';

export class BillingStatusLastPaymentDTO {
  id: number;
  status: string;
  billingType: string;
  amount: number;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  failureMessage: string | null;
  dueDate: string | null;
  paidAt: string | null;
}

export class BillingStatusDTOResponse {
  billingStatus: tenants_billingStatus;
  accessExpiresAt: string | null;
  planCode: string | null;
  planName: string | null;
  amount: number | null;
  lastPayment: BillingStatusLastPaymentDTO | null;
}
