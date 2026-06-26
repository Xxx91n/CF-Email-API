import type { EmailData } from '../types';

const EMAIL_KEY_PREFIX = 'email:';
const CODE_KEY_PREFIX = 'code:';

function sanitizePrefix(prefix: string): string {
  return prefix.replace(/[^a-z0-9._-]/g, '').slice(0, 100);
}

export async function saveEmail(
  kv: KVNamespace,
  prefix: string,
  emailData: EmailData,
  ttl: number
): Promise<void> {
  const safePrefix = sanitizePrefix(prefix);
  const emailKey = `${EMAIL_KEY_PREFIX}${safePrefix}`;
  const codeKey = `${CODE_KEY_PREFIX}${safePrefix}`;

  await Promise.all([
    kv.put(emailKey, JSON.stringify(emailData), { expirationTtl: ttl }),
    kv.put(codeKey, emailData.code || '', { expirationTtl: ttl }),
  ]);
}

export async function getEmail(
  kv: KVNamespace,
  prefix: string
): Promise<EmailData | null> {
  const safePrefix = sanitizePrefix(prefix);
  const key = `${EMAIL_KEY_PREFIX}${safePrefix}`;
  const data = await kv.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as EmailData;
  } catch {
    console.error(`[storage] corrupt data for prefix: ${safePrefix}`);
    return null;
  }
}

export async function getCode(
  kv: KVNamespace,
  prefix: string
): Promise<string | null> {
  const safePrefix = sanitizePrefix(prefix);
  const key = `${CODE_KEY_PREFIX}${safePrefix}`;
  return await kv.get(key);
}

export async function deleteEmail(
  kv: KVNamespace,
  prefix: string
): Promise<void> {
  const safePrefix = sanitizePrefix(prefix);
  const emailKey = `${EMAIL_KEY_PREFIX}${safePrefix}`;
  const codeKey = `${CODE_KEY_PREFIX}${safePrefix}`;
  await Promise.all([
    kv.delete(emailKey),
    kv.delete(codeKey),
  ]);
}