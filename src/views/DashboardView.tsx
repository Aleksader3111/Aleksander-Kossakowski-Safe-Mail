import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  FolderLock,
  Mail,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  FlaskConical,
  Radio,
  FileText,
} from 'lucide-react';
import { EmailMessage, AuditLogEntry, SyncStatus, OperatingMode } from '../types';

interface DashboardViewProps {
  emails: EmailMessage[];
  auditLogs: AuditLogEntry[];
  syncStatus: SyncStatus;
  mode: OperatingMode;
  lastSyncTime: string;
  onSelectView: (view: string) => void;
  onSelectEmail: (email: EmailMessage) => void;
  onRunSync: () => void;
  onOpenGmailTest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  emails,
  auditLogs,
  syncStatus,
  mode,
  lastSyncTime,
  onSelectView,
  onSelectEmail,
  onRunSync,
  onOpenGmailTest,
}) => {
  const totalAnalyzed = emails.length;
  const importantCount = emails.filter(e => e.securityReport?.category === 'WAŻNE' || e.securityReport?.category === 'INSTYTUCJE').length;
  const quarantineCount = emails.filter(e => e.inQuarantine).length;
  const threatsCount = emails.filter(e => (e.securityReport?.overallRisk || 0) >= 60 || e.securityReport?.category === 'PHISHING').length;

  // Category counts breakdown
  const categoryCounts = emails.reduce((acc, email) => {
    const cat = email.securityReport?.category || 'DO WERYFIKACJI';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentThreats = emails
    .filter(e => (e.securityReport?.overallRisk || 0) >= 50 || e.inQuarantine)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Quick stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM OCHRONY AKTYWNY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Tryb: <strong className="text-slate-200">{mode}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              AI Mail Guardian Dashboard
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Ciągły monitoring skrzynki docelowej <span className="text-cyan-400 font-medium">akossakowski18@gmail.com</span>. Wielowarstwowa analiza nagłówków SPF/DKIM, linków, załączników oraz heurystyka Gemini AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectView('test-runner')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition-all shadow-md"
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>20 Testów (Część 19)</span>
            </button>
            <button
              onClick={onOpenGmailTest}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-xs font-semibold text-purple-200 border border-purple-500/30 transition-all shadow-md"
            >
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Test Gmail</span>
            </button>
            <button
              onClick={onRunSync}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Skanuj teraz</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Przeanalizowane */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Przeanalizowane</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalAnalyzed}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> {lastSyncTime || 'Bieżąca sesja'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        {/* Ważne i Instytucje */}
        <div
          onClick={() => onSelectView('wazne')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400">Ważne & Instytucje</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1">{importantCount}</h3>
            <p className="text-[11px] text-emerald-400/90 mt-0.5 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Ochrona priorytetowa
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Zagrożenia wykryte */}
        <div
          onClick={() => onSelectView('zagrozenia')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400">Wykryte zagrożenia</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">{threatsCount}</h3>
            <p className="text-[11px] text-red-400/80 mt-0.5 font-medium">
              Phishing, malware, oszustwa
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Kwarantanna */}
        <div
          onClick={() => onSelectView('kwarantanna')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400">W Kwarantannie</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{quarantineCount}</h3>
            <p className="text-[11px] text-amber-400/80 mt-0.5 font-medium">
              Wiadomości bezpiecznie izolowane
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <FolderLock className="w-5 h-5" />
          </div>
        </div>

        {/* Status Połączenia */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Status Gmail</p>
            <h3 className="text-sm font-bold text-white mt-1 truncate max-w-[130px]">
              {syncStatus}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
              {auditLogs.length} wpisów audytu
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Alerty i Ostatnie Działania */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Security Alerts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <h3 className="font-bold text-sm text-white">Najważniejsze alerty & zagrożenia</h3>
            </div>
            <button
              onClick={() => onSelectView('zagrozenia')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Wszystkie zagrożenia</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {recentThreats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Brak aktywnych zagrożeń krytycznych. Skrzynka jest bezpieczna.
              </div>
            ) : (
              recentThreats.map(mail => {
                const report = mail.securityReport;
                const risk = report?.overallRisk || 0;
                return (
                  <div
                    key={mail.id}
                    onClick={() => onSelectEmail(mail)}
                    className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            risk >= 80
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          RYZYKO {risk}/100
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[280px]">
                          {mail.subject}
                        </span>
                        {mail.inQuarantine && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-medium">
                            KWARANTANNA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-lg">
                        Od: {mail.from}
                      </p>
                      {report?.primaryThreats && report.primaryThreats.length > 0 && (
                        <p className="text-[11px] text-red-300/90 font-medium">
                          ⚠ {report.primaryThreats.join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectEmail(mail);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition-colors"
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

        {/* Right Column: Category Distribution & AI Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Struktura skrzynki</h3>
              <span className="text-xs text-slate-400">{totalAnalyzed} wiadomości</span>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { cat: 'INSTYTUCJE', label: 'Instytucje & Sądy', count: categoryCounts['INSTYTUCJE'] || 0, color: 'bg-cyan-500' },
                { cat: 'BANKI', label: 'Bankowość', count: categoryCounts['BANKI'] || 0, color: 'bg-blue-500' },
                { cat: 'WAŻNE', label: 'Ważne sprawy', count: categoryCounts['WAŻNE'] || 0, color: 'bg-indigo-500' },
                { cat: 'ZAKUPY', label: 'Zamówienia / Zakupy', count: categoryCounts['ZAKUPY'] || 0, color: 'bg-emerald-500' },
                { cat: 'REKLAMY', label: 'Reklamy i oferty', count: categoryCounts['REKLAMY'] || 0, color: 'bg-amber-500' },
                { cat: 'PHISHING', label: 'Phishing i próby oszustw', count: categoryCounts['PHISHING'] || 0, color: 'bg-red-500' },
                { cat: 'OSOBISTE', label: 'Prywatne / Pozostałe', count: categoryCounts['OSOBISTE'] || 0, color: 'bg-slate-500' },
              ].map(item => {
                const percent = totalAnalyzed > 0 ? Math.round((item.count / totalAnalyzed) * 100) : 0;
                return (
                  <div key={item.cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <span className="text-slate-400 font-mono">
                        {item.count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick AI Audit note */}
          <div className="mt-6 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Ostatnia decyzja AI
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {auditLogs[0]?.timestamp ? new Date(auditLogs[0].timestamp).toLocaleTimeString('pl-PL') : 'Brak'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {auditLogs[0]?.reason || 'Silnik Gemini oraz reguły SPF/DKIM są w pełnej gotowości.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
