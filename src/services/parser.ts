import PostalMime from 'postal-mime';

export interface ParsedEmail {
  text: string;
  subject: string;
  html?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function parseEmail(message: ForwardableEmailMessage): Promise<ParsedEmail> {
  const email = await PostalMime.parse(message.raw);

  let text = '';
  if (email.text) {
    text = email.text;
  } else if (email.html) {
    text = stripHtml(email.html);
  }

  const subject = email.subject || '';
  const combined = `SUBJECT: ${subject}\n\n${text}`;

  return {
    text: combined.slice(0, 2000),
    subject,
    html: email.html,
  };
}
