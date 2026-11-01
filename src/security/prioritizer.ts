import { PriorityAssessment, PriorityLevel, ClassificationCategory, DeadlineItem, TaskItem } from '../types';

export function evaluateEmailPriority(email: {
  id: string;
  subject: string;
  from: string;
  bodySnippet: string;
  fullBody?: string;
  category?: ClassificationCategory;
  overallRisk?: number;
}): PriorityAssessment {
  const content = `${email.subject}\n${email.fullBody || ''}\n${email.bodySnippet || ''}`.toLowerCase();
  const fromLower = email.from.toLowerCase();
  const subjectLower = email.subject.toLowerCase();

  let level: PriorityLevel = 'P3';
  let urgency = 20;
  let importance = 30;
  let requiresReply = false;
  let requiresAction = false;
  let reason = 'Standardowa korespondencja bieżąca.';
  let suggestedReplyDeadline: string | undefined;
  let consequences: string | undefined;

  // SAFETY FILTER: Cyberthreats / Phishing in quarantine should never be P0
  if (email.category === 'PHISHING' || (email.overallRisk !== undefined && email.overallRisk >= 70)) {
    level = 'P4';
    urgency = 5;
    importance = 5;
    requiresAction = false;
    requiresReply = false;
    reason = 'Wykryto zagrożenie cyberbezpieczeństwa lub phishing – wiadomość w kwarantannie, brak działań operacyjnych.';
    return {
      level,
      urgency,
      importance,
      requiresReply,
      requiresAction,
      reason,
    };
  }

  // Detection flags
  const isCourtOrJudicial = /(sąd|wyrok|rozpraw|wezwanie|postanowienie|sygn\. akt|prokuratur|komornik|egzekucj)/i.test(content);
  const isGov = /(urząd skarbowy|ministerstwo|epuap|zus|podatki\.gov\.pl|decyzja administracyjna)/i.test(content) || fromLower.includes('.gov.pl');
  const isBankSecurity = /(blokada konta|nieautoryzowany dostęp|podejrzana transakcja|zablokowane)/i.test(content) && /(ipko|pko|mbank|santander|ing|pekao|bank)/i.test(content);
  const hasImminentDeadline = /(w ciągu 24h|do jutra|do końca dnia|dzisiaj|asap|natychmiast|pilne|termin:? \d{1,2}|stawiennictw)/i.test(content);
  const isEcommercePromo = /(rabat|wyprzedaż|okazja|kod rabatowy|kupon|% zniżki|promocj|oferta specjalna)/i.test(subjectLower);
  const isEcommerceOrder = /(twoje zamówienie|zamówienie nr|order confirmation|potwierdzenie zamówienia|paczkomat|przesyłka|dostawa)/i.test(content);
  const isDirectQuestion = /\?|proszę o (odpowiedź|przesłanie|potwierdzenie|informację)|daj znać|czekam na/i.test(content);

  // P0 - KRYTYCZNE (Sprawy sądowe, oficjalne pisma, realne incydenty bankowe)
  if (isCourtOrJudicial && (hasImminentDeadline || content.includes('stawiennictw') || content.includes('świadk') || content.includes('rozpraw'))) {
    level = 'P0';
    urgency = 95;
    importance = 100;
    requiresAction = true;
    requiresReply = true;
    reason = 'P0: Oficjalne pismo sądowe/organu ścigania ze statutowym terminem lub obowiązkiem stawiennictwa.';
    consequences = 'Możliwość nałożenia kary grzywny, przymusowego doprowadzenia lub negatywnych skutków procesowych.';
    suggestedReplyDeadline = 'Niezwłocznie (w ciągu 24-48h)';
  } else if (isBankSecurity) {
    level = 'P0';
    urgency = 98;
    importance = 95;
    requiresAction = true;
    reason = 'P0: Incydent bezpieczeństwa bankowego lub informacja o blokadzie środków.';
    consequences = 'Ryzyko utraty dostępu do bankowości lub kradzieży środków w przypadku zaniechania.';
    suggestedReplyDeadline = 'Pilnie';
  }
  // P1 - PILNE (Sprawy z terminem na dziś/jutro, pilne pytania od klientów/partnerów)
  else if (hasImminentDeadline || isGov || isCourtOrJudicial) {
    level = 'P1';
    urgency = 80;
    importance = 85;
    requiresAction = true;
    requiresReply = isDirectQuestion || isGov || hasImminentDeadline;
    reason = 'P1: Sprawa pilna z natychmiastowym terminem realizacji lub pismo z instytucji publicznej.';
    consequences = 'Konsekwencje administracyjne lub opóźnienie w realizacji kluczowej sprawy.';
    suggestedReplyDeadline = 'Do 24h / w ciągu 1-2 dni';
  }
  // P4 - NISKIE
  else if (isEcommercePromo || email.category === 'REKLAMY' || email.category === 'NEWSLETTERY' || email.category === 'SPAM') {
    level = 'P4';
    urgency = 5;
    importance = 10;
    requiresAction = false;
    requiresReply = false;
    reason = 'Biuletyn, oferta marketingowa lub korespondencja masowa niewymagająca działania.';
  }
  // P2 - WAŻNE
  else if (isDirectQuestion || /(notatki|projekt|spotkanie|faktura|rozliczenie|umowa)/i.test(content)) {
    level = 'P2';
    urgency = 50;
    importance = 70;
    requiresAction = true;
    requiresReply = isDirectQuestion;
    reason = 'Korespondencja projektowa, biznesowa lub zapytanie bezpośrednie wymagające odniesienia się.';
    consequences = 'Opóźnienie w projekcie lub oczekiwanie partnera na decyzję.';
    suggestedReplyDeadline = 'W ciągu 3-5 dni';
  }
  // P3 - NORMALNE
  else if (isEcommerceOrder || email.category === 'ZAKUPY' || email.category === 'DOSTAWY') {
    level = 'P3';
    urgency = 25;
    importance = 40;
    requiresAction = false;
    requiresReply = false;
    reason = 'Potwierdzenie transakcji, status zamówienia lub doręczenia paczki.';
  } else {
    level = 'P3';
    urgency = 20;
    importance = 30;
    requiresAction = false;
    requiresReply = false;
    reason = 'Standardowa korespondencja osobista / informacyjna.';
  }

  return {
    level,
    urgency,
    importance,
    reason,
    requiresReply,
    requiresAction,
    suggestedReplyDeadline,
    consequences,
  };
}

