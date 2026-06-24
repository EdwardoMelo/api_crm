import { Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { EmailTemplateVariableKey } from '../constants/email-template-variables.constants';
import {
  CreateEmailTemplateDTORequest,
  PreviewEmailTemplateBodyDTORequest,
  UpdateEmailTemplateDTORequest,
} from '../dto/request/EmailTemplateDTORequest';
import {
  EmailTemplateDTOResponse,
  EmailTemplatePreviewDTOResponse,
} from '../dto/response/EmailTemplateDTOResponse';
import { EmailTemplateRepository } from '../repository/EmailTemplateRepository';
import { EmailTemplateVariableContext } from '../types/variable-context.types';
import {
  detectEmailTemplateVariables,
  resolveEmailTemplate,
} from '../utils/email-template.utils';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(private readonly templateRepository: EmailTemplateRepository) {}

  findAll(): Promise<EmailTemplateDTOResponse[]> {
    return this.templateRepository
      .findAll()
      .then((entities) => EmailTemplateDTOResponse.fromEntities(entities));
  }

  async findById(id: number): Promise<EmailTemplateDTOResponse> {
    const entity = await this.templateRepository.findById(id);
    if (!entity) {
      throw new EntityNotFoundException('Template de e-mail', id);
    }
    return EmailTemplateDTOResponse.fromEntity(entity);
  }

  async create(dto: CreateEmailTemplateDTORequest): Promise<EmailTemplateDTOResponse> {
    try {
      const entity = await this.templateRepository.create({
        nome: dto.nome,
        assunto: dto.assunto,
        corpo: dto.corpo,
        variaveis: dto.variaveis ?? [],
      });
      return EmailTemplateDTOResponse.fromEntity(entity);
    } catch (error) {
      this.logger.error('Erro ao criar template de e-mail', (error as Error).stack);
      throw error;
    }
  }

  async update(
    id: number,
    dto: UpdateEmailTemplateDTORequest,
  ): Promise<EmailTemplateDTOResponse> {
    await this.findById(id);
    try {
      const entity = await this.templateRepository.update(id, dto);
      return EmailTemplateDTOResponse.fromEntity(entity);
    } catch (error) {
      this.logger.error(`Erro ao atualizar template ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.templateRepository.delete(id);
  }

  resolveTemplateText(
    assunto: string,
    corpo: string,
    context: EmailTemplateVariableContext,
    linkArquivo?: string | null,
  ): { assunto: string; corpo: string } {
    return {
      assunto: resolveEmailTemplate(assunto, context, linkArquivo),
      corpo: resolveEmailTemplate(corpo, context, linkArquivo),
    };
  }

  previewFromBody(
    dto: PreviewEmailTemplateBodyDTORequest,
    context: EmailTemplateVariableContext,
    linkArquivo?: string | null,
  ): EmailTemplatePreviewDTOResponse {
    const preview = detectEmailTemplateVariables(dto.assunto, dto.corpo, context, linkArquivo);
    const response = new EmailTemplatePreviewDTOResponse();
    response.assunto = preview.assunto;
    response.corpo = preview.corpo;
    response.variaveis = preview.variaveis;
    return response;
  }

  async createFromDetected(
    nome: string,
    assunto: string,
    corpo: string,
    variaveis: EmailTemplateVariableKey[],
  ): Promise<EmailTemplateDTOResponse> {
    if (!nome.trim()) {
      throw new BusinessRuleException('Informe um nome para o template.');
    }
    return this.create({ nome, assunto, corpo, variaveis });
  }
}
