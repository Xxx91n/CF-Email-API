import type { Env } from '../types';

interface RegexPattern {
  name: string;
  pattern: RegExp;
  example: string;
  capture: number;
}

const PATTERNS: RegexPattern[] = [
  { name: 'en_verification_code', pattern: /verification\s*code[:\s\-]+([0-9]{4,8})/i, example: 'Verification code: 123456', capture: 1 },
  { name: 'en_your_code', pattern: /your\s+(?:one[- ]time\s+)?code\s+(?:is\s+)?[:\s\-]*([0-9]{4,8})/i, example: 'Your code is 123456', capture: 1 },
  { name: 'en_enter_code', pattern: /(?:enter|use|input)\s+(?:the\s+)?(?:following\s+)?code[:\s\-]+([0-9]{4,8})/i, example: 'Please enter code: 847291', capture: 1 },
  { name: 'en_otp', pattern: /\bOTP[:\s\-]+([0-9]{4,8})/i, example: 'OTP: 123456', capture: 1 },
  { name: 'en_passcode', pattern: /(?:pass\s*code|security\s*code|access\s*code)[:\s\-]+([0-9]{4,8})/i, example: 'Security code: 123456', capture: 1 },
  { name: 'en_is_digit', pattern: /(?:code|token)\s+is[:\s]+([0-9]{4,8})\b/i, example: 'Your token is 847291', capture: 1 },
  { name: 'zh_verification_code', pattern: /验证码[为是：:\s]*([0-9]{4,8})/, example: '验证码：123456', capture: 1 },
  { name: 'zh_otp', pattern: /一次性(?:密码|验证码|口令)[为是：:\s]*([0-9]{4,8})/, example: '一次性密码：123456', capture: 1 },
  { name: 'zh_dynamic_code', pattern: /动态(?:密码|验证码)[为是：:\s]*([0-9]{4,8})/, example: '动态验证码：847291', capture: 1 },
  { name: 'ja_verification', pattern: /認証コード[：:\s]*([0-9]{4,8})/, example: '認証コード：123456', capture: 1 },
  { name: 'ko_verification', pattern: /인증(?:\s*번호|\s*코드)[：:\s]*([0-9]{4,8})/, example: '인증번호: 123456', capture: 1 },
  { name: 'spaced_6digit', pattern: /\b([0-9](?:\s[0-9]){5})\b|([0-9]{2}(?:\s[0-9]{2}){2})\b/, example: '1 2 3 4 5 6', capture: 1 },
  { name: 'hyphen_6digit', pattern: /\b([0-9]{3})-([0-9]{3})\b/, example: '123-456', capture: 0 },
];

const FALLBACK_PATTERN = /\b([0-9]{6})\b/;
const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

interface Match {
  code: string;
  patternName: string;
  index: number;
}

function selectBestMatch(matches: Match[]): string | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].code;

  const contextualMatches = matches.filter(
    m => !m.patternName.startsWith('fallback')
  );
  if (contextualMatches.length === 1) return contextualMatches[0].code;

  if (contextualMatches.length > 1) {
    return contextualMatches.sort((a, b) => a.index - b.index)[0].code;
  }

  const uniqueCodes = [...new Set(matches.map(m => m.code))];
  if (uniqueCodes.length === 1) return uniqueCodes[0];

  return null;
}

async function extractWithAI(text: string, env: Env): Promise<string | null> {
  const truncated = text.slice(0, 500);

  const messages = [
    {
      role: 'system' as const,
      content: 'You are a verification code extractor. Extract ONLY the verification/OTP/confirmation code (4-8 digit number) from the email. Reply with ONLY the digits, nothing else. If no code found, reply with exactly: NONE',
    },
    {
      role: 'user' as const,
      content: truncated,
    },
  ];

  try {
    const response = await env.AI.run(AI_MODEL, {
      messages,
      max_tokens: 16,
      temperature: 0,
    }) as { response: string };

    const output = response?.response?.trim();
    if (!output || output === 'NONE') return null;

    const cleaned = output.replace(/\D/g, '');
    if (cleaned.length >= 4 && cleaned.length <= 8) return cleaned;
    return null;
  } catch (e) {
    console.error('[AI extraction failed]', e);
    return null;
  }
}

export async function extractVerificationCode(
  text: string,
  env: Env,
  enableAI: boolean = true
): Promise<string | null> {
  const matches: Match[] = [];

  for (const p of PATTERNS) {
    const regex = new RegExp(p.pattern.source, p.pattern.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      let code: string;
      if (p.name === 'hyphen_6digit') {
        code = (m[1] ?? '') + (m[2] ?? '');
      } else if (p.name === 'spaced_6digit') {
        code = (m[1] ?? m[2] ?? '').replace(/\s/g, '');
      } else {
        code = m[p.capture];
      }
      if (code && code.length >= 4) {
        matches.push({ code, patternName: p.name, index: m.index });
      }
    }
  }

  if (matches.length > 0) {
    const best = selectBestMatch(matches);
    if (best) return best;
  }

  const fallback = text.match(FALLBACK_PATTERN);
  if (fallback) {
    const code = fallback[1];
    if (!/^20[2-3][0-9]$/.test(code)) {
      return code;
    }
  }

  if (enableAI && env.AI) {
    return await extractWithAI(text, env);
  }

  return null;
}
