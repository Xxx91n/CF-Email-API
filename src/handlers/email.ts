import type { Env, EmailData } from '../types';
import { parseEmail } from '../services/parser';
import { extractVerificationCode } from '../services/extractor';
import { saveEmail } from '../services/storage';
import { parseTTLConfig } from '../utils/ttl';

export async function handleEmail(
  message: ForwardableEmailMessage,
  env: Env
): Promise<void> {
  const startTime = Date.now();

  const prefix = message.to.split('@')[0].toLowerCase();
  console.log(`[email] received for prefix: ${prefix}, from: ${message.from}`);

  try {
    const parsed = await parseEmail(message);

    const ttl = parseTTLConfig(env.DEFAULT_TTL, env.DEFAULT_TTL_UNIT);

    const enableAI = env.ENABLE_AI === 'true';
    const { code, codeType, confidence } = await extractVerificationCode(parsed.text, env, enableAI);

    const now = new Date();
    const emailData: EmailData = {
      from: message.from,
      to: message.to,
      subject: parsed.subject,
      text: parsed.text,
      html: parsed.html,
      code,
      codeType,
      codeConfidence: confidence,
      receivedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
    };

    await saveEmail(env.EMAIL_KV, prefix, emailData, ttl);

    const duration = Date.now() - startTime;
    console.log(`[email] saved prefix=${prefix} code=${code ?? 'null'} type=${codeType} conf=${confidence} ttl=${ttl}s duration=${duration}ms`);
  } catch (err) {
    console.error(`[email] error processing prefix=${prefix}:`, err);
  }
}
