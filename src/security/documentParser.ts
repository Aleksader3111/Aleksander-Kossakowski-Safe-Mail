import { DocumentExtraction } from '../types';

export function parseDocumentFromEmail(email: {
  id: string;
  subject: string;
  from: string;
  bodySnippet: string;
  fullBody?: string;
  attachments?: { filename: string; mimeType: string }[];
}): DocumentExtraction | null {
  const text = `${email.subject}\n${email.fullBody || email.bodySnippet || ''}`;
  const subject = email.subject.toLowerCase();
  const textLower = text.toLowerCase();

  // Detect type
  const isInvoice = /(faktura|faktura vat|rachunek|invoice|wezwanie do zapłaty)/i.test(textLower);
  const isOrder = /(zamówienie nr|potwierdzenie zamówienia|order #|koszyk|zakup)/i.test(textLower);
  const isCourt = /(sąd rejonowy|sygn\. akt|wydział karny|wyrok|nakaz zapłaty|komornik)/i.test(textLower);
  const isPayment = /(potwierdzenie wykonania przelewu|zestawienie operacji|wyciąg bankowy|przelew)/i.test(textLower);

  if (!isInvoice && !isOrder && !isCourt && !isPayment) {
    return null;
  }

  let type: DocumentExtraction['type'] = 'INNE';
  if (isInvoice) type = 'FAKTURA';
  else if (isOrder) type = 'ZAMÓWIENIE';
  else if (isCourt) type = 'SĄDOWY';
  else if (isPayment) type = 'PŁATNOŚĆ';

  // Extract document number
  // e.g. FV/2026/10/89, #PO-9418294, II K 142/26, 492/2026
  let docNumber: string | undefined;
  const numMatch =
    text.match(/(?:sygn\.?\s*akt:?|nr|numer|faktura(?: vat)?)\s*[:#]?\s*([A-Za-z0-9/\-_#]+(?:\s+[A-Za-z0-9/\-_#]+)*)/i) ||
    text.match(/(#[A-Z0-9\-_]+)/i);
  if (numMatch && numMatch[1]) {
    docNumber = numMatch[1].trim().slice(0, 35);
  }

  // Extract amount
  // e.g. 1 840,00 PLN, 89,40 PLN, 2 400 PLN, 150,00 PLN
  let amount: string | undefined;
  const amountMatch = text.match(/(\d{1,3}(?:[\s\xa0]\d{3})*(?:[.,]\d{2})?)\s*(?:zł|pln|eur|usd)/i);
  if (amountMatch) {
    amount = `${amountMatch[1]} PLN`;
  }

  // Extract issuer
  const issuer = email.from.split('<')[0].trim().replace(/^"|"$/g, '');

  // Extract due date
  let dueDate: string | undefined;
  const dueMatch = text.match(/(?:termin płatności|termin stawiennictwa|do dnia|posiedzenie w dniu)\s*[:]?\s*(\d{1,2}(?:\s+[a-ząćęłńóśźż]+|\.\d{2}\.\d{4}))/i);
  if (dueMatch) {
    dueDate = dueMatch[1].trim();
  }

  return {
    id: `doc-${email.id}`,
    messageId: email.id,
    type,
    docNumber: docNumber || 'Brak formalnego numeru',
    issuer,
    issueDate: new Date().toLocaleDateString('pl-PL'),
    amount,
    dueDate,
    confidence: docNumber ? 90 : 75,
    notes: `Rozpoznano dokument typu ${type}. Dane wyodrębniono heurystycznie z treści korespondencji.`,
  };
}
