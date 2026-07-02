import 'reflect-metadata';
import {
  CreateEmailTemplateDTORequest,
  PreviewEmailTemplateBodyDTORequest,
  UpdateEmailTemplateDTORequest,
} from './request/EmailTemplateDTORequest';
import { SuggestEmailTemplateDTORequest } from './request/SuggestEmailTemplateDTORequest';

describe('EmailTemplate DTOs', () => {
  it('podem ser instanciados', () => {
    expect(new CreateEmailTemplateDTORequest()).toBeDefined();
    expect(new PreviewEmailTemplateBodyDTORequest()).toBeDefined();
    expect(new UpdateEmailTemplateDTORequest()).toBeDefined();
    expect(new SuggestEmailTemplateDTORequest()).toBeDefined();
  });
});
