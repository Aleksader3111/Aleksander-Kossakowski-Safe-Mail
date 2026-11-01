import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Bell,
  Check,
} from 'lucide-react';
import { DeadlineItem } from '../types';

interface CalendarViewProps {
  deadlines: DeadlineItem[];
  onConfirmDeadline: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ deadlines, onConfirmDeadline }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'LEGAL' | 'OTHER'>('ALL');
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(
    new Set(deadlines.filter(d => d.confirmed).map(d => d.id))
  );

  const toggleConfirm = (id: string) => {
    setConfirmedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onConfirmDeadline(id);
  };

  const filteredDeadlines = deadlines.filter(d => {
    if (filterType === 'LEGAL') return d.isLegalOrCourt;
    if (filterType === 'OTHER') return !d.isLegalOrCourt;
    return true;
  });

  const exportIcsFile = () => {
    // Generate simple .ics calendar file for user download
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AlekSafeMail Jarvis//PL',
      'CALSCALE:GREGORIAN',
    ];

    deadlines.forEach((dl) => {
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:jarvis-${dl.id}@aleksafe.mail`,
        `SUMMARY:${dl.title.replace(/[,;]/g, '')}`,
        `DESCRIPTION:${dl.justificationFragment.replace(/[,;]/g, '')}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_terminy_${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Kalendarz & Wykryte Terminy
              </h2>
              <p className="text-xs text-slate-400">
                Terminy posiedzeń sądowych, terminów procesowych, płatności i dostaw
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={exportIcsFile}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-950/40 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Eksportuj do Kalendarza (.ics)</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 custom-scrollbar">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Wszystkie terminy ({deadlines.length})
        </button>
        <button
          onClick={() => setFilterType('LEGAL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'LEGAL'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Sądowe & Urzędowe ({deadlines.filter(d => d.isLegalOrCourt).length})
        </button>
        <button
          onClick={() => setFilterType('OTHER')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'OTHER'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Pozostałe terminy ({deadlines.filter(d => !d.isLegalOrCourt).length})
        </button>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {filteredDeadlines.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-400">Brak terminów w tej kategorii</p>
          </div>
        ) : (
          filteredDeadlines.map(dl => {
            const isConfirmed = confirmedIds.has(dl.id);

            return (
              <div
                key={dl.id}
                className={`bg-slate-900 rounded-2xl p-5 border shadow-md transition-all space-y-3 ${
                  dl.isLegalOrCourt
                    ? 'border-blue-800/80 ring-1 ring-blue-500/20 bg-blue-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-lg text-xs font-black bg-cyan-500 text-slate-950 flex items-center gap-1.5 shadow-xs">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {dl.date} {dl.time ? `o ${dl.time}` : ''}
                    </span>

                    {dl.isLegalOrCourt && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-900 text-blue-200 border border-blue-700">
                        SĄD / URZĄD
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-mono">
                      Pewność detekcji: {dl.confidence}%
                    </span>
                  </div>

                  <button
                    onClick={() => toggleConfirm(dl.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isConfirmed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isConfirmed ? 'Zatwierdzony w planie' : 'Zatwierdź termin'}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{dl.title}</h4>
                  <p className="text-xs text-slate-400">
                    Źródło: <span className="font-medium text-cyan-300 font-mono">{dl.sourceSender}</span> • Temat: {dl.sourceSubject}
                  </p>
                </div>

                {/* Justification quote */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic">
                  "{dl.justificationFragment}"
                </div>

                {/* Reminders schedule */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Przypomnienia: 7 dni wcześniej, 3 dni wcześniej, 1 dzień przed terminem
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