export function extractDeadlinesFromEmail(email: {
  id: string;
  subject: string;
  from: string;
  bodySnippet: string;
  fullBody?: string;
}): DeadlineItem[] {
  const content = `${email.subject}\n${email.fullBody || email.bodySnippet || ''}`;
  const deadlines: DeadlineItem[] = [];

  // Regex patterns for polish dates (e.g., 15 listopada 2026, 15.11.2026, do 15 listopada, godz. 10:30)
  const monthNames = 'stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia';
  const verbalDateRegex = new RegExp(`(\\d{1,2})\\s+(${monthNames})\\s*(\\d{4})?`, 'i');
  const numericDateRegex = /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/;
  const timeRegex = /(godz(?:in[aę])?\.?|o godz\.?)\s*(\d{1,2}[:.]\d{2})/i;

  const verbalMatch = content.match(verbalDateRegex);
  const numericMatch = content.match(numericDateRegex);
  const timeMatch = content.match(timeRegex);

  const isLegal = /(sąd|rozpraw|wezwanie|termin procesowy|komornik|egzekucj|decyzj)/i.test(content);

  if (verbalMatch || numericMatch) {
    const timeStr = timeMatch ? timeMatch[2].replace('.', ':') : undefined;
    let dateStr = '';

    if (verbalMatch) {
      dateStr = `${verbalMatch[1]} ${verbalMatch[2]} ${verbalMatch[3] || '2026'}`;
    } else if (numericMatch) {
      dateStr = `${numericMatch[1]}.${numericMatch[2]}.${numericMatch[3]}`;
    }

    // Sentence fragment context
    const idx = verbalMatch ? verbalMatch.index || 0 : numericMatch ? numericMatch.index || 0 : 0;
    const start = Math.max(0, idx - 40);
    const end = Math.min(content.length, idx + 80);
    const fragment = content.slice(start, end).replace(/\n/g, ' ').trim();

    deadlines.push({
      id: `dl-${email.id}`,
      messageId: email.id,
      date: dateStr,
      time: timeStr,
      title: isLegal ? `Rozprawa / posiedzenie: ${email.subject}` : `Termin: ${email.subject}`,
      sourceSender: email.from,
      sourceSubject: email.subject,
      justificationFragment: fragment,
      isLegalOrCourt: isLegal,
      confidence: isLegal ? 95 : 85,
      confirmed: false,
      reminderDays: [7, 3, 1, 0],
    });
  }

  return deadlines;
}

export function extractTasksFromEmail(email: {
  id: string;
  subject: string;
  from: string;
  bodySnippet: string;
  fullBody?: string;
  priority?: PriorityLevel;
}): TaskItem[] {
  const content = `${email.subject}\n${email.fullBody || email.bodySnippet || ''}`;
  const tasks: TaskItem[] = [];

  const requiresAction = /(proszę o|stawiennictwo|wezwanie|należy|wymagane|odebrać|zapłacić|uregulować|podpisać|przesłać|zaktualizować)/i.test(content);

  if (requiresAction) {
    let taskTitle = `Zajmij się: ${email.subject}`;
    let desc = 'Wiadomość zawiera polecenie lub prośbę o podjęcie działania.';

    if (content.includes('stawiennictwo')) {
      taskTitle = `Stawiennictwo w sądzie: ${email.subject}`;
      desc = 'Wymagane osobiste stawiennictwo w charakterze świadka lub strony.';
    } else if (content.includes('przesłać') || content.includes('notatki')) {
      taskTitle = `Przesłanie materiałów / odpowiedzi do ${email.from.split('<')[0].trim()}`;
      desc = 'Nadawca prosi o przesłanie notatek lub podsumowania.';
    } else if (content.includes('zapłacić') || content.includes('faktura')) {
      taskTitle = `Weryfikacja płatności faktury: ${email.subject}`;
      desc = 'Sprawdź zasadność wezwania do zapłaty i termin płatności.';
    }

    tasks.push({
      id: `task-${email.id}`,
      messageId: email.id,
      title: taskTitle,
      description: desc,
      priority: email.priority || 'P2',
      status: 'TODO',
      sourceSender: email.from,
      sourceSubject: email.subject,
      createdAt: new Date().toISOString(),
    });
  }

  return tasks;
}
