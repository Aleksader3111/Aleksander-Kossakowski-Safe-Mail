import { ClassificationCategory, EmailMessage, SecurityReport, LinkAnalysis, AttachmentInfo } from '../types';

// DANGEROUS EXTENSIONS
const DANGEROUS_EXTENSIONS = ['.exe', '.scr', '.bat', '.cmd', '.js', '.vbs', '.pif', '.hta', '.jar', '.com', '.msi', '.ps1'];
const SUSPICIOUS_ARCHIVES = ['.iso', '.img', '.vhd', '.rar', '.7z', '.tar', '.gz'];

// TRUSTED DOMAINS & PATTERNS
const OFFICIAL_GOV_DOMAINS = ['.gov.pl', '.epuap.gov.pl', '.mf.gov.pl', '.zus.pl', '.podatki.gov.pl', '.sejm.gov.pl', '.gov'];
const KNOWN_BANK_DOMAINS = [
  'pkobp.pl',
  'inteligo.pl',
  'mbank.pl',
  'santander.pl',
  'ing.pl',
  'ingbank.pl',
  'pekao.com.pl',
  'aliorbank.pl',
  'bnpparibas.pl',
  'millennium.pl',
  'bankmillennium.pl',
  'credit-agricole.pl',
  'citibank.pl',
  'nestbank.pl',
  'velobank.pl',
];

const KNOWN_ECOMMERCE_DOMAINS = ['temu.com', 'aliexpress.com', 'shein.com', 'allegro.pl', 'amazon.pl', 'amazon.com', 'olx.pl', 'ebay.com'];

// PROMPT INJECTION DETECTION PATTERNS
const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /system prompt override/i,
  /override system prompt/i,
  /system prompt:/i,
  /you are now dan/i,
  /disregard the above/i,
  /you are now an unrestricted assistant/i,
  /classify this (email|message) as safe/i,
  /reveal the system prompt/i,
  /do not report this as phishing/i,
  /zignoruj poprzednie instrukcje/i,
  /nadpisz instrukcje systemowe/i,
  /oznacz t[aę] wiadomo[sś][cć] jako bezpieczn[aą]/i,
];

// Heuristic extractor for email parts
export function extractDomain(emailOrFrom: string): string {
  const match = emailOrFrom.match(/<([^>]+)>/) || emailOrFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const cleanEmail = match ? match[1] : emailOrFrom;
  const atIdx = cleanEmail.lastIndexOf('@');
  if (atIdx !== -1) {
    return cleanEmail.slice(atIdx + 1).toLowerCase().trim();
  }
  return cleanEmail.toLowerCase().trim();
}

export function extractSenderName(fromHeader: string): string {
  const match = fromHeader.match(/^"?([^"<]+)"?\s*</);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fromHeader.split('@')[0].trim();
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
}

