export function auditCreateFields(actor: string): { createdBy: string; updatedBy: string } {
  return { createdBy: actor, updatedBy: actor };
}

export function auditUpdateFields(actor: string): { updatedBy: string } {
  return { updatedBy: actor };
}
