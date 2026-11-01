import React, { useState } from 'react';
import {
  History,
  Download,
  Filter,
  ShieldCheck,
  AlertTriangle,
  FolderLock,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_guardian_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Dziennik Zdarzeń & Audyt Bezpieczeństwa
          </h2>
          <p className="text-xs text-slate-400">
            Niezmienny rejestr operacji automatycznych, decyzji analitycznych i akcji kwarantanny ({logs.length} wpisów).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Wszystkie akcje</option>
            <option value="KWARANTANNA">Kwarantanna</option>
            <option value="ANALIZA_AI">Analiza AI</option>
            <option value="PRZYWRÓCENIE">Przywrócenie</option>
            <option value="SYNCHRONIZACJA">Synchronizacja</option>
          </select>

          <button
            onClick={exportLogsAsJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Eksportuj JSON</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Czas zdarzenia</th>
                <th className="py-3 px-4">Czynność</th>
                <th className="py-3 px-4">Wiadomość / Temat</th>
                <th className="py-3 px-4">Powód i Szczegóły</th>
                <th className="py-3 px-4 text-center">Ryzyko</th>
                <th className="py-3 px-4 text-center">Pewność</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Brak wpisów audytowych dla wybranego filtru.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pl-PL')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'KWARANTANNA'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.action === 'PRZYWRÓCENIE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate">
                      {log.subject || log.messageId}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-md">
                      <p className="line-clamp-1">{log.reason}</p>
                      {log.details && (
                        <p className="text-[10px] text-slate-400 font-mono line-clamp-1">{log.details}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          log.riskScore >= 70
                            ? 'text-red-400'
                            : log.riskScore >= 35
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {log.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono whitespace-nowrap">
                      {log.confidenceScore}%
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
