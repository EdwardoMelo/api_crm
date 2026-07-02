import 'reflect-metadata';
import { CreateCashFlowDTORequest } from './request/CreateCashFlowDTORequest';
import { UpdateCashFlowDTORequest } from './request/UpdateCashFlowDTORequest';
import { ListCashFlowDTOQuery } from './request/ListCashFlowDTOQuery';
import { ListCashFlowCategoryDTOQuery } from './request/ListCashFlowCategoryDTOQuery';
import { CreateInstallmentPlanDTORequest } from './request/CreateInstallmentPlanDTORequest';
import { ListInstallmentPlanDTOQuery } from './request/ListInstallmentPlanDTOQuery';
import {
  CreateFixedExpenseDTORequest,
  RenewFixedExpenseDTORequest,
  UpdateFixedExpenseDTORequest,
} from './request/FixedExpenseDTORequest';
import {
  CreateFixedIncomeDTORequest,
  RenewFixedIncomeDTORequest,
  UpdateFixedIncomeDTORequest,
} from './request/FixedIncomeDTORequest';
import { ListFixedExpenseDTOQuery } from './request/ListFixedExpenseDTOQuery';
import { ListFixedIncomeDTOQuery } from './request/ListFixedIncomeDTOQuery';
import { CashFlowListDTOResponse } from './response/CashFlowListDTOResponse';
import { CashFlowCategoryListDTOResponse } from './response/CashFlowCategoryListDTOResponse';

describe('CashFlow DTOs', () => {
  it('podem ser instanciados', () => {
    expect(new CreateCashFlowDTORequest()).toBeDefined();
    expect(new UpdateCashFlowDTORequest()).toBeDefined();
    expect(new ListCashFlowDTOQuery()).toBeDefined();
    expect(new ListCashFlowCategoryDTOQuery()).toBeDefined();
    expect(new CreateInstallmentPlanDTORequest()).toBeDefined();
    expect(new ListInstallmentPlanDTOQuery()).toBeDefined();
    expect(new CreateFixedExpenseDTORequest()).toBeDefined();
    expect(new RenewFixedExpenseDTORequest()).toBeDefined();
    expect(new UpdateFixedExpenseDTORequest()).toBeDefined();
    expect(new CreateFixedIncomeDTORequest()).toBeDefined();
    expect(new RenewFixedIncomeDTORequest()).toBeDefined();
    expect(new UpdateFixedIncomeDTORequest()).toBeDefined();
    expect(new ListFixedExpenseDTOQuery()).toBeDefined();
    expect(new ListFixedIncomeDTOQuery()).toBeDefined();
    expect(new CashFlowListDTOResponse()).toBeDefined();
    expect(new CashFlowCategoryListDTOResponse()).toBeDefined();
  });
});
