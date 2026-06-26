import PostalMime from 'postal-mime';

export interface ParsedEmail {
  text: string;
  subject: string;
  html?: string;
}

const MAX_EMAIL_SIZE = 1024 * 1024; // 1MB
const MAX_TEXT_LENGTH = 50000;

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function parseEmail(message: ForwardableEmailMessage): Promise<ParsedEmail> {
  const rawStream = message.raw;

  const reader = rawStream.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.length;
    if (totalSize > MAX_EMAIL_SIZE) {
      console.warn('[parser] email exceeds max size, truncating');
      break;
    }
    chunks.push(value);
  }

  const limitedStream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  const email = await PostalMime.parse(limitedStream);

  let text = '';
  if (email.text) {
    text = email.text;
  } else if (email.html) {
    text = stripHtml(email.html);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  const subject = (email.subject || '').slice(0, 500);
  const combined = `SUBJECT: ${subject}\n\n${text}`;

  return {
    text: combined.slice(0, 2000),
    subject,
    html: email.html,
  };
}