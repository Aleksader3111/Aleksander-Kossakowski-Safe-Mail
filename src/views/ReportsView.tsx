import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EmailMessage, TaskItem, DeadlineItem } from '../types';

interface ReportsViewProps {
  emails: EmailMessage[];
  tasks: TaskItem[];
  deadlines: DeadlineItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ emails, tasks, deadlines }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');

  const total = emails.length;
  const critical = emails.filter(e => e.priorityAssessment?.level === 'P0').length;
  const urgent = emails.filter(e => e.priorityAssessment?.level === 'P1').length;
  const important = emails.filter(e => e.priorityAssessment?.level === 'P2').length;
  const requiringReply = emails.filter(e => e.priorityAssessment?.requiresReply).length;
  const quarantined = emails.filter(e => e.inQuarantine).length;
  const openTasks = tasks.filter(t => t.status !== 'DONE').length;

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Raporty & Podsumowania Jarvisa
              </h2>
              <p className="text-xs text-slate-400">
                Statystyki korespondencji, bilans zadań i rekomendowane działania
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportType === 'daily'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Raport Dzienny
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportType === 'weekly'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Raport Tygodniowy
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">Przeanalizowano</span>
          <span className="text-2xl font-black text-white">{total}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Wiadomości</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-rose-900/60 shadow-md bg-rose-950/20">
          <span className="text-[11px] font-bold text-rose-400 block mb-1">Pilne & Krytyczne</span>
          <span className="text-2xl font-black text-rose-300">{critical + urgent}</span>
          <span className="text-[10px] text-rose-400/80 block mt-0.5">Wymagające uwagi</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-cyan-900/60 shadow-md bg-cyan-950/20">
          <span className="text-[11px] font-bold text-cyan-400 block mb-1">Otwarte Zadania</span>
          <span className="text-2xl font-black text-cyan-300">{openTasks}</span>
          <span className="text-[10px] text-cyan-400/80 block mt-0.5">Do realizacji</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-amber-900/60 shadow-md bg-amber-950/20">
          <span className="text-[11px] font-bold text-amber-400 block mb-1">Kwarantanna</span>
          <span className="text-2xl font-black text-amber-300">{quarantined}</span>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Zabezpieczone</span>
        </div>
      </div>

      {/* Key Events & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            {reportType === 'daily' ? 'Najważniejsze Wydarzenia Dnia' : 'Kluczowe Sprawy Tygodnia'}
          </h3>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Odebrano i zabezpieczono urzędowe wezwanie sądowe na 15 listopada (godz. 10:30, sala 204).</span>
            </li>
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Zablokowano próbę kradzieży danych logowania podszywającą się pod bank iPKO w kwarantannie.</span>
            </li>
            <li className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Zarejestrowano status doręczenia paczki Temu do Paczkomatu InPost.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Rekomendowane Działania Jarvisa
          </h3>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-2">
              <span className="font-bold text-cyan-300 shrink-0">1.</span>
              <span>Zatwierdź przygotowaną odpowiedź dla Marka Kamińskiego dotyczącą notatek i architektury.</span>
            </li>
            <li className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-2">
              <span className="font-bold text-cyan-300 shrink-0">2.</span>
              <span>Potwierdź dodanie terminu posiedzenia sądu (15 listopada) do kalendarza z przypomnieniem 7 i 3 dni wcześniej.</span>
            </li>
            <li className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-2">
              <span className="font-bold text-cyan-300 shrink-0">3.</span>
              <span>Sprawdź stan kwarantanny – odizolowano próbę phishingu i zablokowano wykonanie złośliwego załącznika .exe.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
