export const EMAIL_TEMPLATE_TONES = ['formal', 'descontraido', 'minimalista'] as const;

export type EmailTemplateTone = (typeof EMAIL_TEMPLATE_TONES)[number];

export const EMAIL_TEMPLATE_TONE_PROMPTS: Record<EmailTemplateTone, string> = {
  formal:
    'Tom formal: respeitoso, profissional, frases completas e linguagem corporativa adequada para e-mail comercial.',
  descontraido:
    'Tom descontraído: caloroso, amigável e conversacional, mas ainda apropriado para contexto de negócios e envio de orçamento.',
  minimalista:
    'Tom minimalista: curto, direto e objetivo, sem floreios — apenas o essencial para comunicar o orçamento.',
};