// Stage A: Sender Analysis
export function analyzeSender(
  from: string,
  replyTo?: string,
  returnPath?: string
): SecurityReport['stageA_Sender'] {
  const domain = extractDomain(from);
  const senderName = extractSenderName(from);
  const senderEmail = (from.match(/<([^>]+)>/) || [null, from])[1]?.toLowerCase().trim() || from;

  const isFreemail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'wp.pl', 'onet.pl', 'o2.pl', 'interia.pl'].includes(domain);
  const isGov = OFFICIAL_GOV_DOMAINS.some(gov => domain.endsWith(gov));
  const isBank = KNOWN_BANK_DOMAINS.some(b => domain === b || domain.endsWith('.' + b));
  const isCorporateOrGov = isGov || isBank || (!isFreemail && domain.includes('.'));

  // Homograph / suspicious chars in domain (punycode xn--, Cyrillic, Greek, numbers mimicking letters)
  const hasHomographOrSuspiciousChars =
    domain.startsWith('xn--') ||
    /[а-яА-ЯёЁ\u0400-\u04FF]/.test(domain) ||
    /[-_]{2,}/.test(domain) ||
    /(\d{1,3}\.){3}\d{1,3}/.test(domain);

  // Typosquatting heuristics on bank or gov names in domain
  let hasTyposquatting = false;
  if (!isBank && !isGov) {
    const BANK_KEYWORDS = ['pko', 'ipko', 'mbank', 'santander', 'pekao', 'millennium', 'alior', 'ingbank', 'velobank'];
    for (const kw of BANK_KEYWORDS) {
      if (domain.includes(kw)) {
        hasTyposquatting = true;
        break;
      }
    }
    for (const bank of KNOWN_BANK_DOMAINS) {
      const bankBase = bank.split('.')[0];
      if (domain.includes(bankBase) && !domain.endsWith('.' + bank)) {
        hasTyposquatting = true;
        break;
      }
    }
    if (domain.includes('gov') && !isGov) {
      hasTyposquatting = true;
    }
  }

  let reputation = 80;
  if (isGov) reputation = 98;
  else if (isBank) reputation = 95;
  else if (hasTyposquatting || hasHomographOrSuspiciousChars) reputation = 5;
  else if (isFreemail) reputation = 60;

  const notesParts: string[] = [];
  if (isGov) notesParts.push('Oficjalna domena administracji publicznej.');
  if (isBank) notesParts.push('Rozpoznana oficjalna domena sektora bankowego.');
  if (hasTyposquatting) notesParts.push('UWAGA: Domena przypomina nazwę zaufanej instytucji (typosquatting).');
  if (hasHomographOrSuspiciousChars) notesParts.push('Wykryto nietypowe znaki lub format punycode w domenie.');
  if (replyTo && extractDomain(replyTo) !== domain) {
    notesParts.push(`Rozbieżność Reply-To (${extractDomain(replyTo)}) z nadawcą (${domain}).`);
  }

  return {
    senderEmail,
    senderName,
    domain,
    replyTo,
    returnPath,
    isCorporateOrGov,
    isFreemail,
    hasHomographOrSuspiciousChars: hasHomographOrSuspiciousChars || hasTyposquatting,
    domainReputationScore: reputation,
    notes: notesParts.join(' ') || 'Standardowa reputacja nadawcy.',
  };
}

// Stage B: Headers Analysis (SPF, DKIM, DMARC)
export function analyzeHeaders(
  headers: { name: string; value: string }[],
  fromDomain: string,
  replyTo?: string
): SecurityReport['stageB_Headers'] {
  let spf: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE' = 'NONE';
  let dkim: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE' = 'NONE';
  let dmarc: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE' = 'NONE';
  let authResults = '';
  let receivedHops = 0;

  for (const h of headers) {
    const name = h.name.toLowerCase();
    const val = h.value.toLowerCase();

    if (name === 'received') {
      receivedHops++;
    } else if (name === 'authentication-results') {
      authResults = h.value;
      if (val.includes('spf=pass')) spf = 'PASS';
      else if (val.includes('spf=fail') || val.includes('spf=softfail')) spf = 'FAIL';
      else if (val.includes('spf=neutral')) spf = 'NEUTRAL';

      if (val.includes('dkim=pass')) dkim = 'PASS';
      else if (val.includes('dkim=fail')) dkim = 'FAIL';

      if (val.includes('dmarc=pass')) dmarc = 'PASS';
      else if (val.includes('dmarc=fail')) dmarc = 'FAIL';
    } else if (name === 'received-spf') {
      if (val.startsWith('pass')) spf = 'PASS';
      else if (val.startsWith('fail') || val.startsWith('softfail')) spf = 'FAIL';
      else if (val.startsWith('neutral')) spf = 'NEUTRAL';
    } else if (name === 'dkim-signature') {
      if (dkim === 'NONE') dkim = 'PASS';
    }
  }

  const replyToMismatch = replyTo ? extractDomain(replyTo) !== fromDomain : false;

  const notesParts: string[] = [];
  if (spf === 'PASS' && dkim === 'PASS') notesParts.push('Pozytywna weryfikacja kryptograficzna SPF i DKIM.');
  if (spf === 'FAIL') notesParts.push('Błąd SPF – serwer wysyłający nie ma autoryzacji do wysyłania w imieniu tej domeny.');
  if (dkim === 'FAIL') notesParts.push('Błąd DKIM – podpis kryptograficzny wiadomości jest nieprawidłowy.');
  if (dmarc === 'FAIL') notesParts.push('Niezgodność z polityką DMARC.');
  if (replyToMismatch) notesParts.push('Pole Reply-To kieruje odpowiedź do innej domeny niż nadawca.');

  return {
    spf,
    dkim,
    dmarc,
    authenticationResults: authResults,
    receivedHops,
    replyToMismatch,
    notes: notesParts.join(' ') || 'Nagłówki uwierzytelniające w normie.',
  };
}

