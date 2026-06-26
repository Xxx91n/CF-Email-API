import type { Context, Next } from 'hono';
import type { Env, ErrorResponse } from '../types';
import { ErrorCode } from '../types';

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  const bufA = new Uint8Array(aBytes);
  const bufB = new Uint8Array(bBytes);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const requireAuth = c.env.REQUIRE_AUTH === 'true';

  if (!requireAuth) {
    return next();
  }

  const authToken = c.env.AUTH_TOKEN;
  if (!authToken) {
    console.error('[auth] REQUIRE_AUTH is true but AUTH_TOKEN is not configured');
    const errorResponse: ErrorResponse = {
      error: ErrorCode.UNAUTHORIZED,
      message: 'Authentication not configured',
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 500);
  }

  const providedToken =
    c.req.header('Authorization')?.replace('Bearer ', '');

  if (!providedToken || !timingSafeEqual(providedToken, authToken)) {
    const errorResponse: ErrorResponse = {
      error: ErrorCode.UNAUTHORIZED,
      message: 'Invalid or missing authentication token',
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 401);
  }

  return next();
}