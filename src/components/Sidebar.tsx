import React from 'react';
import {
  Sparkles,
  Inbox,
  Flame,
  CheckSquare,
  Calendar,
  Users,
  BarChart3,
  LayoutDashboard,
  AlertOctagon,
  FolderLock,
  Bot,
  History,
  ShieldCheck,
  Settings,
  CheckCircle2,
  FlaskConical,
  Radio,
} from 'lucide-react';
import { SyncStatus } from '../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  syncStatus: SyncStatus;
  counts: {
    important: number;
    quarantine: number;
    threats: number;
    total: number;
    openTasks?: number;
    urgentPriorities?: number;
  };
  connectedEmail: string | null;
  onOpenGmailTest: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  syncStatus,
  counts,
  connectedEmail,
  onOpenGmailTest,
}) => {
  const primaryItems = [
    { id: 'jarvis', label: 'Jarvis Asystent', icon: Sparkles, badge: 0 },
    { id: 'skrzynka', label: 'Skrzynka pocztowa', icon: Inbox, count: counts.total },
    { id: 'priorytety', label: 'Priorytety P0–P4', icon: Flame, count: counts.urgentPriorities, badgeColor: 'bg-rose-950/80 text-rose-300 border border-rose-800/60' },
    { id: 'zadania', label: 'Zadania & Follow-upy', icon: CheckSquare, count: counts.openTasks, badgeColor: 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60' },
    { id: 'kalendarz', label: 'Kalendarz & Terminy', icon: Calendar },
    { id: 'kontakty', label: 'Baza kontaktów', icon: Users },
    { id: 'raporty', label: 'Raporty i podsumowania', icon: BarChart3 },
  ];

  const secondaryItems = [
    { id: 'dashboard', label: 'Centrum Bezpieczeństwa', icon: LayoutDashboard },
    { id: 'kwarantanna', label: 'Kwarantanna', icon: FolderLock, count: counts.quarantine, badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-800/60' },
    { id: 'zagrozenia', label: 'Centrum Zagrożeń', icon: AlertOctagon, count: counts.threats, badgeColor: 'bg-rose-950/80 text-rose-300 border border-rose-800/60' },
    { id: 'ai-chat', label: 'Asystent AI Czat', icon: Bot },
    { id: 'audyt', label: 'Dziennik audytu', icon: History },
    { id: 'zaufani', label: 'Zaufane podmioty', icon: ShieldCheck },
    { id: 'ustawienia', label: 'Ustawienia', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex-col shrink-0 min-h-screen shadow-lg">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-700 to-indigo-900 flex items-center justify-center shadow-md border border-cyan-500/30">
          <Sparkles className="w-5 h-5 text-cyan-200" />
        </div>
        <div>
          <h1 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
            AlekSafeMail
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              PRO
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Jarvis Mail Intelligence</p>
        </div>
      </div>

      {/* Connection Quick Badge */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/60">
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'Chroniony' || syncStatus === 'Połączono'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : syncStatus === 'Synchronizowanie' || syncStatus === 'Analizowanie'
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="truncate font-medium text-slate-300 text-[11px]">
              {connectedEmail ? connectedEmail : 'akossakowski18@gmail.com'}
            </span>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-400">
            {syncStatus === 'Chroniony' ? 'AKTYWNY' : syncStatus}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
        <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Asystent & Organizacja
        </div>
        {primaryItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/50 text-cyan-300 border border-cyan-800/50 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Bezpieczeństwo & Ochrona
        </div>
        {secondaryItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/50 text-cyan-300 border border-cyan-800/50 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status & Test Modal Trigger */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-xs space-y-2">
        <button
          onClick={onOpenGmailTest}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 font-bold border border-slate-800 text-xs transition-colors cursor-pointer"
        >
          <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
          <span>Diagnostyka Gmail & AI</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400" />
            Gemini 3.8 Flash
          </span>
          <span className="text-[10px] font-mono text-slate-400">v2.4-PRO</span>
        </div>
      </div>
    </aside>
  );
};