// Stage C: Content Analysis
export function analyzeContent(
  subject: string,
  body: string
): SecurityReport['stageC_Content'] {
  const combined = `${subject}\n${body}`.toLowerCase();

  // Prompt injection check
  let promptInjectionDetected = false;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(subject) || pattern.test(body)) {
      promptInjectionDetected = true;
      break;
    }
  }

  // Phishing heuristics
  const credentialPhishingDetected =
    /(has[łl]o|has[łl]a|zaloguj|weryfikacj[aę]|odblokuj konto|potwierd[zź] to[zż]samo[sś][cć]|login|password|verify your account|auth)/i.test(combined) &&
    /(kliknij|link|tutaj|poni[zż]ej|zaktualizuj|formularz)/i.test(combined);

  const smsCodeScamDetected =
    /(kod sms|kod weryfikacyjny|podaj kod|przepi[sś] kod|autoryzuj transakcj[eę]|blik)/i.test(combined) &&
    /(piln[ye]|natychmiast|potwierdzenie|zabezpieczenie|pro[sś]ba|kasa|telefon|500|1000)/i.test(combined);

  const bankImpersonation =
    /(ipko|pko bp|mbank|santander|pekao|ing bank|millennium|alior|konta bankowego|dostęp do bankowości|blokada rachunku)/i.test(combined) &&
    /(zablokowan[ye]|zawieszon[ye]|nieautoryzowany dost[eę]p|weryfikuj|zaloguj|dostęp|alert)/i.test(combined);

  const govImpersonation =
    /(urz[aą]d skarbowy|ministerstwo finans[oó]w|policja|prokuratura|s[aą]d rejonowy|komornik|mandat karny|egzekucja komornicza|zus|wezwanie do s[aą]du)/i.test(combined) &&
    /(wezwanie|p[łl]atno[sś][cć]|zaleg[łl]o[sś][cć]|zad[łl]u[zż]enie|kara|post[eę]powanie|podatku vat|vat)/i.test(combined);

  const fakeInvoiceOrPaymentDemand =
    /(faktura|faktura vat|rachunek|zaleg[łl]a p[łl]atno[sś][cć]|ostateczne wezwanie|nieop[łl]acona faktura|invoice|wezwanie do zap[łl]aty)/i.test(combined) &&
    /(za[łl][aą]cznik|pobierz|pdf\.exe|zap[łl]a[cć] teraz|op[łl]a[cć]|przelej|wp[łl]a[cć]|komornik|rachunek:)/i.test(combined);

  const fakeDeliveryNotification =
    /(paczka|przesy[łl]ka|kurier|dhl|dpd|inpost|poczta polska|fedex|gls|zatrzymana w magazynie|dop[łl]a[cć] do paczki|b[łl][aą]dny adres|niedop[łl]at)/i.test(combined) &&
    /(dop[łl]ata|link|op[łl]ata celna|kliknij|niedop[łl]at|ureguluj)/i.test(combined);

  const urgencyOrThreats =
    /(pilne|natychmiast|w ci[aą]gu 24h|w ci[aą]gu 48h|grozi|zostanie zablokowane|kara pieni[eę][zż]na|post[eę]powanie karne|ostatnie ostrze[zż]enie|urgent|immediate action)/i.test(combined);

  const emotionalManipulation =
    /(wygra[łl]e[sś]|nagroda pieni[eę][zż]na|spadek|loteria|twoje konto zostanie usuni[eę]te|dramatyczna sytuacja)/i.test(combined);

  const suspiciousRequests: string[] = [];
  if (credentialPhishingDetected) suspiciousRequests.push('Żądanie logowania lub zmiany hasła przez niezweryfikowany link');
  if (smsCodeScamDetected) suspiciousRequests.push('Próba wyłudzenia kodu SMS/BLIK');
  if (bankImpersonation) suspiciousRequests.push('Podszywanie się pod procedury bezpieczeństwa banku');
  if (govImpersonation) suspiciousRequests.push('Podszywanie się pod instytucję państwową / sąd');
  if (fakeInvoiceOrPaymentDemand) suspiciousRequests.push('Fałszywe wezwanie do zapłaty lub faktura z podejrzanym linkiem');
  if (fakeDeliveryNotification) suspiciousRequests.push('Fałszywe zawiadomienie kurierskie o konieczności dopłaty');
  if (urgencyOrThreats) suspiciousRequests.push('Wymuszanie presji czasu lub groźby sankcji');
  if (promptInjectionDetected) suspiciousRequests.push('Wykryto próbę manipulacji modelem AI (Prompt Injection)');

  const notes = suspiciousRequests.length > 0
    ? `Wykryto podejrzane techniki socjotechniczne: ${suspiciousRequests.join(', ')}.`
    : 'Nie wykryto podejrzanych zwrotów socjotechnicznych.';

  return {
    credentialPhishingDetected,
    smsCodeScamDetected,
    bankImpersonation,
    govImpersonation,
    fakeInvoiceOrPaymentDemand,
    fakeDeliveryNotification,
    urgencyOrThreats,
    emotionalManipulation,
    promptInjectionDetected,
    suspiciousRequests,
    notes,
  };
}

