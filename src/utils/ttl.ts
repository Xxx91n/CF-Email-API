import type { TTLUnit } from '../types';

const TTL_MULTIPLIERS: Record<TTLUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

export function calculateTTL(value: number, unit: TTLUnit): number {
  const multiplier = TTL_MULTIPLIERS[unit];
  if (!multiplier) {
    return 600;
  }
  return value * multiplier;
}

export function parseTTLConfig(ttlStr: string, unitStr: string): number {
  const ttl = parseInt(ttlStr, 10);
  if (isNaN(ttl) || ttl <= 0) {
    return 600;
  }

  const unit = unitStr as TTLUnit;
  if (!TTL_MULTIPLIERS[unit]) {
    return 600;
  }

  return calculateTTL(ttl, unit);
}
