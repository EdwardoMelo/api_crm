/**
 * Regras de contexto e qualidade para geração de templates via IA.
 * Fluxo: USUÁRIO + EMPRESA (remetente) → CLIENTE (destinatário).
 */

export const EMAIL_TEMPLATE_SUGGESTION_SYSTEM_PROMPT = `Você escreve templates de e-mail comercial em português brasileiro (pt-BR).
O e-mail será enviado por um usuário da empresa (vendedor/prestador) PARA um cliente (comprador/contratante).

Responda SOMENTE com JSON válido: { "assunto": "...", "corpo": "..." }.
Use APENAS os placeholders fornecidos no formato {{chave}} — nunca invente chaves novas.
O corpo deve ser texto simples com quebras de linha (\\n), sem HTML ou markdown.`;

export const EMAIL_TEMPLATE_SUGGESTION_CONTEXT_RULES = `## Contexto da comunicação
- REMETENTE (quem envia): variáveis empresa.* e usuario.*
- DESTINATÁRIO (quem recebe e lê o e-mail): variáveis cliente.*
- OBJETO da mensagem: variáveis orcamento.* (proposta comercial sendo apresentada ao cliente)

O texto deve ser escrito na perspectiva do remetente falando COM o destinatário.
Trate o cliente na segunda pessoa ("você", "seu/sua") quando fizer sentido.`;

export const EMAIL_TEMPLATE_SUGGESTION_VARIABLE_USAGE_RULES = `## Uso correto das variáveis por papel

### Destinatário (cliente.*) — use para se dirigir AO cliente
- Saudação: "Olá, {{cliente.nome}}", "Prezado(a) {{cliente.nome}}", "Oi, {{cliente.nome}}"
- Referências ao cliente: empresa do cliente, contato, documento
- NUNCA use cliente.* na assinatura ou despedida como se o cliente estivesse enviando o e-mail

### Remetente (usuario.* e empresa.*) — use para identificar QUEM envia
- Assinatura/despedida: "Atenciosamente,\\n{{usuario.nome}}", "{{empresa.nome}}", "{{usuario.email}}"
- Apresentação da empresa remetente: razão social, CNPJ, telefone, endereço
- NUNCA use usuario.* ou empresa.* na saudação dirigida ao leitor (o leitor é o cliente)

### Orçamento (orcamento.*) — use para apresentar a proposta AO cliente
- Valor, título, descrição, validade, link do PDF
- Framing: "segue o orçamento", "conforme combinado", "valor de {{orcamento.valorFormatado}}"`;

export const EMAIL_TEMPLATE_SUGGESTION_QUALITY_RULES = `## Regras de qualidade (obrigatórias)
1. Idioma: português brasileiro natural, sem anglicismos desnecessários.
2. Direção: remetente (empresa/usuário) → destinatário (cliente). Não inverta os papéis.
3. Saudação sempre dirigida ao cliente (cliente.*), nunca ao usuário remetente.
4. Assinatura sempre do lado remetente (usuario.* e/ou empresa.*), nunca do cliente.
5. Inclua TODAS as variáveis obrigatórias da lista, de forma natural no assunto e/ou corpo.
6. O assunto deve ser claro e relacionado ao orçamento (use orcamento.* se disponível).
7. Não invente dados, links ou variáveis que não foram fornecidas.
8. Não use HTML, markdown, emojis excessivos nem aspas extras no JSON de resposta.`;

export const EMAIL_TEMPLATE_SUGGESTION_EXAMPLES = `## Exemplos de uso correto vs incorreto

ERRADO (saudação ao remetente):
"Olá, {{usuario.nome}}, segue o orçamento..."

CORRETO (saudação ao destinatário):
"Olá, {{cliente.nome}}, segue o orçamento de {{orcamento.titulo}}..."

ERRADO (assinatura do destinatário):
"Atenciosamente,\\n{{cliente.nome}}"

CORRETO (assinatura do remetente):
"Atenciosamente,\\n{{usuario.nome}}\\n{{empresa.nome}}\\n{{usuario.email}}"`;

export const EMAIL_TEMPLATE_VARIABLE_ROLE_LABELS: Record<string, string> = {
  empresa: 'Remetente — dados da empresa que envia',
  usuario: 'Remetente — usuário que assina o e-mail',
  cliente: 'Destinatário — cliente que recebe o e-mail',
  orcamento: 'Objeto — dados do orçamento apresentado ao cliente',
};

export const EMAIL_TEMPLATE_SUGGESTION_IMPROVE_RULES = `## Modo: melhorar rascunho existente
O usuário já escreveu (ou gerou) um rascunho parcial. Sua tarefa é MELHORAR esse texto, não descartá-lo.

Regras específicas:
1. Preserve a intenção e o conteúdo essencial do rascunho do usuário.
2. Melhore clareza, fluidez, tom e estrutura conforme o tom solicitado.
3. Mantenha placeholders {{chave}} válidos que já existem no rascunho.
4. Inclua variáveis obrigatórias da lista que ainda não aparecem no rascunho, de forma natural.
5. Não remova informações relevantes que o usuário já incluiu.
6. Se o assunto do rascunho estiver vazio, crie um assunto adequado; se existir, melhore-o.
7. O resultado deve ser um template completo e pronto para uso, não apenas pequenas correções pontuais.`;
