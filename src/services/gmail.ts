import { EmailMessage, EmailHeader, AttachmentInfo } from '../types';

export const GUARDIAN_LABELS = {
  QUARANTINE: 'AI_GUARDIAN_QUARANTINE',
  PHISHING: 'AI_GUARDIAN_PHISHING',
  ADS: 'AI_GUARDIAN_ADS',
  IMPORTANT: 'AI_GUARDIAN_IMPORTANT',
  REVIEWED: 'AI_GUARDIAN_REVIEWED',
} as const;

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
}

// Decode Base64URL to utf-8 text safely
export function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return '';
  }
}

// Extract body text recursively from message parts
function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';

  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer text/plain, fallback to text/html
    const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plainPart && plainPart.body && plainPart.body.data) {
      return decodeBase64Url(plainPart.body.data);
    }

    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      const decodedHtml = decodeBase64Url(htmlPart.body.data);
      // Strip html tags for plain text heuristic
      return decodedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Nested multipart
    for (const part of payload.parts) {
      const body = extractBodyFromPayload(part);
      if (body) return body;
    }
  }

  return '';
}

// Extract attachments list from payload
function extractAttachmentsFromPayload(payload: any): AttachmentInfo[] {
  const attachments: AttachmentInfo[] = [];

  function walk(part: any) {
    if (!part) return;
    if (part.filename && part.filename.length > 0) {
      const fn = part.filename;
      const fnLower = fn.toLowerCase();
      const parts = fnLower.split('.');
      const hasDoubleExtension = parts.length > 2 && ['.exe', '.scr', '.bat', '.cmd', '.js', '.vbs', '.pif'].includes('.' + parts[parts.length - 1]);
      const isDangerous = ['.exe', '.scr', '.bat', '.cmd', '.js', '.vbs', '.pif', '.hta', '.jar'].some(ext => fnLower.endsWith(ext)) || hasDoubleExtension;
      const isSuspiciousArchive = ['.iso', '.img', '.vhd', '.rar', '.7z'].some(ext => fnLower.endsWith(ext));

      attachments.push({
        id: part.body?.attachmentId,
        filename: fn,
        mimeType: part.mimeType || 'application/octet-stream',
        sizeBytes: part.body?.size || 0,
        isDangerousExtension: isDangerous,
        isSuspiciousArchive,
        hasDoubleExtension,
        scanStatus: isDangerous ? 'zagrożenie' : isSuspiciousArchive ? 'niesprawdzony' : 'bezpieczny',
        notes: isDangerous ? 'Wykryto potencjalnie niebezpieczny typ pliku.' : undefined,
      });
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        walk(subPart);
      }
    }
  }

  walk(payload);
  return attachments;
}

