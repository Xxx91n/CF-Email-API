/**
 * Validates an email prefix (the part before @domain).
 * Must start with alphanumeric, may contain dots/underscores/hyphens.
 * Rejects '.', '..', and empty strings.
 */
export function validatePrefix(prefix: string): boolean {
  if (!prefix || prefix === '.' || prefix === '..') return false;
  return /^[a-z0-9][a-z0-9._-]*$/.test(prefix);
}

/**
 * Sanitizes a prefix for safe use as a KV key component.
 * Strips invalid characters and limits length.
 */
export function sanitizePrefix(prefix: string): string {
  return prefix.replace(/[^a-z0-9._-]/g, '').slice(0, 100);
}
