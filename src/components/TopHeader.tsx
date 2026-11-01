import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { SyncStatus, OperatingMode } from '../types';
import { voiceSynthesizer } from '../services/voice';

interface TopHeaderProps {
  mode: OperatingMode;
  onChangeMode: (newMode: OperatingMode) => void;
  syncStatus: SyncStatus;
  onSync: () => void;
  isSyncing: boolean;
  connectedEmail: string | null;
  onLogin: () => void;
  onLogout: () => void;
  unreadCount: number;
  onOpenMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  mode,
  onChangeMode,
  syncStatus,
  onSync,
  isSyncing,
  connectedEmail,
  onLogin,
  onLogout,
  unreadCount,
  onOpenMenu,
}) => {
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  const toggleStopVoice = () => {
    if (voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setIsVoiceSpeaking(false);
    } else {
      voiceSynthesizer.testVoice().then(() => setIsVoiceSpeaking(false));
      setIsVoiceSpeaking(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 h-16 flex items-center justify-between shadow-lg">
      {/* Brand & Status */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Otwórz menu modułów"
            aria-label="Menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-cyan-400 rounded-full" />
              <span className="w-full h-0.5 bg-cyan-400 rounded-full" />
              <span className="w-3/4 h-0.5 bg-cyan-400 rounded-full" />
            </div>
          </button>
        )}

        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-cyan-950/50 shrink-0 border border-cyan-500/30">
          <Sparkles className="w-5 h-5 text-cyan-200" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-sm sm:text-base text-white tracking-tight leading-tight">
              AlekSafeMail
            </h1>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase tracking-wider">
              Jarvis AI
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'Chroniony' || syncStatus === 'Połączono'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : syncStatus === 'Synchronizowanie' || syncStatus === 'Analizowanie'
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium text-slate-300">
              {connectedEmail ? connectedEmail : 'akossakowski18@gmail.com'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice control button */}
        <button
          onClick={toggleStopVoice}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          title="Przetestuj lub zatrzymaj syntezę głosu Jarvisa"
          aria-label="Głos Jarvisa"
        >
          {isVoiceSpeaking ? (
            <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          )}
          <span className="hidden md:inline text-slate-300">Głos</span>
        </button>

        {/* Sync button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors text-xs font-semibold disabled:opacity-50 shadow-xs"
          title="Odśwież pocztę z Gmail"
          aria-label="Synchronizuj pocztę"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-slate-300">{isSyncing ? 'Skanowanie...' : 'Synchronizuj'}</span>
        </button>

        {/* Profile / Login */}
        {connectedEmail ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md border border-cyan-400/30">
              {connectedEmail[0].toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Wyloguj konto"
              aria-label="Wyloguj"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Połącz Gmail</span>
          </button>
        )}
      </div>
    </header>
  );
};
