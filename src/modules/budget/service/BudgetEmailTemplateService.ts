import { Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { BudgetEmailVariableKey } from '../constants/budget-email-variables.constants';
import {
  CreateBudgetEmailTemplateDTORequest,
  PreviewBudgetEmailTemplateDTORequest,
  UpdateBudgetEmailTemplateDTORequest,
} from '../dto/request/BudgetEmailTemplateDTORequest';
import { BudgetEmailTemplateDTOResponse } from '../dto/response/BudgetEmailTemplateDTOResponse';
import { BudgetEmailTemplatePreviewDTOResponse } from '../dto/response/BudgetEmailContextDTOResponse';
import { BudgetEmailTemplateRepository } from '../repository/BudgetEmailTemplateRepository';
import {
  BudgetEmailVariableContext,
  detectBudgetEmailVariables,
  resolveBudgetEmailTemplate,
} from '../utils/budget-email-template.utils';

@Injectable()
export class BudgetEmailTemplateService {
  private readonly logger = new Logger(BudgetEmailTemplateService.name);

  constructor(private readonly templateRepository: BudgetEmailTemplateRepository) {}

  findAll(): Promise<BudgetEmailTemplateDTOResponse[]> {
    return this.templateRepository
      .findAll()
      .then((entities) => BudgetEmailTemplateDTOResponse.fromEntities(entities));
  }

  async findById(id: number): Promise<BudgetEmailTemplateDTOResponse> {
    const entity = await this.templateRepository.findById(id);
    if (!entity) {
      throw new EntityNotFoundException('Template de e-mail de orçamento', id);
    }
    return BudgetEmailTemplateDTOResponse.fromEntity(entity);
  }

  async create(dto: CreateBudgetEmailTemplateDTORequest): Promise<BudgetEmailTemplateDTOResponse> {
    try {
      const entity = await this.templateRepository.create({
        nome: dto.nome,
        assunto: dto.assunto,
        corpo: dto.corpo,
        variaveis: dto.variaveis ?? [],
      });
      return BudgetEmailTemplateDTOResponse.fromEntity(entity);
    } catch (error) {
      this.logger.error('Erro ao criar template de e-mail de orçamento', (error as Error).stack);
      throw error;
    }
  }

  async update(
    id: number,
    dto: UpdateBudgetEmailTemplateDTORequest,
  ): Promise<BudgetEmailTemplateDTOResponse> {
    await this.findById(id);
    try {
      const entity = await this.templateRepository.update(id, dto);
      return BudgetEmailTemplateDTOResponse.fromEntity(entity);
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
    context: BudgetEmailVariableContext,
    linkArquivo?: string | null,
  ): { assunto: string; corpo: string } {
    return {
      assunto: resolveBudgetEmailTemplate(assunto, context, linkArquivo),
      corpo: resolveBudgetEmailTemplate(corpo, context, linkArquivo),
    };
  }

  previewFromBody(
    dto: PreviewBudgetEmailTemplateDTORequest,
    context: BudgetEmailVariableContext,
    linkArquivo?: string | null,
  ): BudgetEmailTemplatePreviewDTOResponse {
    const preview = detectBudgetEmailVariables(dto.assunto, dto.corpo, context, linkArquivo);
    const response = new BudgetEmailTemplatePreviewDTOResponse();
    response.assunto = preview.assunto;
    response.corpo = preview.corpo;
    response.variaveis = preview.variaveis;
    return response;
  }

  async createFromDetected(
    nome: string,
    assunto: string,
    corpo: string,
    variaveis: BudgetEmailVariableKey[],
  ): Promise<BudgetEmailTemplateDTOResponse> {
    if (!nome.trim()) {
      throw new BusinessRuleException('Informe um nome para o template.');
    }
    return this.create({ nome, assunto, corpo, variaveis });
  }
}
