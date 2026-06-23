export class RegisterDTOResponse {
  message: string;

  static success(): RegisterDTOResponse {
    const dto = new RegisterDTOResponse();
    dto.message = 'Conta criada com sucesso. Faça login para continuar.';
    return dto;
  }
}
