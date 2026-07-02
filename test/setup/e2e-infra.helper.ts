/** URL pública do túnel ngrok validado pelo orquestrador E2E (sem barra final). */
export function getE2eNgrokUrl(): string {
  const url = process.env.E2E_NGROK_URL;
  if (!url) {
    throw new Error(
      'E2E_NGROK_URL não definida. Execute npm run test:e2e pelo orquestrador (scripts/run-e2e.js).',
    );
  }
  return url;
}

/** URL da API local iniciada pelo orquestrador E2E. */
export function getE2eServerUrl(): string {
  const url = process.env.E2E_SERVER_URL;
  if (!url) {
    throw new Error(
      'E2E_SERVER_URL não definida. Execute npm run test:e2e pelo orquestrador (scripts/run-e2e.js).',
    );
  }
  return url;
}