export class GmailService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('TOKEN_EXPIRED: Sesja Google OAuth wygasła lub została cofnięta.');
      }
      if (res.status === 403) {
        throw new Error('PERMISSION_DENIED: Brak uprawnień do wykonania operacji w Gmail API.');
      }
      if (res.status === 429) {
        throw new Error('RATE_LIMITED: Przekroczono limit zapytań do Gmail API.');
      }
      const errorText = await res.text();
      throw new Error(`Gmail API error (${res.status}): ${errorText}`);
    }
    return res.json();
  }

  // List all user labels
  async listLabels(): Promise<GmailLabel[]> {
    const data = await this.fetchWithAuth('https://gmail.googleapis.com/gmail/v1/users/me/labels');
    return data.labels || [];
  }

  // Ensure all required AI Guardian labels exist in Gmail
  async ensureGuardianLabels(): Promise<Record<string, string>> {
    const existingLabels = await this.listLabels();
    const labelMap: Record<string, string> = {};

    for (const [key, labelName] of Object.entries(GUARDIAN_LABELS)) {
      const found = existingLabels.find(l => l.name === labelName);
      if (found) {
        labelMap[key] = found.id;
      } else {
        try {
          const created = await this.fetchWithAuth('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
            method: 'POST',
            body: JSON.stringify({
              name: labelName,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show',
            }),
          });
          labelMap[key] = created.id;
        } catch (err) {
          console.warn(`Could not create label ${labelName}, it might already exist or need permissions:`, err);
        }
      }
    }

    return labelMap;
  }

  // List messages with query filter (timeframe)
  async listMessages(options: { maxResults?: number; query?: string; pageToken?: string } = {}): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string }> {
    const params = new URLSearchParams();
    params.set('maxResults', String(options.maxResults || 30));
    if (options.query) params.set('q', options.query);
    if (options.pageToken) params.set('pageToken', options.pageToken);

    const data = await this.fetchWithAuth(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`);
    return {
      messages: data.messages || [],
      nextPageToken: data.nextPageToken,
    };
  }

  // Fetch full message
  async getMessage(id: string): Promise<EmailMessage> {
    const raw = await this.fetchWithAuth(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`);

    const headers: EmailHeader[] = (raw.payload?.headers || []).map((h: any) => ({
      name: h.name,
      value: h.value,
    }));

    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject') || '(Brak tematu)';
    const from = getHeader('From') || 'Nieznany nadawca';
    const to = getHeader('To') || '';
    const date = getHeader('Date') || new Date(parseInt(raw.internalDate, 10)).toISOString();
    const replyTo = getHeader('Reply-To');
    const returnPath = getHeader('Return-Path');

    const bodyText = extractBodyFromPayload(raw.payload);
    const attachments = extractAttachmentsFromPayload(raw.payload);

    const labelIds: string[] = raw.labelIds || [];
    const inQuarantine = labelIds.some(l => l.includes('QUARANTINE') || l.includes('AI_GUARDIAN_QUARANTINE'));

    return {
      id: raw.id,
      threadId: raw.threadId,
      snippet: raw.snippet || '',
      subject,
      from,
      to,
      date,
      timestamp: parseInt(raw.internalDate, 10) || Date.now(),
      labelIds,
      inQuarantine,
      bodySnippet: bodyText.slice(0, 400) || raw.snippet || '',
      fullBody: bodyText,
      rawHeaders: headers,
    };
  }

  // Move email to Quarantine (reversible: add AI_GUARDIAN_QUARANTINE, remove INBOX)
  async quarantineMessage(messageId: string, quarantineLabelId: string): Promise<void> {
    await this.fetchWithAuth(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: [quarantineLabelId],
        removeLabelIds: ['INBOX'],
      }),
    });
  }

  // Restore email from Quarantine to Inbox (reversible: add INBOX, remove AI_GUARDIAN_QUARANTINE)
  async restoreMessage(messageId: string, quarantineLabelId: string): Promise<void> {
    await this.fetchWithAuth(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: ['INBOX'],
        removeLabelIds: [quarantineLabelId],
      }),
    });
  }

  // Apply custom label (e.g. AI_GUARDIAN_ADS, AI_GUARDIAN_IMPORTANT)
  async applyLabel(messageId: string, labelId: string): Promise<void> {
    await this.fetchWithAuth(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: [labelId],
      }),
    });
  }

  // Create draft in Gmail
  async createDraft(params: { to: string; subject: string; body: string }): Promise<{ draftId: string }> {
    const { to, subject, body } = params;
    const emailContent = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    const raw = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await this.fetchWithAuth('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      body: JSON.stringify({ message: { raw } }),
    });
    return { draftId: res.id };
  }

  // Send email with conscious confirmation requirement (CZĘŚĆ 7 & 10)
  async sendMessage(params: { to: string; subject: string; body: string; userConfirmation: boolean }): Promise<{ id: string; threadId: string }> {
    if (!params.userConfirmation) {
      throw new Error('ODMOWA: Wysyłanie wiadomości wymaga świadomej i jednoznacznej zgody użytkownika.');
    }
    const { to, subject, body } = params;
    const emailContent = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    const raw = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return await this.fetchWithAuth('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw }),
    });
  }

  // STRICT GUARANTEE: Permanently deleting emails is strictly forbidden
  deleteMessage(): never {
    throw new Error('OPERACJA_ZABLOKOWANA_BRAK_UPRAWNIEN_DELETE: Trwałe usuwanie wiadomości jest bezwzględnie zablokowane w AlekSafeMail dla ochrony korespondencji.');
  }
}