// Stage D: Link Analysis
export function analyzeLinks(
  bodyText: string,
  fromDomain: string
): SecurityReport['stageD_Links'] {
  const urls = extractUrls(bodyText);
  const suspiciousLinks: LinkAnalysis[] = [];

  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'cutt.ly', 'ow.ly', 'is.gd'];

  for (const urlStr of urls) {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const isShortener = SHORTENERS.includes(host);
      const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

      // Typosquatting heuristics
      let hasTyposquatting = false;
      for (const bank of KNOWN_BANK_DOMAINS) {
        const bBase = bank.split('.')[0];
        if (host.includes(bBase) && !host.endsWith('.' + bank) && host !== bank) {
          hasTyposquatting = true;
          break;
        }
      }
      if (host.includes('gov') && !OFFICIAL_GOV_DOMAINS.some(g => host.endsWith(g))) {
        hasTyposquatting = true;
      }

      const isMismatchWithDomain = Boolean(fromDomain && !host.endsWith(fromDomain) && !fromDomain.endsWith(host) && !['google.com', 'microsoft.com'].includes(host));

      let risk = 0;
      let warning = '';

      if (isIpAddress) {
        risk += 75;
        warning = 'Link prowadzi bezpośrednio do adresu IP zamiast domeny.';
      } else if (hasTyposquatting) {
        risk += 85;
        warning = 'Adres URL podszywa się pod domenę banku lub instytucji rządowej.';
      } else if (isShortener) {
        risk += 50;
        warning = 'Link ze skracacza adresów ukrywa faktyczny cel docelowy.';
      } else if (parsed.protocol !== 'https:') {
        risk += 20;
        warning = 'Nieszyfrowane połączenie HTTP.';
      }

      if (risk > 30 || isShortener || isIpAddress || hasTyposquatting) {
        suspiciousLinks.push({
          url: urlStr,
          displayUrl: host,
          isShortener,
          isIpAddress,
          hasTyposquatting,
          mismatchWithText: isMismatchWithDomain,
          riskScore: Math.min(risk, 100),
          warning,
        });
      }
    } catch {
      // invalid URL string
    }
  }

  const notes = suspiciousLinks.length > 0
    ? `Zidentyfikowano ${suspiciousLinks.length} podejrzanych odnośników URL.`
    : `Przeanalizowano ${urls.length} linków – brak cech manipulacyjnych.`;

  return {
    linksFound: urls.length,
    suspiciousLinks,
    notes,
  };
}

