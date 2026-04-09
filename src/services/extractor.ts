import type { Env, CodeType } from '../types';

export interface ExtractionResult {
  code: string | null;
  codeType: CodeType;
  confidence: number | null;
}

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
  { name: 'en_launch_code', pattern: /launch\s*code[^\d]*([0-9]{6,8})/i, example: 'Your GitHub launch code: 49297498', capture: 1 },
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
  { name: 'url_code_numeric', pattern: /[?&\/](?:code|otp|token|verify|confirm|confirmation)=([0-9]{4,8})(?:[&\s]|$)/i, example: '?code=847291', capture: 1 },
  { name: 'url_code_alphanum', pattern: /[?&\/](?:code|otp|token|verify|confirm|confirmation)=([A-Za-z0-9]{4,8})(?:[&\s]|$)/i, example: '?code=ABC123', capture: 1 },
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

function extractAlphanumericCode(text: string): { code: string; confidence: number } | null {
  const RE = /\b([A-Z0-9]{6,10})\b/g;
  const candidates: Array<{ code: string; confidence: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    const candidate = m[1];
    const hasDigit = /[0-9]/.test(candidate);
    const hasLetter = /[A-Z]/.test(candidate);

    if (!hasDigit || !hasLetter) continue;

    const looksLikeUuidFragment = /^[0-9A-F]{8}$/.test(candidate);
    if (looksLikeUuidFragment) continue;

    const isPureHex = /^[0-9A-F]+$/.test(candidate) && !/[G-Z]/.test(candidate);
    if (isPureHex) continue;

    const nearContext = text.slice(Math.max(0, m.index - 40), m.index + candidate.length + 40);
    const hasContext = /code|token|otp|verify|驗證|验证|認証|guard/i.test(nearContext);
    const confidence = hasContext ? 0.92 : 0.70;

    candidates.push({ code: candidate, confidence });
  }

  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => b.confidence - a.confidence)[0];
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
): Promise<ExtractionResult> {
  const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
  text = text.replace(UUID_PATTERN, '');

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
    if (best) {
      const bestMatch = matches.find(m => m.code === best)!;
      const isUrlParam = bestMatch.patternName.startsWith('url_');
      const isAlphaNum = /[A-Za-z]/.test(best);
      const codeType: CodeType = isUrlParam ? 'url_param' : isAlphaNum ? 'alphanumeric' : 'numeric';
      const confidence = isUrlParam ? 0.65 : 0.95;

      return { code: best, codeType, confidence };
    }
  }

  const fallback = text.match(FALLBACK_PATTERN);
  if (fallback) {
    const code = fallback[1];
    if (!/^20[2-3][0-9]$/.test(code)) {
      return { code, codeType: 'numeric', confidence: 0.75 };
    }
  }

  const alphaResult = extractAlphanumericCode(text.toUpperCase());
  if (alphaResult) {
    return { code: alphaResult.code, codeType: 'alphanumeric', confidence: alphaResult.confidence };
  }

  if (enableAI && env.AI) {
    const aiCode = await extractWithAI(text, env);
    if (aiCode) {
      const isAlphaNum = /[A-Za-z]/.test(aiCode);
      return {
        code: aiCode,
        codeType: isAlphaNum ? 'alphanumeric' : 'numeric',
        confidence: 0.60,
      };
    }
  }

  return { code: null, codeType: null, confidence: null };
}
