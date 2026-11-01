import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  FolderLock,
  Mail,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { EmailMessage, ClassificationCategory } from '../types';

interface InboxViewProps {
  title: string;
  categoryFilter?: ClassificationCategory | 'ALL' | 'IMPORTANT_GROUP';
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
  onQuarantineEmail: (email: EmailMessage) => void;
  onMarkSafe: (email: EmailMessage) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  title,
  categoryFilter = 'ALL',
  emails,
  onSelectEmail,
  onQuarantineEmail,
  onMarkSafe,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');

  // Filter messages based on category, search, and risk
  const filteredEmails = emails.filter(email => {
    const report = email.securityReport;
    const cat = report?.category || 'OSOBISTE';

    // Category matching
    if (categoryFilter === 'IMPORTANT_GROUP') {
      if (cat !== 'WAŻNE' && cat !== 'INSTYTUCJE') return false;
    } else if (categoryFilter !== 'ALL' && cat !== categoryFilter) {
      return false;
    }

    // Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSubject = email.subject.toLowerCase().includes(q);
      const matchFrom = email.from.toLowerCase().includes(q);
      const matchSnippet = email.snippet.toLowerCase().includes(q);
      if (!matchSubject && !matchFrom && !matchSnippet) return false;
    }

    // Risk filter
    const risk = report?.overallRisk || 0;
    if (riskFilter === 'LOW' && risk >= 30) return false;
    if (riskFilter === 'MEDIUM' && (risk < 30 || risk >= 70)) return false;
    if (riskFilter === 'HIGH' && risk < 70) return false;

    return true;
  });

  return (
    <div className="space-y-5">
      {/* View Header with Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            {title}
          </h2>
          <p className="text-xs text-slate-400">
            Liczba wiadomości: <strong className="text-slate-200">{filteredEmails.length}</strong> (z {emails.length} w rejestrze)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Szukaj w nadawcy, temacie..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setRiskFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                riskFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setRiskFilter('LOW')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                riskFilter === 'LOW' ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Niskie ryzyko
            </button>
            <button
              onClick={() => setRiskFilter('HIGH')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                riskFilter === 'HIGH' ? 'bg-red-600/30 text-red-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wysokie ryzyko
            </button>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-2.5">
        {filteredEmails.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Brak wiadomości w tej kategorii</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Nie znaleziono e-maili spełniających wybrane kryteria filtrowania.
            </p>
          </div>
        ) : (
          filteredEmails.map(mail => {
            const report = mail.securityReport;
            const risk = report?.overallRisk || 0;
            const cat = report?.category || 'DO WERYFIKACJI';
            const spf = report?.stageB_Headers?.spf;

            return (
              <div
                key={mail.id}
                onClick={() => onSelectEmail(mail)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Pill */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {cat}
                    </span>

                    {/* Risk Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        risk >= 70
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : risk >= 35
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      Ryzyko {risk}/100
                    </span>

                    {/* SPF Status */}
                    <span
                      className={`px-1.5 py-0.2 text-[9px] rounded font-mono ${
                        spf === 'PASS'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : spf === 'FAIL'
                          ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      SPF: {spf || 'BRAK'}
                    </span>

                    {/* Quarantine Badge */}
                    {mail.inQuarantine && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <FolderLock className="w-3 h-3" /> W KWARANTANNIE
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      {new Date(mail.date).toLocaleDateString('pl-PL')}
                    </span>
                  </div>

                  {/* Subject & Sender */}
                  <h4 className="text-sm font-semibold text-slate-100 truncate">
                    {mail.subject}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    Od: <span className="text-slate-300 font-medium">{mail.from}</span>
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {mail.snippet}
                  </p>

                  {/* Threat tags */}
                  {report?.primaryThreats && report.primaryThreats.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {report.primaryThreats.map((threat, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-red-300/90 bg-red-950/30 border border-red-800/30 px-2 py-0.5 rounded"
                        >
                          ⚠ {threat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {!mail.inQuarantine ? (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onQuarantineEmail(mail);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                      title="Przenieś do kwarantanny"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>Kwarantanna</span>
                    </button>
                  ) : (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onMarkSafe(mail);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                      title="Przywróć do skrzynki odbiorczej"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Przywróć</span>
                    </button>
                  )}

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectEmail(mail);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Szczegóły
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
