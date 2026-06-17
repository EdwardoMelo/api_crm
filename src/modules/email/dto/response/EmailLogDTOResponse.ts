import { EmailLog } from '@prisma/client';
import { EmailStatus } from '../../../../common/enums';

export class EmailLogDTOResponse {
  id: number;
  destinatario: string;
  assunto: string;
  conteudo: string;
  status: EmailStatus;
  dataEnvio: Date | null;
  createdAt: Date;

  static fromEntity(entity: EmailLog): EmailLogDTOResponse {
    const dto = new EmailLogDTOResponse();
    dto.id = entity.id;
    dto.destinatario = entity.destinatario;
    dto.assunto = entity.assunto;
    dto.conteudo = entity.conteudo;
    dto.status = entity.status;
    dto.dataEnvio = entity.dataEnvio;
    dto.createdAt = entity.createdAt;
    return dto;
  }

  static fromEntities(entities: EmailLog[]): EmailLogDTOResponse[] {
    return entities.map((entity) => EmailLogDTOResponse.fromEntity(entity));
  }
}
