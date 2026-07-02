import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('formata HttpException com resposta string', () => {
    filter.catch(new BadRequestException('invalid'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'invalid',
      }),
    );
  });

  it('formata HttpException com resposta objeto', () => {
    filter.catch(
      new HttpException({ message: ['a', 'b'], error: 'Validation' }, HttpStatus.UNPROCESSABLE_ENTITY),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['a', 'b'],
        error: 'Validation',
      }),
    );
  });

  it('formata erro generico como 500', () => {
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Erro interno do servidor.',
      }),
    );
  });
});
