import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Mail,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  FolderLock,
} from 'lucide-react';
import { UserPreferences, OperatingMode } from '../types';
import { GUARDIAN_LABELS } from '../services/gmail';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  connectedEmail: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  connectedEmail,
}) => {
  const [targetEmail, setTargetEmail] = useState(preferences.targetEmail);
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(preferences.operatingMode);
  const [timeframe, setTimeframe] = useState<7 | 30 | 90 | 0>(preferences.syncTimeframeDays);
  const [quietHours, setQuietHours] = useState(preferences.quietHoursEnabled);
  const [startHour, setStartHour] = useState(preferences.quietHoursStart);
  const [endHour, setEndHour] = useState(preferences.quietHoursEnd);
  const [autoAds, setAutoAds] = useState(preferences.autoQuarantineAds);
  const [autoPhish, setAutoPhish] = useState(preferences.autoQuarantinePhishing);
  const [instantAlerts, setInstantAlerts] = useState(preferences.instantAlertsEnabled);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      targetEmail,
      operatingMode,
      syncTimeframeDays: timeframe,
      quietHoursEnabled: quietHours,
      quietHoursStart: startHour,
      quietHoursEnd: endHour,
      autoQuarantineAds: autoAds,
      autoQuarantinePhishing: autoPhish,
      instantAlertsEnabled: instantAlerts,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Konfiguracja & Bezpieczeństwo AI Mail Guardian
        </h2>
        <p className="text-xs text-slate-400">
          Zarządzaj trybami ochrony, zakresem synchronizacji i architekturą uprawnień.
        </p>
      </div>

      {savedBanner && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Ustawienia zostały pomyślnie zapisane i zastosowane w systemie.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-300">
        {/* Sekcja 1: Konto docelowe & Tryb pracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Docelowe Konto Gmail & Tryb Pracy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Docelowy adres skrzynki (właściciel):</label>
              <input
                type="email"
                required
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Zgodnie z wymaganiami: backend odrzuca połączenia z innego konta niż wskazane powyżej.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Tryb działania systemu:</label>
              <select
                value={operatingMode}
                onChange={e => setOperatingMode(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="OBSERWACYJNY">TRYB 1: OBSERWACYJNY (analiza bez zmian w skrzynce)</option>
                <option value="POLAUTOMATYCZNY">TRYB 2: PÓŁAUTOMATYCZNY (sortowanie wysokiej pewności)</option>
                <option value="AUTOMATYCZNY">TRYB 3: AUTOMATYCZNY (autonomiczna kwarantanna)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Domyślny tryb po instalacji: <strong>OBSERWACYJNY</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Sekcja 2: Zakres Synchronizacji Początkowej (CZĘŚĆ 4) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Zakres Synchronizacji Początkowej
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { val: 7, label: 'Ostatnie 7 dni' },
              { val: 30, label: 'Ostatnie 30 dni (Domyślnie)' },
              { val: 90, label: 'Ostatnie 90 dni' },
              { val: 0, label: 'Cała dostępna historia' },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => setTimeframe(item.val as any)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  timeframe === item.val
                    ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sekcja 3: Godziny Ciszy & Powiadomienia (CZĘŚĆ 12) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Godziny Ciszy & Alerty Krytyczne
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200">Włącz godziny ciszy (Quiet Hours)</span>
                <p className="text-[11px] text-slate-400">
                  Wyciszenie powiadomień w określonych godzinach nocnych.
                </p>
              </div>
              <input
                type="checkbox"
                checked={quietHours}
                onChange={e => setQuietHours(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
            </div>

            {quietHours && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Początek ciszy:</label>
                  <input
                    type="time"
                    value={startHour}
                    onChange={e => setStartHour(e.target.value)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Koniec ciszy:</label>
                  <input
                    type="time"
                    value={endHour}
                    onChange={e => setEndHour(e.target.value)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="font-semibold text-slate-200">Natychmiastowe alerty o krytycznym phishingu</span>
                <p className="text-[11px] text-slate-400">
                  Wyświetlaj natychmiastowe ostrzeżenie przy podszywaniu pod bank lub sąd.
                </p>
              </div>
              <input
                type="checkbox"
                checked={instantAlerts}
                onChange={e => setInstantAlerts(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Sekcja 4: Etykiety Gmail (CZĘŚĆ 9) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-cyan-400" />
            Struktura Etykiet w Gmail
          </h3>
          <p className="text-xs text-slate-400">
            System tworzy i zarządza dedykowanymi etykietami w Twojej skrzynce Gmail:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
            {Object.entries(GUARDIAN_LABELS).map(([key, labelName]) => (
              <div key={key} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{labelName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sekcja 5: Gwarancje Bezpieczeństwa & Architektura (CZĘŚĆ 3, 18) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Gwarancje Bezpieczeństwa Architektury
          </h3>

          <div className="space-y-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Tokeny OAuth w pamięci RAM:</strong> Nigdy nie zapisujemy tokenów w localStorage ani sessionStorage.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Brak uprawnień wysyłania:</strong> Zakres <code>gmail.send</code> nie został dodany do aplikacji.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Zakaz trwałego usuwania:</strong> Aplikacja nie posiada uprawnień do niszczenia korespondencji.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Izolacja Prompt Injection:</strong> Niezaufana treść e-mail jest badana w piaskownicy promptu.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Zapisz Ustawienia</span>
          </button>
        </div>
      </form>
    </div>
  );
};
