import type { Context, Next } from 'hono';
import type { Env, ErrorResponse } from '../types';
import { ErrorCode } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const requireAuth = c.env.REQUIRE_AUTH === 'true';

  if (!requireAuth) {
    return next();
  }

  const authToken = c.env.AUTH_TOKEN;
  if (!authToken) {
    return next();
  }

  const providedToken =
    c.req.query('token') ||
    c.req.header('Authorization')?.replace('Bearer ', '');

  if (!providedToken || providedToken !== authToken) {
    const errorResponse: ErrorResponse = {
      error: ErrorCode.UNAUTHORIZED,
      message: 'Invalid or missing authentication token',
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 401);
  }

  return next();
}
