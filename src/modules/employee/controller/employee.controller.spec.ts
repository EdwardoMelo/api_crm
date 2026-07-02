import { Test, TestingModule } from '@nestjs/testing';
import { TipoContratacao } from '@prisma/client';
import { EmployeeService } from '../service/EmployeeService';
import { EmployeeController } from './EmployeeController';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: jest.Mocked<EmployeeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn().mockResolvedValue({ id: 1 }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get(EmployeeController);
    service = module.get(EmployeeService);
  });

  it('delega create', async () => {
    const dto = {
      nome: 'Ana',
      email: 'ana@test.com',
      tipoContratacao: TipoContratacao.CLT,
    };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delega findAll', async () => {
    await controller.findAll({ sortBy: 'nome' } as never);
    expect(service.findAll).toHaveBeenCalledWith({ sortBy: 'nome' });
  });

  it('delega findById', async () => {
    await controller.findById(3);
    expect(service.findById).toHaveBeenCalledWith(3);
  });

  it('delega update', async () => {
    await controller.update(2, { nome: 'Novo' } as never);
    expect(service.update).toHaveBeenCalledWith(2, { nome: 'Novo' });
  });

  it('delega remove', async () => {
    await controller.remove(5);
    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
