import React, { useState } from 'react';
import {
  X,
  Shield,
  AlertTriangle,
  FolderLock,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Link,
  Paperclip,
  Code2,
  Calendar,
  Sparkles,
  Bot,
} from 'lucide-react';
import { EmailMessage } from '../types';

interface EmailDetailModalProps {
  email: EmailMessage | null;
  onClose: () => void;
  onQuarantine: (email: EmailMessage) => void;
  onRestore: (email: EmailMessage) => void;
  onMarkSafe: (email: EmailMessage) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  onClose,
  onQuarantine,
  onRestore,
  onMarkSafe,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'stages' | 'raw' | 'drafts'>('summary');
  const [copiedDraftKey, setCopiedDraftKey] = useState<string | null>(null);

  if (!email) return null;

  const report = email.securityReport;
  const risk = report?.overallRisk || 0;
  const confidence = report?.confidence || 85;
  const category = report?.category || 'DO WERYFIKACJI';

  const copyDraft = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftKey(key);
    setTimeout(() => setCopiedDraftKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl text-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  risk >= 75
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : risk >= 35
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                Ryzyko: {risk}/100
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Pewność: {confidence}%
              </span>
              {email.inQuarantine && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <FolderLock className="w-3 h-3" /> W KWARANTANNIE
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white truncate">{email.subject}</h3>
            <p className="text-xs text-slate-400">
              Od: <span className="text-slate-200 font-mono">{email.from}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pt-3 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Streszczenie & AI</span>
          </button>

          <button
            onClick={() => setActiveTab('stages')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'stages'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>5 Etapów Analizy (A-E)</span>
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'drafts'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Proponowane Odpowiedzi</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Surowa Treść i Nagłówki</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar text-xs">
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    Podsumowanie AI
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    <strong>Dotyczy:</strong> {report?.aiSummary?.subjectSummary || email.subject}
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    <strong>Nadawca:</strong> {report?.aiSummary?.senderSummary || email.from}
                  </p>
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-semibold">Kluczowe punkty:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {report?.aiSummary?.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    Wymagane Działanie
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        report?.aiSummary?.actionRequired
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {report?.aiSummary?.actionRequired ? 'Wymaga reakcji / odpowiedzi' : 'Wiadomość czysto informacyjna'}
                    </span>
                  </div>

                  {report?.aiSummary?.actionDeadline && (
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-amber-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>Termin: {report.aiSummary.actionDeadline}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block font-semibold mb-1">Rekomendacja systemu:</span>
                    <p className="text-slate-200 font-medium">{report?.recommendedAction}</p>
                  </div>
                </div>
              </div>

              {/* Snippet preview */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Treść wiadomości</h4>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {email.fullBody || email.snippet}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STAGES A-E */}
          {activeTab === 'stages' && report && (
            <div className="space-y-3">
              {/* Etap A */}
              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>Etap A: Analiza Nadawcy</span>
                  <span className="text-slate-400 font-mono">Reputacja: {report.stageA_Sender.domainReputationScore}/100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>Domena: <span className="font-mono text-white">{report.stageA_Sender.domain}</span></div>
                  <div>Homograf/Punycode: <span className="text-white">{report.stageA_Sender.hasHomographOrSuspiciousChars ? 'WYKRYTO ⚠' : 'Czyste'}</span></div>
                  <div>Typ: <span className="text-white">{report.stageA_Sender.isCorporateOrGov ? 'Instytucjonalna / Firmowa' : 'Darmowa poczta (freemail)'}</span></div>
                  <div>Reply-To: <span className="font-mono text-white">{report.stageA_Sender.replyTo || 'Zgodne'}</span></div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">{report.stageA_Sender.notes}</p>
              </div>

              {/* Etap B */}
              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                  <span>Etap B: Nagłówki & Kryptografia</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded ${report.stageB_Headers.spf === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>SPF: {report.stageB_Headers.spf}</span>
                    <span className={`px-1.5 py-0.5 rounded ${report.stageB_Headers.dkim === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>DKIM: {report.stageB_Headers.dkim}</span>
                    <span className={`px-1.5 py-0.5 rounded ${report.stageB_Headers.dmarc === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>DMARC: {report.stageB_Headers.dmarc}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">{report.stageB_Headers.notes}</p>
              </div>

              {/* Etap C */}
              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Etap C: Analiza Socjotechniczna Treści</span>
                  <span className="text-slate-400">
                    {report.stageC_Content.promptInjectionDetected ? '⚠ PROMPT INJECTION' : 'W normie'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>Wyłudzenie haseł: {report.stageC_Content.credentialPhishingDetected ? 'TAK ⚠' : 'Nie'}</div>
                  <div>Podszywanie pod bank: {report.stageC_Content.bankImpersonation ? 'TAK ⚠' : 'Nie'}</div>
                  <div>Podszywanie pod urząd: {report.stageC_Content.govImpersonation ? 'TAK ⚠' : 'Nie'}</div>
                  <div>Presja czasu / groźby: {report.stageC_Content.urgencyOrThreats ? 'TAK ⚠' : 'Nie'}</div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">{report.stageC_Content.notes}</p>
              </div>

              {/* Etap D */}
              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>Etap D: Analiza Odnośników URL</span>
                  <span className="text-slate-400">{report.stageD_Links.linksFound} linków</span>
                </div>
                {report.stageD_Links.suspiciousLinks.length > 0 ? (
                  <div className="space-y-1.5">
                    {report.stageD_Links.suspiciousLinks.map((l, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-red-300">
                        {l.url} ({l.warning})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">Brak podejrzanych linków.</p>
                )}
              </div>

              {/* Etap E */}
              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-400">
                  <span>Etap E: Załączniki i Pliki</span>
                  <span className="text-slate-400">{report.stageE_Attachments.attachments.length} plików</span>
                </div>
                {report.stageE_Attachments.attachments.length > 0 ? (
                  <div className="space-y-1.5">
                    {report.stageE_Attachments.attachments.map((att, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-200">{att.filename}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${att.isDangerousExtension ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                          {att.scanStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">Wiadomość nie zawiera załączników.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DRAFTS (CZĘŚĆ 14) */}
          {activeTab === 'drafts' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-slate-300 text-xs">
                <p>
                  <strong>Generator Odpowiedzi:</strong> Przygotowane warianty możesz skopiować jednym kliknięciem. Ze względów bezpieczeństwa aplikacja <strong>nie wysyła</strong> wiadomości bezpośrednio.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'formal', label: 'Wariant 1: Oficjalna / Formalna', text: report?.aiSummary?.proposedDrafts?.formal },
                  { key: 'urzedowa', label: 'Wariant 2: Urzędowa / Potwierdzająca', text: report?.aiSummary?.proposedDrafts?.urzedowa },
                  { key: 'uprzejma', label: 'Wariant 3: Uprzejma / Standardowa', text: report?.aiSummary?.proposedDrafts?.uprzejma },
                  { key: 'krotka', label: 'Wariant 4: Krótka / Potwierdzenie', text: report?.aiSummary?.proposedDrafts?.krotka },
                  { key: 'nieformalna', label: 'Wariant 5: Nieformalna / Przyjacielska', text: report?.aiSummary?.proposedDrafts?.nieformalna },
                ]
                  .filter(d => d.text)
                  .map(draft => (
                    <div key={draft.key} className="p-4 bg-slate-850 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-xs">{draft.label}</span>
                        <button
                          onClick={() => copyDraft(draft.key, draft.text!)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white transition-colors"
                        >
                          {copiedDraftKey === draft.key ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Skopiowano!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopiuj</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 font-sans text-xs text-slate-300 whitespace-pre-wrap">
                        {draft.text}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: RAW HEADERS */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nagłówki wiadomości (MIME)</h4>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1 max-h-72 overflow-y-auto">
                {email.rawHeaders && email.rawHeaders.length > 0 ? (
                  email.rawHeaders.map((h, idx) => (
                    <div key={idx} className="break-all">
                      <strong className="text-cyan-400">{h.name}:</strong> {h.value}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Brak surowych nagłówków dla tej wiadomości.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!email.inQuarantine ? (
              <button
                onClick={() => {
                  onQuarantine(email);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold"
              >
                <FolderLock className="w-4 h-4" />
                <span>Przenieś do Kwarantanny</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onRestore(email);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Przywróć do INBOX</span>
              </button>
            )}

            <button
              onClick={() => {
                onMarkSafe(email);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Oznacz jako bezpieczną</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
