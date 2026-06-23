import { randomBytes } from 'crypto';

export function slugifyTenantName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return base || 'conta';
}

export function generateTenantSlug(name: string): string {
  const suffix = randomBytes(3).toString('hex');
  return `${slugifyTenantName(name)}-${suffix}`;
}
