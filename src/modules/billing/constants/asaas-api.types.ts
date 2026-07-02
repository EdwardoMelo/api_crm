export interface AsaasErrorItem {
  code: string;
  description: string;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  subscription?: string;
  billingType: string;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  externalReference?: string;
  paymentDate?: string;
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: string;
  cycle: string;
  value: number;
  status: string;
  nextDueDate: string;
  externalReference?: string;
}

export interface AsaasWebhookResponse {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  authToken?: string;
}

export interface AsaasWebhookPayload {
  id: string;
  event: string;
  dateCreated?: string;
  payment?: AsaasPaymentResponse;
}

export interface AsaasCreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInput {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
}
