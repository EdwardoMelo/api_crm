const TENANT_PREFIX = 'tenant:';
const SUB_PREFIX = 'sub:';
const PAY_PREFIX = 'pay:';

export function tenantExternalReference(tenantId: number): string {
  return `${TENANT_PREFIX}${tenantId}`;
}

export function subscriptionExternalReference(subscriptionId: number): string {
  return `${SUB_PREFIX}${subscriptionId}`;
}

export function paymentExternalReference(paymentId: number): string {
  return `${PAY_PREFIX}${paymentId}`;
}

export function parsePaymentExternalReference(
  externalReference: string | null | undefined,
): number | null {
  if (!externalReference?.startsWith(PAY_PREFIX)) {
    return null;
  }
  const id = Number.parseInt(externalReference.slice(PAY_PREFIX.length), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
