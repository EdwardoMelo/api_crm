export const EMAIL_TEMPLATE_SUGGESTION_MODES = ['generate', 'improve'] as const;

export type EmailTemplateSuggestionMode = (typeof EMAIL_TEMPLATE_SUGGESTION_MODES)[number];
