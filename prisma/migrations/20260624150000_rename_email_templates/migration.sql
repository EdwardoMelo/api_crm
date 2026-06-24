-- Rename budget-specific table to generic email_templates
RENAME TABLE `budget_email_templates` TO `email_templates`;

-- Align index name with table rename (MySQL keeps old name after RENAME TABLE)
ALTER TABLE `email_templates`
  RENAME INDEX `budget_email_templates_tenantId_nome_key` TO `email_templates_tenantId_nome_key`;
