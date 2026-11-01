export type ClassificationCategory =
  | 'KRYTYCZNE'
  | 'INSTYTUCJE'
  | 'BANKI'
  | 'OSOBISTE'
  | 'ZAKUPY'
  | 'DOSTAWY'
  | 'WAŻNE'
  | 'NEWSLETTERY'
  | 'REKLAMY'
  | 'SPAM'
  | 'PHISHING'
  | 'DO WERYFIKACJI';

export type OperatingMode = 'OBSERWACYJNY' | 'POLAUTOMATYCZNY' | 'AUTOMATYCZNY';

export type SyncStatus =
  | 'Gmail niepołączony'
  | 'Oczekiwanie na zgodę'
  | 'Połączono'
  | 'Synchronizowanie'
  | 'Analizowanie'
  | 'Chroniony'
  | 'Błąd'
  | 'Wymagana ponowna autoryzacja';

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface PriorityAssessment {
  level: PriorityLevel;
  urgency: number; // 0-100
  importance: number; // 0-100
  reason: string;
  requiresReply: boolean;
  requiresAction: boolean;
  suggestedReplyDeadline?: string;
  consequences?: string;
}

export interface TaskItem {
  id: string;
  messageId: string;
  title: string;
  description: string;
  deadline?: string;
  priority: PriorityLevel;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  sourceSender: string;
  sourceSubject: string;
  createdAt: string;
}

export interface DeadlineItem {
  id: string;
  messageId: string;
  date: string;
  time?: string;
  title: string;
  sourceSender: string;
  sourceSubject: string;
  justificationFragment: string;
  isLegalOrCourt: boolean;
  confidence: number;
  confirmed: boolean;
  reminderDays: number[]; // e.g. [7, 3, 1, 0]
}

export interface ContactProfile {
  email: string;
  name: string;
  messageCount: number;
  lastContactDate: string;
  topics: string[];
  recentSubjects: string[];
  trustStatus: 'ZAUFANY' | 'STANDARD' | 'PODEJRZANY' | 'INSTYTUCJA';
  linkedTasksCount: number;
  linkedDeadlinesCount: number;
  notes?: string;
}

export interface DocumentExtraction {
  id: string;
  messageId: string;
  type: 'FAKTURA' | 'PŁATNOŚĆ' | 'ZAMÓWIENIE' | 'URZĘDOWY' | 'SĄDOWY' | 'INNE';
  docNumber?: string;
  issuer?: string;
  issueDate?: string;
  amount?: string;
  dueDate?: string;
  confidence: number;
  notes: string;
}

export type ReplyStyle =
  | 'Formalny'
  | 'Urzędowy'
  | 'Prawniczy'
  | 'Uprzejmy'
  | 'Krótki'
  | 'Profesjonalny'
  | 'Nieformalny';

export interface ReplyDraft {
  id: string;
  messageId: string;
  toEmail: string;
  toName?: string;
  subject: string;
  style: ReplyStyle;
  content: string;
  jarvisReasoning: string;
  status: 'PROPOSED' | 'DRAFT_SAVED' | 'SENT' | 'REJECTED';
  createdAt: string;
}

export interface FollowUpReminder {
  id: string;
  messageId: string;
  subject: string;
  contact: string;
  dateReceived: string;
  daysWaiting: number;
  priority: PriorityLevel;
  suggestedReplyDeadline: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface AttachmentInfo {
  id?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isDangerousExtension: boolean;
  isSuspiciousArchive: boolean;
  hasDoubleExtension: boolean;
  scanStatus: 'bezpieczny' | 'zagrożenie' | 'niesprawdzony';
  notes?: string;
}

export interface LinkAnalysis {
  url: string;
  displayUrl?: string;
  isShortener: boolean;
  isIpAddress: boolean;
  hasTyposquatting: boolean;
  mismatchWithText: boolean;
  riskScore: number;
  warning?: string;
}

export interface SecurityReport {
  overallRisk: number; // 0-100
  confidence: number; // 0-100
  category: ClassificationCategory;
  primaryThreats: string[];
  recommendedAction: 'Zezwól (INBOX)' | 'Kwarantanna (Przenieś)' | 'Oznacz ostrzeżeniem' | 'Do weryfikacji przez użytkownika';
  
  stageA_Sender: {
    senderEmail: string;
    senderName: string;
    domain: string;
    replyTo?: string;
    returnPath?: string;
    isCorporateOrGov: boolean;
    isFreemail: boolean;
    hasHomographOrSuspiciousChars: boolean;
    domainReputationScore: number; // 0-100
    notes: string;
  };

