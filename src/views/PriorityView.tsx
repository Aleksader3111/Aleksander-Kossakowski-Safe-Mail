import React, { useState } from 'react';
import {
  Flame,
  AlertOctagon,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { EmailMessage, PriorityLevel } from '../types';

interface PriorityViewProps {
  emails: EmailMessage[];
  onSelectEmail: (email: EmailMessage) => void;
}

export const PriorityView: React.FC<PriorityViewProps> = ({ emails, onSelectEmail }) => {
  const [selectedLevel, setSelectedLevel] = useState<PriorityLevel | 'ALL'>('ALL');

  // Priority sorting helper (P0 > P1 > P2 > P3 > P4)
  const priorityOrder: Record<PriorityLevel, number> = {
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
  };

  const sortedEmails = [...emails].sort((a, b) => {
    const levelA = a.priorityAssessment?.level || 'P3';
    const levelB = b.priorityAssessment?.level || 'P3';
    if (priorityOrder[levelA] !== priorityOrder[levelB]) {
      return priorityOrder[levelA] - priorityOrder[levelB];
    }
    return (b.priorityAssessment?.urgency || 0) - (a.priorityAssessment?.urgency || 0);
  });

  const filteredEmails = sortedEmails.filter(e => {
    if (selectedLevel === 'ALL') return true;
    return e.priorityAssessment?.level === selectedLevel;
  });

  const getPriorityStyle = (lvl: PriorityLevel) => {
    switch (lvl) {
      case 'P0':
        return {
          pill: 'bg-rose-950 text-rose-300 border-rose-800 font-black',
          title: 'KRYTYCZNE (Natychmiastowe działanie)',
          border: 'border-rose-800/80 hover:border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/30',
        };
      case 'P1':
        return {
          pill: 'bg-amber-950 text-amber-300 border-amber-800 font-bold',
          title: 'PILNE (Wymaga szybkiego działania)',
          border: 'border-amber-800/80 hover:border-amber-500 bg-amber-950/10',
        };
      case 'P2':
        return {
          pill: 'bg-blue-950 text-blue-300 border-blue-800 font-bold',
          title: 'WAŻNE (Wymaga zapoznania/odpowiedzi)',
          border: 'border-blue-900/60 hover:border-blue-600',
        };
      case 'P3':
        return {
          pill: 'bg-slate-950 text-slate-400 border-slate-800',
          title: 'NORMALNE (Bieżąca korespondencja)',
          border: 'border-slate-800 hover:border-slate-700',
        };
      case 'P4':
        return {
          pill: 'bg-purple-950 text-purple-300 border-purple-800',
          title: 'NISKIE / KWARANTANNA',
          border: 'border-slate-800/70 opacity-80',
        };
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-800">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Inteligentne Priorytetyzowanie Poczty
            </h2>
            <p className="text-xs text-slate-400">
              Klasyfikacja P0-P4 na podstawie pilności, wagi, konsekwencji i terminów
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto whitespace-nowrap custom-scrollbar">
          {(['ALL', 'P0', 'P1', 'P2', 'P3', 'P4'] as const).map(lvl => {
            const count = lvl === 'ALL' ? emails.length : emails.filter(e => e.priorityAssessment?.level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-950/40'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                }`}
              >
                {lvl === 'ALL' ? 'Wszystkie' : lvl} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Emails by priority */}
      <div className="space-y-3">
        {filteredEmails.map(mail => {
          const p = mail.priorityAssessment || { level: 'P3' as PriorityLevel, reason: '', urgency: 20, importance: 30, requiresReply: false, requiresAction: false };
          const style = getPriorityStyle(p.level);

          return (
            <div
              key={mail.id}
              onClick={() => onSelectEmail(mail)}
              className={`bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-md hover:border-cyan-500/50 ${style.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border ${style.pill}`}>
                    {p.level}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {mail.subject}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{new Date(mail.date).toLocaleDateString('pl-PL')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-mono text-[11px]">
                  Nadawca: <strong className="text-cyan-300">{mail.from}</strong>
                </p>

                {/* Reason box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-white shrink-0">Ocena Jarvisa:</span>
                    <span>{p.reason}</span>
                  </div>

                  {p.consequences && (
                    <div className="text-rose-400 font-medium text-[11px] pt-1 border-t border-slate-800">
                      ⚠ Skutki braku reakcji: {p.consequences}
                    </div>
                  )}

                  {p.suggestedReplyDeadline && (
                    <div className="text-cyan-400 font-medium text-[11px]">
                      ⏱ Sugerowany termin odpowiedzi: {p.suggestedReplyDeadline}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