// Stage E: Attachment Analysis
export function analyzeAttachments(
  attachments: { filename: string; mimeType: string; sizeBytes?: number }[]
): SecurityReport['stageE_Attachments'] {
  let hasExecutableOrMacro = false;
  let hasZipBombOrOversize = false;
  const analyzed: AttachmentInfo[] = [];

  for (const att of attachments) {
    const fn = att.filename.toLowerCase();
    const size = att.sizeBytes || 0;

    // Double extension check (e.g. faktura.pdf.exe)
    const parts = fn.split('.');
    const hasDoubleExtension = parts.length > 2 && DANGEROUS_EXTENSIONS.includes('.' + parts[parts.length - 1]);

    const isDangerousExtension =
      DANGEROUS_EXTENSIONS.some(ext => fn.endsWith(ext)) ||
      hasDoubleExtension ||
      att.mimeType === 'application/x-msdownload' ||
      att.mimeType === 'application/x-sh' ||
      att.mimeType === 'application/javascript';

    const isSuspiciousArchive = SUSPICIOUS_ARCHIVES.some(ext => fn.endsWith(ext));

    // Zip bomb or oversized check (> 30MB)
    const isOversize = size > 30 * 1024 * 1024;

    if (isDangerousExtension) hasExecutableOrMacro = true;
    if (isOversize) hasZipBombOrOversize = true;

    let scanStatus: AttachmentInfo['scanStatus'] = 'bezpieczny';
    let notes = 'Rozszerzenie i typ pliku standardowy.';

    if (isDangerousExtension) {
      scanStatus = 'zagrożenie';
      notes = 'Plik wykonywalny lub skrypt o wysokim potencjale infekcji malware!';
    } else if (hasDoubleExtension) {
      scanStatus = 'zagrożenie';
      notes = 'Ukryte podwójne rozszerzenie maskujące plik wykonywalny!';
    } else if (isSuspiciousArchive) {
      scanStatus = 'niesprawdzony';
      notes = 'Nietypowe archiwum wymagające izolacji.';
    }

    analyzed.push({
      filename: att.filename,
      mimeType: att.mimeType,
      sizeBytes: size,
      isDangerousExtension,
      isSuspiciousArchive,
      hasDoubleExtension,
      scanStatus,
      notes,
    });
  }

  const notes = hasExecutableOrMacro
    ? 'WYKRYTO NIEBEZPIECZNE ZAŁĄCZNIKI WYKONYWALNE! Izolacja w kwarantannie.'
    : analyzed.length > 0
    ? `Przeanalizowano ${analyzed.length} załączników.`
    : 'Wiadomość nie zawiera załączników.';

  return {
    attachments: analyzed,
    hasExecutableOrMacro,
    hasZipBombOrOversize,
    notes,
  };
}

