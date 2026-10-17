import { getUserDisplayName } from '@/lib/legacy/formatters';

/**
 * Jejak pembuat dan pengubah data (K-36): setiap dokumen atau entri yang diinput lewat aplikasi menyimpan nama dan
 * email akun yang login, dengan nama field yang sama dengan `createdBy`/`createdByEmail` order (K-16).
 */

export interface Actor {
  name: string;
  email: string;
}

export interface AuditFields {
  createdBy?: string;
  createdByEmail?: string;
  updatedBy?: string;
  updatedByEmail?: string;
}

export const EMPTY_ACTOR: Actor = { name: '', email: '' };

export function actorFromUser(user: { displayName?: string | null; email?: string | null } | null | undefined): Actor {
  if (!user) return EMPTY_ACTOR;
  const email = user.email || '';
  return { name: getUserDisplayName(user) || email, email };
}

export function createdStamp(actor: Actor): Pick<AuditFields, 'createdBy' | 'createdByEmail'> {
  return { createdBy: actor.name, createdByEmail: actor.email };
}

export function updatedStamp(actor: Actor): Pick<AuditFields, 'updatedBy' | 'updatedByEmail'> {
  return { updatedBy: actor.name, updatedByEmail: actor.email };
}

const AUDIT_KEYS = ['createdBy', 'createdByEmail', 'updatedBy', 'updatedByEmail'] as const;

/** Salin field jejak yang terisi saja, untuk diteruskan saat entri dipetakan ulang antar bentuk data. */
export function pickAudit(source: unknown): AuditFields {
  const out: AuditFields = {};
  if (!source || typeof source !== 'object') return out;
  const rec = source as Record<string, unknown>;
  AUDIT_KEYS.forEach((key) => {
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim();
  });
  return out;
}
