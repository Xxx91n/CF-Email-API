import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Env } from '../types';
import { ErrorCode } from '../types';
import { authMiddleware } from '../middleware/auth';
import { getEmail, getCode } from '../services/storage';
import { validatePrefix } from '../utils/prefix';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', secureHeaders());
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
}));
app.use('/*', authMiddleware);

app.get('/', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }));


app.get('/:prefix/email', async (c) => {
  const prefix = c.req.param('prefix').toLowerCase();

  if (!prefix || !validatePrefix(prefix)) {
    return c.json({ error: ErrorCode.INVALID_PREFIX, message: 'Invalid prefix' }, 400);
  }

  const emailData = await getEmail(c.env.EMAIL_KV, prefix);
  if (!emailData) {
    return c.json({ error: ErrorCode.NO_EMAIL_FOUND, message: 'No email found' }, 404);
  }

  return c.json(emailData);
});

app.get('/:prefix/code', async (c) => {
  const prefix = c.req.param('prefix').toLowerCase();

  if (!prefix || !validatePrefix(prefix)) {
    return c.json({ error: ErrorCode.INVALID_PREFIX, message: 'Invalid prefix' }, 400);
  }

  const code = await getCode(c.env.EMAIL_KV, prefix);
  if (!code) {
    return c.json({ error: ErrorCode.NO_CODE_FOUND, message: 'No code found' }, 404);
  }

  return c.text(code);
});

export { app as httpHandler };