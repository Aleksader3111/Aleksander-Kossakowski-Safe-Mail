import React, { useState } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Bell,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { OperatingMode, SyncStatus } from '../types';

interface HeaderProps {
  mode: OperatingMode;
  onChangeMode: (newMode: OperatingMode) => void;
  syncStatus: SyncStatus;
  onSync: () => void;
  isSyncing: boolean;
  connectedEmail: string | null;
  onLogin: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  unreadAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onChangeMode,
  syncStatus,
  onSync,
  isSyncing,
  connectedEmail,
  onLogin,
  onLogout,
  theme,
  onToggleTheme,
  unreadAlertsCount,
}) => {
  const [showModeConfirmModal, setShowModeConfirmModal] = useState<OperatingMode | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleModeClick = (selected: OperatingMode) => {
    if (selected === 'AUTOMATYCZNY' && mode !== 'AUTOMATYCZNY') {
      setShowModeConfirmModal('AUTOMATYCZNY');
    } else {
      onChangeMode(selected);
    }
  };

  const confirmSwitchToAutomatic = () => {
    if (showModeConfirmModal) {
      onChangeMode(showModeConfirmModal);
      setShowModeConfirmModal(null);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mode switcher */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Tryb pracy:</span>
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => handleModeClick('OBSERWACYJNY')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === 'OBSERWACYJNY'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Obserwacyjny
          </button>
          <button
            onClick={() => handleModeClick('POLAUTOMATYCZNY')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === 'POLAUTOMATYCZNY'
                ? 'bg-blue-600 text-white shadow-md font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Półautomatyczny
          </button>
          <button
            onClick={() => handleModeClick('AUTOMATYCZNY')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === 'AUTOMATYCZNY'
                ? 'bg-emerald-600 text-white shadow-md font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Automatyczny
          </button>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          title="Odśwież i przeanalizuj skrzynkę"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Synchronizowanie...' : 'Synchronizuj'}</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 relative border border-slate-700"
            aria-label="Powiadomienia"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="font-bold text-white">Alerty bezpieczeństwa</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-medium">
                  {unreadAlertsCount} aktywne
                </span>
              </div>
              <div className="py-2 space-y-2">
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Krytyczny phishing zablokowany
                  </div>
                  <p className="text-[11px] text-red-200/80 mt-0.5">
                    Wykryto podszywanie się pod bank iPKO i próbę wyłudzenia haseł.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Niebezpieczny załącznik .exe
                  </div>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Zatrzymano fałszywą fakturę ukrywającą plik wykonywalny w kwarantannie.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full mt-1 text-center py-1 text-slate-400 hover:text-white"
              >
                Zamknij
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          aria-label="Zmień motyw"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Google Auth Status / Login */}
        {connectedEmail ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs shadow">
              {connectedEmail[0].toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-none truncate max-w-[130px]">
                {connectedEmail}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Połączono z Gmail</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
              title="Odłącz konto i wyloguj"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-md transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Połącz Gmail</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal for Automatic Mode (CZĘŚĆ 11) */}
      {showModeConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Aktywacja Trybu Automatycznego</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              W trybie automatycznym AI Mail Guardian będzie samodzielnie segregować jednoznaczny phishing, niebezpieczny malware oraz agresywne reklamy do folderu <strong>Kwarantanna</strong>.
            </p>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 mb-5 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4" />
                <span>Zero trwałego usuwania – wiadomości zostają na koncie</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <Check className="w-4 h-4" />
                <span>Wszystkie operacje są w 100% odwracalne</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Pisma urzędowe i bankowe są objęte szczególną procedurą</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModeConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Anuluj
              </button>
              <button
                onClick={confirmSwitchToAutomatic}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
              >
                Potwierdzam i uruchamiam
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
