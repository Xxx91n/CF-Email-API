export interface Env {
  EMAIL_KV: KVNamespace;
  AI: Ai;
  DEFAULT_TTL: string;
  DEFAULT_TTL_UNIT: string;
  ENABLE_AI: string;
  REQUIRE_AUTH: string;
  AUTH_TOKEN?: string;
}

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  code: string | null;
  receivedAt: string;
  expiresAt: string;
}

export interface GlobalConfig {
  defaultTTL: number;
  defaultTTLUnit: TTLUnit;
  enableAI: boolean;
  requireAuth: boolean;
  authToken?: string;
}

export type TTLUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export enum ErrorCode {
  NO_EMAIL_FOUND = 'no_email_found',
  NO_CODE_FOUND = 'no_code_found',
  INVALID_PREFIX = 'invalid_prefix',
  UNAUTHORIZED = 'unauthorized',
  INTERNAL_ERROR = 'internal_error',
  KV_ERROR = 'kv_error',
  AI_ERROR = 'ai_error',
}

export interface ErrorResponse {
  error: ErrorCode;
  prefix?: string;
  message: string;
  timestamp: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  prefix?: string;
  action: string;
  message: string;
  duration?: number;
}
