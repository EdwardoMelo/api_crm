import { Injectable, Logger } from '@nestjs/common';
import { tenant_billing_accounts } from '@prisma/client';
import { SYSTEM_ACTOR } from '../../../common/audit';
import { BusinessRuleException } from '../../../common/exceptions';
import { ASAAS_SANDBOX_TEST_CPF } from '../constants/asaas-billing.constants';
import { tenantExternalReference } from '../constants/asaas-external-reference';
import { BillingRepository } from '../repository/BillingRepository';
import { AsaasClient } from './AsaasClient';

@Injectable()
export class BillingAccountService {
  private readonly logger = new Logger(BillingAccountService.name);

  constructor(
    private readonly repository: BillingRepository,
    private readonly asaas: AsaasClient,
  ) {}

  /**
   * Garante que o tenant tenha um customer no Asaas (idempotente por tenantId).
   */
  async ensureCustomer(
    tenantId: number,
    actor: string = SYSTEM_ACTOR,
  ): Promise<tenant_billing_accounts> {
    const existing = await this.repository.findBillingAccountByTenant(tenantId);
    if (existing) {
      return existing;
    }

    const context = await this.repository.findTenantBillingContext(tenantId);
    if (!context) {
      throw new BusinessRuleException('Tenant nao encontrado para billing.');
    }

    const externalReference = tenantExternalReference(tenantId);
    const adminUser = context.users[0];
    const cpfCnpj = context.tenant_fiscal_info?.cnpj ?? ASAAS_SANDBOX_TEST_CPF;
    const email =
      context.tenant_fiscal_info?.emailFiscal ?? adminUser?.email ?? undefined;

    const customer = await this.asaas.createCustomer({
      name: context.nome,
      cpfCnpj,
      email,
      externalReference,
    });

    this.logger.log(
      `Customer Asaas criado para tenant ${tenantId}: ${customer.id}`,
    );

    return this.repository.createBillingAccount({
      tenantId,
      asaasCustomerId: customer.id,
      externalReference,
      cpfCnpj,
      email: email ?? null,
      actor,
    });
  }
}
