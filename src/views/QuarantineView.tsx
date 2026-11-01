import React, { useState } from 'react';
import {
  FolderLock,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  Info,
  Calendar,
} from 'lucide-react';
import { EmailMessage } from '../types';

interface QuarantineViewProps {
  quarantinedEmails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onRestoreEmail: (email: EmailMessage) => void;
  onMarkSafe: (email: EmailMessage) => void;
  onReportMisclassification: (email: EmailMessage, userNotes: string) => void;
}

export const QuarantineView: React.FC<QuarantineViewProps> = ({
  quarantinedEmails,
  onSelectEmail,
  onRestoreEmail,
  onMarkSafe,
  onReportMisclassification,
}) => {
  const [misclassModalEmail, setMisclassModalEmail] = useState<EmailMessage | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const handleSendFeedback = () => {
    if (misclassModalEmail) {
      onReportMisclassification(misclassModalEmail, feedbackNotes);
      setMisclassModalEmail(null);
      setFeedbackNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <FolderLock className="w-3.5 h-3.5" />
                FOLDER KWARANTANNY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Wiadomości: {quarantinedEmails.length}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bezpieczna Izolacja Zagrożeń & Reklam
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Wiadomości wycofane ze skrzynki głównej (usunięto etykietę INBOX, przypisano etykietę AI_GUARDIAN_QUARANTINE).
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2 max-w-xs">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Zasada odwracalności:</strong> Żadna wiadomość nie jest kasowana. Możesz w każdej chwili przywrócić wiadomość do INBOX jednym kliknięciem.
            </p>
          </div>
        </div>
      </div>

      {/* Quarantined List */}
      <div className="space-y-3">
        {quarantinedEmails.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">Kwarantanna jest pusta</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Wszystkie podejrzane wiadomości lub agresywne reklamy zostaną tutaj natychmiast odizolowane, aby chronić Twoją skrzynkę.
            </p>
          </div>
        ) : (
          quarantinedEmails.map(mail => {
            const report = mail.securityReport;
            const risk = report?.overallRisk || 0;
            const cat = report?.category || 'PHISHING';

            return (
              <div
                key={mail.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        risk >= 80
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      RYZYKO {risk}/100
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {cat}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Izolowano: {mail.quarantineDate ? new Date(mail.quarantineDate).toLocaleString('pl-PL') : new Date(mail.date).toLocaleDateString('pl-PL')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRestoreEmail(mail)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                      title="Przywróć z powrotem do skrzynki odbiorczej INBOX"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Przywróć do INBOX</span>
                    </button>
                    <button
                      onClick={() => onMarkSafe(mail)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Oznacz bezpieczny</span>
                    </button>
                    <button
                      onClick={() => setMisclassModalEmail(mail)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="Zgłoś błędną klasyfikację"
                    >
                      <FileQuestion className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white hover:text-cyan-400 cursor-pointer" onClick={() => onSelectEmail(mail)}>
                    {mail.subject}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Nadawca: <span className="text-slate-300 font-medium">{mail.from}</span>
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {mail.snippet}
                  </p>
                </div>

                {/* Reason box */}
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-300/90 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-red-300">Powód kwarantanny: </span>
                    <span>{mail.quarantineReason || report?.primaryThreats?.join(', ') || 'Wykryto wysokie prawdopodobieństwo phishingu / spamu.'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Misclassification Feedback Modal */}
      {misclassModalEmail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 text-cyan-400 mb-4">
              <FileQuestion className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Zgłoś błędną klasyfikację</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Wiadomość: <strong className="text-white">{misclassModalEmail.subject}</strong>
            </p>
            <textarea
              value={feedbackNotes}
              onChange={e => setFeedbackNotes(e.target.value)}
              placeholder="Dlaczego uważasz, że ta wiadomość nie powinna znaleźć się w kwarantannie? (np. to oczekiwana oferta lub zaufany kontrahent)"
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setMisclassModalEmail(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                onClick={handleSendFeedback}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg"
              >
                Zapisz zgłoszenie i przywróć
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
