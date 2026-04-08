import type { EmailData } from '../types';

const EMAIL_KEY_PREFIX = 'email:';
const CODE_KEY_PREFIX = 'code:';

export async function saveEmail(
  kv: KVNamespace,
  prefix: string,
  emailData: EmailData,
  ttl: number
): Promise<void> {
  const emailKey = `${EMAIL_KEY_PREFIX}${prefix}`;
  const codeKey = `${CODE_KEY_PREFIX}${prefix}`;

  await Promise.all([
    kv.put(emailKey, JSON.stringify(emailData), { expirationTtl: ttl }),
    kv.put(codeKey, emailData.code || '', { expirationTtl: ttl }),
  ]);
}

export async function getEmail(
  kv: KVNamespace,
  prefix: string
): Promise<EmailData | null> {
  const key = `${EMAIL_KEY_PREFIX}${prefix}`;
  const data = await kv.get(key);
  if (!data) return null;
  return JSON.parse(data) as EmailData;
}

export async function getCode(
  kv: KVNamespace,
  prefix: string
): Promise<string | null> {
  const key = `${CODE_KEY_PREFIX}${prefix}`;
  return await kv.get(key);
}

export async function deleteEmail(
  kv: KVNamespace,
  prefix: string
): Promise<void> {
  const emailKey = `${EMAIL_KEY_PREFIX}${prefix}`;
  const codeKey = `${CODE_KEY_PREFIX}${prefix}`;
  await Promise.all([
    kv.delete(emailKey),
    kv.delete(codeKey),
  ]);
}
