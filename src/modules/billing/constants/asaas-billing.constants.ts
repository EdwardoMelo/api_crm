export const DEFAULT_BILLING_PLAN_CODE = 'monthly_default';

export const ASAAS_USER_AGENT = 'DomidyCRM/1.0';

/** Eventos que liberam acesso ao tenant (doc: payment events). */
export const ASAAS_ACCESS_GRANT_EVENTS = new Set([
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
]);

/** Eventos de falha (cartao/risco) que devem ser expostos ao usuario. */
export const ASAAS_PAYMENT_FAILURE_EVENTS = new Set([
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
]);

/** CPF valido para testes no Sandbox Asaas (documentacao). */
export const ASAAS_SANDBOX_TEST_CPF = '24971563792';

export const ASAAS_SANDBOX_CARD_SUCCESS = {
  holderName: 'John Doe',
  number: '4444444444444444',
  expiryMonth: '12',
  expiryYear: '2030',
  ccv: '123',
};

export const ASAAS_SANDBOX_CARD_DECLINED = {
  holderName: 'John Doe',
  number: '5184019740373151',
  expiryMonth: '12',
  expiryYear: '2030',
  ccv: '123',
};

export const ASAAS_SANDBOX_CARD_HOLDER = {
  name: 'John Doe',
  email: 'john.doe@asaas.com.br',
  cpfCnpj: ASAAS_SANDBOX_TEST_CPF,
  postalCode: '01310000',
  addressNumber: '150',
  addressComplement: null as string | null,
  phone: '4738010919',
  mobilePhone: '4799376637',
};

export const ASAAS_BILLING_WEBHOOK_EVENTS = [
  'PAYMENT_CREATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
];
