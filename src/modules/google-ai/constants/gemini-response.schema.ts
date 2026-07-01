import { Type } from '@google/genai';

export const EMAIL_TEMPLATE_SUGGESTION_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    assunto: {
      type: Type.STRING,
      description: 'Assunto do e-mail com placeholders {{chave}}',
    },
    corpo: {
      type: Type.STRING,
      description: 'Corpo do e-mail em texto simples com quebras de linha e placeholders {{chave}}',
    },
  },
  required: ['assunto', 'corpo'],
  propertyOrdering: ['assunto', 'corpo'],
};
