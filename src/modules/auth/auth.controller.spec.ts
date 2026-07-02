import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './controller/AuthController';
import { AuthService } from './service/AuthService';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({ id: 1 }),
            login: jest.fn().mockResolvedValue({ token: 't' }),
            getMe: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  it('delega register, login e me', async () => {
    await controller.register({} as never);
    await controller.login({} as never);
    await controller.me({ id: 7 } as never);
    expect(service.register).toHaveBeenCalled();
    expect(service.login).toHaveBeenCalled();
    expect(service.getMe).toHaveBeenCalledWith(7);
  });
});
