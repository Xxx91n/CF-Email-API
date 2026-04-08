import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, ErrorResponse } from '../types';
import { ErrorCode } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getEmail, getCode } from '../services/storage';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());
app.use('/*', authMiddleware);

app.get('/', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }));

app.get('/:prefix/email', async (c) => {
  const prefix = c.req.param('prefix').toLowerCase();

  if (!prefix || !/^[a-z0-9._+-]+$/.test(prefix)) {
    const err: ErrorResponse = {
      error: ErrorCode.INVALID_PREFIX,
      prefix,
      message: 'Invalid email prefix format',
      timestamp: new Date().toISOString(),
    };
    return c.json(err, 400);
  }

  const emailData = await getEmail(c.env.EMAIL_KV, prefix);
  if (!emailData) {
    const err: ErrorResponse = {
      error: ErrorCode.NO_EMAIL_FOUND,
      prefix,
      message: `No email found for prefix: ${prefix}`,
      timestamp: new Date().toISOString(),
    };
    return c.json(err, 404);
  }

  return c.json(emailData);
});

app.get('/:prefix/code', async (c) => {
  const prefix = c.req.param('prefix').toLowerCase();

  if (!prefix || !/^[a-z0-9._+-]+$/.test(prefix)) {
    const err: ErrorResponse = {
      error: ErrorCode.INVALID_PREFIX,
      prefix,
      message: 'Invalid email prefix format',
      timestamp: new Date().toISOString(),
    };
    return c.json(err, 400);
  }

  const code = await getCode(c.env.EMAIL_KV, prefix);
  if (!code) {
    const err: ErrorResponse = {
      error: ErrorCode.NO_CODE_FOUND,
      prefix,
      message: `No verification code found for prefix: ${prefix}`,
      timestamp: new Date().toISOString(),
    };
    return c.json(err, 404);
  }

  return c.text(code);
});

export { app as httpHandler };
