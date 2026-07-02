import 'reflect-metadata';
import { CreateBudgetDTORequest } from './request/CreateBudgetDTORequest';
import { ListBudgetDTOQuery } from './request/ListBudgetDTOQuery';
import { SendBudgetEmailDTORequest } from './request/SendBudgetEmailDTORequest';
import { UpdateBudgetDTORequest } from './request/UpdateBudgetDTORequest';

describe('Budget DTOs', () => {
  it('podem ser instanciados', () => {
    expect(new CreateBudgetDTORequest()).toBeDefined();
    expect(new ListBudgetDTOQuery()).toBeDefined();
    expect(new SendBudgetEmailDTORequest()).toBeDefined();
    expect(new UpdateBudgetDTORequest()).toBeDefined();
  });
});
