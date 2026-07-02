import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ActorContextService } from '../../../common/audit';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/auth.types';
import { CreateBillingCheckoutDTORequest } from '../dto/request/CreateBillingCheckoutDTORequest';
import { BillingCheckoutDTOResponse } from '../dto/response/BillingCheckoutDTOResponse';
import { BillingStatusDTOResponse } from '../dto/response/BillingStatusDTOResponse';
import { BillingCheckoutService } from '../service/BillingCheckoutService';
import { BillingStatusService } from '../service/BillingStatusService';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly checkoutService: BillingCheckoutService,
    private readonly statusService: BillingStatusService,
    private readonly actorContext: ActorContextService,
  ) {}

  @Get('status')
  getStatus(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BillingStatusDTOResponse> {
    return this.statusService.getStatus(user.tenantId);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBillingCheckoutDTORequest,
  ): Promise<BillingCheckoutDTOResponse> {
    const result = await this.checkoutService.checkout({
      tenantId: user.tenantId,
      actor: this.actorContext.getActorIdOrSystem(),
      billingType: dto.billingType,
      autoRenew: dto.autoRenew,
      creditCard: dto.creditCard,
      creditCardHolderInfo: dto.creditCardHolderInfo,
    });
    return BillingCheckoutDTOResponse.fromResult(result);
  }
}