// Full Pure Logic Security Evaluator
export function evaluateEmailSecurity(email: {
  id: string;
  from: string;
  to?: string;
  subject: string;
  bodySnippet: string;
  fullBody?: string;
  headers?: { name: string; value: string }[];
  attachments?: { filename: string; mimeType: string; sizeBytes?: number }[];
  replyTo?: string;
  returnPath?: string;
}): SecurityReport {
  const content = email.fullBody || email.bodySnippet || '';
  const headers = email.headers || [];
  const attachments = email.attachments || [];

  const stageA = analyzeSender(email.from, email.replyTo, email.returnPath);
  const stageB = analyzeHeaders(headers, stageA.domain, email.replyTo);
  const stageC = analyzeContent(email.subject, content);
  const stageD = analyzeLinks(content, stageA.domain);
  const stageE = analyzeAttachments(attachments);

  // Risk Score Calculation 0-100
  let technicalRisk = 0;
  let contentRisk = 0;
  let primaryThreats: string[] = [];

  // Stage A & B evaluation
  if (stageA.hasHomographOrSuspiciousChars) {
    technicalRisk += 45;
    primaryThreats.push('Podejrzana domena nadawcy (typosquatting/homograf)');
  }

  if (stageB.spf === 'FAIL' && stageB.dkim === 'FAIL') {
    technicalRisk += 75;
    primaryThreats.push('Brak autoryzacji SPF oraz DKIM dla domeny');
  } else if (stageB.spf === 'FAIL') {
    technicalRisk += 40;
    primaryThreats.push('Niezgodność SPF serwera pocztowego');
  } else if (stageB.dkim === 'FAIL') {
    technicalRisk += 40;
    primaryThreats.push('Nieprawidłowy podpis kryptograficzny DKIM');
  }

  if (stageB.replyToMismatch && (stageA.isFreemail || stageA.hasHomographOrSuspiciousChars)) {
    technicalRisk += 30;
    primaryThreats.push('Rozbieżność adresu odpowiedzi (Reply-To)');
  }

  // Stage C Content evaluation
  if (stageC.promptInjectionDetected) {
    contentRisk += 85;
    primaryThreats.push('Próba manipulacji systemem AI (Prompt Injection)');
  }
  if (stageC.credentialPhishingDetected) {
    contentRisk += 70;
    primaryThreats.push('Próba wyłudzenia danych logowania (Credential Phishing)');
  }
  if (stageC.smsCodeScamDetected) {
    contentRisk += 85;
    primaryThreats.push('Próba kradzieży kodu autoryzacyjnego SMS/BLIK');
  }
  if (stageC.bankImpersonation) {
    contentRisk += 70;
    primaryThreats.push('Podszywanie się pod procedury bankowe');
  }
  if (stageC.govImpersonation) {
    contentRisk += 70;
    primaryThreats.push('Fałszywe pismo urzędowe / egzekucyjne');
  }
  if (stageC.fakeInvoiceOrPaymentDemand) {
    contentRisk += 65;
    primaryThreats.push('Fałszywa faktura / żądanie przelewu');
  }
  if (stageC.fakeDeliveryNotification) {
    contentRisk += 65;
    primaryThreats.push('Fałszywe powiadomienie o paczce z dopłatą');
  }
  if (stageC.urgencyOrThreats) {
    contentRisk += 25;
  }

  // Stage D Links evaluation
  const highRiskLinks = stageD.suspiciousLinks.filter(l => l.riskScore >= 60);
  if (highRiskLinks.length > 0) {
    technicalRisk += 45;
    primaryThreats.push('Wykryto niebezpieczne lub podszywające się odnośniki');
  }

  // Stage E Attachments evaluation
  if (stageE.hasExecutableOrMacro) {
    technicalRisk += 80;
    primaryThreats.push('Niebezpieczny załącznik wykonywalny / makro');
  }

  // Combine overall risk
  let overallRisk = Math.min(100, Math.max(0, Math.round(technicalRisk * 0.45 + contentRisk * 0.55)));

  if (stageB.spf === 'FAIL' && stageB.dkim === 'FAIL') {
    overallRisk = Math.max(overallRisk, 75);
  }

  // If legitimate institution/bank with PASS on headers and no threat triggers:
  const isGenuineGov = OFFICIAL_GOV_DOMAINS.some(g => stageA.domain.endsWith(g)) && stageB.spf !== 'FAIL';
  const isGenuineBank = KNOWN_BANK_DOMAINS.some(b => stageA.domain === b || stageA.domain.endsWith('.' + b)) && stageB.spf !== 'FAIL';

  if ((isGenuineGov || isGenuineBank) && primaryThreats.length === 0) {
    overallRisk = Math.min(overallRisk, 15);
  }

  // If blatant phishing (e.g. prompt injection, dangerous exe, or typosquatting + login demand):
  if (stageE.hasExecutableOrMacro || (stageC.credentialPhishingDetected && stageA.hasHomographOrSuspiciousChars)) {
    overallRisk = Math.max(overallRisk, 88);
  }

  // Classification Category Determination
  const subjectLower = email.subject.toLowerCase();
  const contentLower = content.toLowerCase();
  let category: ClassificationCategory = 'OSOBISTE';

  const isPhishingPattern =
    overallRisk >= 60 ||
    primaryThreats.includes('Próba manipulacji systemem AI (Prompt Injection)') ||
    (stageC.govImpersonation && !isGenuineGov) ||
    (stageC.bankImpersonation && !isGenuineBank) ||
    stageC.smsCodeScamDetected ||
    (stageC.fakeDeliveryNotification && !['inpost.pl', 'dpd.com.pl', 'dhl.com'].some(d => stageA.domain.includes(d)));

  if (isPhishingPattern) {
    category = 'PHISHING';
  } else if (stageE.hasExecutableOrMacro || (overallRisk >= 50 && primaryThreats.length > 0)) {
    category = 'DO WERYFIKACJI';
  } else if (/(viagra|cialis|pills|kasyno|casino|jackpot|free spins|loteria|spadek)/i.test(subjectLower + contentLower)) {
    category = 'SPAM';
  } else if (isGenuineGov) {
    category = stageB.spf === 'FAIL' || overallRisk >= 50 ? 'PHISHING' : 'INSTYTUCJE';
  } else if (isGenuineBank) {
    category = stageB.spf === 'FAIL' || overallRisk >= 50 ? 'PHISHING' : 'BANKI';
  } else if (
    // E-commerce orders vs ads
    /(twoje zamówienie|zamówienie nr|order confirmation|potwierdzenie zamówienia|faktura za zamówienie|tracking|numer przesyłki)/i.test(subjectLower + contentLower) &&
    KNOWN_ECOMMERCE_DOMAINS.some(d => stageA.domain.includes(d))
  ) {
    category = 'ZAKUPY';
  } else if (
    /(rabat|wyprzedaż|okazja|kod rabatowy|odbierz kupon|mega promocja|super oferta|promocja|sale|discount|% zniżki)/i.test(subjectLower) ||
    (/(temu|aliexpress|shein|newsletter)/i.test(stageA.domain) && /(promocj|oferta|rabat|sale|zniżk)/i.test(contentLower))
  ) {
    category = 'REKLAMY';
  } else if (
    headers.some(h => h.name.toLowerCase() === 'list-unsubscribe') ||
    /(newsletter|subskrypcj|wypisz się|unsubscribe)/i.test(contentLower)
  ) {
    category = 'NEWSLETTERY';
  } else if (
    /(sąd|wyrok|prokuratur|policj|wezwanie|postanowienie|ważna informacja|pilne|urgent|action required)/i.test(subjectLower)
  ) {
    category = 'WAŻNE';
  } else if (
    /(paczka|kurier|dhl|inpost|dpd|pocztex|przesyłka)/i.test(subjectLower)
  ) {
    category = 'DOSTAWY';
  } else if (overallRisk >= 35) {
    category = 'DO WERYFIKACJI';
  } else {
    category = 'OSOBISTE';
  }

  // Recommended Action
  let recommendedAction: SecurityReport['recommendedAction'] = 'Zezwól (INBOX)';
  if (category === 'PHISHING' || overallRisk >= 80 || stageE.hasExecutableOrMacro) {
    recommendedAction = 'Kwarantanna (Przenieś)';
  } else if (category === 'DO WERYFIKACJI' || overallRisk >= 40) {
    recommendedAction = 'Do weryfikacji przez użytkownika';
  } else if (category === 'REKLAMY' || (category as string) === 'SPAM') {
    recommendedAction = 'Kwarantanna (Przenieś)';
  } else if (primaryThreats.length > 0) {
    recommendedAction = 'Oznacz ostrzeżeniem';
  }

  const confidence = primaryThreats.length > 0 || isGenuineGov || isGenuineBank ? 92 : 85;

  return {
    overallRisk,
    confidence,
    category,
    primaryThreats,
    recommendedAction,
    stageA_Sender: stageA,
    stageB_Headers: stageB,
    stageC_Content: stageC,
    stageD_Links: stageD,
    stageE_Attachments: stageE,
    aiSummary: {
      senderSummary: `${stageA.senderName} (${stageA.senderEmail})`,
      subjectSummary: email.subject,
      keyPoints: [
        `Kategoria: ${category}`,
        `Poziom ryzyka: ${overallRisk}/100`,
        primaryThreats.length > 0 ? `Zagrożenia: ${primaryThreats.join(', ')}` : 'Wiadomość zweryfikowana pozytywnie.',
      ],
      actionRequired: category === 'WAŻNE' || category === 'DO WERYFIKACJI' || recommendedAction.includes('weryfikacji'),
      actionDeadline: category === 'WAŻNE' ? 'Sprawdź w terminie 24-48h' : undefined,
      proposedDrafts: {
        formal: `Szanowny Panie / Szanowna Pani,\n\nDziękuję za przesłaną korespondencję dotyczącą "${email.subject}". Informuję, że zapoznałem się z treścią i wkrótce przekażę szczegółowe stanowisko.\n\nZ poważaniem,\nAleksander Kossakowski`,
        krotka: `Dzień dobry,\n\nPotwierdzam otrzymanie wiadomości w sprawie "${email.subject}".\n\nPozdrawiam,\nAlek`,
        uprzejma: `Dzień dobry!\n\nBardzo dziękuję za kontakt w sprawie "${email.subject}". Wszystko sprawdzę i odezwę się najszybciej jak to możliwe.\n\nMiłego dnia,\nAleksander`,
        urzedowa: `Dotyczy: ${email.subject}\n\nNiniejszym potwierdzam odbiór korespondencji z dnia ${new Date().toLocaleDateString('pl-PL')}.\n\nZ poważaniem,\nAleksander Kossakowski`,
        nieformalna: `Cześć,\n\nDzięki za maila! Daj mi chwilę, rzucę na to okiem i dam znać.\n\nTrzymaj się,\nAlek`,
      },
    },
  };
}