  stageB_Headers: {
    spf: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE';
    dkim: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE';
    dmarc: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE';
    authenticationResults?: string;
    receivedHops: number;
    replyToMismatch: boolean;
    notes: string;
  };

  stageC_Content: {
    credentialPhishingDetected: boolean;
    smsCodeScamDetected: boolean;
    bankImpersonation: boolean;
    govImpersonation: boolean;
    fakeInvoiceOrPaymentDemand: boolean;
    fakeDeliveryNotification: boolean;
    urgencyOrThreats: boolean;
    emotionalManipulation: boolean;
    promptInjectionDetected: boolean;
    suspiciousRequests: string[];
    notes: string;
  };

  stageD_Links: {
    linksFound: number;
    suspiciousLinks: LinkAnalysis[];
    notes: string;
  };

  stageE_Attachments: {
    attachments: AttachmentInfo[];
    hasExecutableOrMacro: boolean;
    hasZipBombOrOversize: boolean;
    notes: string;
  };

  aiSummary?: {
    senderSummary: string;
    subjectSummary: string;
    keyPoints: string[];
    actionRequired: boolean;
    actionDeadline?: string;
    proposedDrafts?: {
      formal?: string;
      urzedowa?: string;
      prawnicza?: string;
      uprzejma?: string;
      krotka?: string;
      profesjonalna?: string;
      nieformalna?: string;
    };
  };
}

export interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  timestamp: number;
  labelIds: string[];
  inQuarantine: boolean;
  quarantineReason?: string;
  quarantineDate?: string;
  isRestored?: boolean;
  bodySnippet: string;
  fullBody?: string;
  securityReport?: SecurityReport;
  priorityAssessment?: PriorityAssessment;
  documentExtraction?: DocumentExtraction;
  rawHeaders?: EmailHeader[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  messageId: string;
  subject: string;
  action:
    | 'SYNCHRONIZACJA'
    | 'ANALIZA_AI'
    | 'PRIORYTYZACJA'
    | 'PROPOZYCJA_ODPOWIEDZI'
    | 'WYSLANIE_ODPOWIEDZI'
    | 'ZAPIS_SZKICU'
    | 'KWARANTANNA'
    | 'PRZYWRÓCENIE'
    | 'OZNACZ_BEZPIECZNY'
    | 'BŁĘDNA_KLASYFIKACJA'
    | 'BLOKADA_REKLAMY'
    | 'DODANO_ZADANIE'
    | 'DODANO_TERMIN';
  reason: string;
  category: ClassificationCategory;
  riskScore: number;
  confidenceScore: number;
  status: 'SUKCES' | 'OSTRZEŻENIE' | 'BŁĄD';
  details?: string;
  userEmail: string;
}

export interface TrustedEntity {
  id: string;
  type: 'sender' | 'domain';
  value: string;
  label: string;
  trustLevel: 'WYSOKI' | 'ŚREDNI' | 'INSTYTUCJA';
  alwaysMarkImportant: boolean;
  addedAt: string;
}

export interface UserPreferences {
  targetEmail: string;
  operatingMode: OperatingMode;
  syncTimeframeDays: 7 | 30 | 90 | 0; // 0 = all
  quietHoursEnabled: boolean;
  quietHoursStart: string; // '22:00'
  quietHoursEnd: string; // '07:00'
  autoQuarantineAds: boolean;
  autoQuarantinePhishing: boolean;
  instantAlertsEnabled: boolean;
  voiceSynthesisEnabled: boolean;
  voiceSpeed: number; // 0.8 to 1.2
  voicePitch: number;
  pushNotificationsEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface DailyReport {
  date: string;
  totalAnalyzed: number;
  importantCount: number;
  urgentCount: number;
  adsCount: number;
  spamCount: number;
  threatsCount: number;
  quarantineCount: number;
  requiringActionCount: number;
  requiringReplyCount: number;
  openTasksCount: number;
  upcomingDeadlinesCount: number;
  keyEvents: string[];
  recommendedActions: string[];
}

export interface WeeklyReport {
  weekRange: string;
  totalEmails: number;
  criticalCount: number;
  urgentCount: number;
  completedTasks: number;
  upcomingDeadlines: number;
  topContacts: { name: string; email: string; count: number }[];
  keyEvents: string[];
  securityIncidents: number;
}

export interface TestResult {
  id: number;
  title: string;
  description: string;
  inputSummary: string;
  expectedCategoryOrOutcome: string;
  actualResult: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  errorDetails?: string;
  executedAt?: string;
}
