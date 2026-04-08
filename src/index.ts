import type { Env } from './types';
import { httpHandler } from './handlers/http';
import { handleEmail } from './handlers/email';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return httpHandler.fetch(request, env, ctx);
  },

  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleEmail(message, env));
  },
} satisfies ExportedHandler<Env>;

export type { Env };
