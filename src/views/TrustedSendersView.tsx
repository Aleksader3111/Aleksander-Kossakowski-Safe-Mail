import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Globe,
  Mail,
  AlertTriangle,
  Building2,
  Check,
} from 'lucide-react';
import { TrustedEntity } from '../types';

interface TrustedSendersViewProps {
  trustedEntities: TrustedEntity[];
  onAddEntity: (entity: Omit<TrustedEntity, 'id' | 'addedAt'>) => void;
  onRemoveEntity: (id: string) => void;
}

export const TrustedSendersView: React.FC<TrustedSendersViewProps> = ({
  trustedEntities,
  onAddEntity,
  onRemoveEntity,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'sender' | 'domain'>('domain');
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newTrustLevel, setNewTrustLevel] = useState<'WYSOKI' | 'ŚREDNI' | 'INSTYTUCJA'>('INSTYTUCJA');
  const [alwaysImportant, setAlwaysImportant] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !newLabel.trim()) return;

    onAddEntity({
      type: newType,
      value: newValue.trim().toLowerCase(),
      label: newLabel.trim(),
      trustLevel: newTrustLevel,
      alwaysMarkImportant: alwaysImportant,
    });

    setNewValue('');
    setNewLabel('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Zaufani Nadawcy i Domeny Instytucjonalne
          </h2>
          <p className="text-xs text-slate-400">
            Reguły priorytetowego traktowania sądów, urzędów, banków i stałych kontrahentów.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj zaufany podmiot</span>
        </button>
      </div>

      {/* Safety Warning Principle Banner (CZĘŚĆ 8) */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-300">Zasada Niezależnej Weryfikacji Bezpieczeństwa</h4>
          <p className="leading-relaxed text-[11px] text-amber-200/80">
            Zaufany nadawca <strong>NIE JEST</strong> automatycznie zwolniony z analizy bezpieczeństwa. Jeżeli wiadomość zawiera cechy phishingu lub została wysłana z nieautoryzowanego serwera bez poprawnego SPF/DKIM, system wyemituje ostrzeżenie i odizoluje zagrożenie w kwarantannie, nawet jeśli adres widnieje na liście.
          </p>
        </div>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trustedEntities.map(item => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-md space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  {item.type === 'domain' ? <Globe className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                  {item.type === 'domain' ? 'DOMENA' : 'NADAWCA'}
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.trustLevel === 'INSTYTUCJA'
                      ? 'bg-blue-500/20 text-blue-300'
                      : item.trustLevel === 'WYSOKI'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.trustLevel}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{item.label}</h4>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">{item.value}</p>
              </div>

              {item.alwaysMarkImportant && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Automatycznie oznaczaj jako WAŻNE</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Dodano: {new Date(item.addedAt).toLocaleDateString('pl-PL')}</span>
              <button
                onClick={() => onRemoveEntity(item.id)}
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Usuń z listy zaufanych"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Dodaj Zaufany Podmiot
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Typ podmiotu:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('domain')}
                    className={`py-2 rounded-xl font-medium border ${
                      newType === 'domain'
                        ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Domena (np. gov.pl)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('sender')}
                    className={`py-2 rounded-xl font-medium border ${
                      newType === 'sender'
                        ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Adres e-mail
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {newType === 'domain' ? 'Wartość domeny (np. gov.pl, pkobp.pl):' : 'Dokładny adres e-mail:'}
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  placeholder={newType === 'domain' ? 'gov.pl' : 'kontakt@bank.pl'}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nazwa wyświetlana / etykieta:</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="np. Sąd Rejonowy / Mój Bank"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Poziom zaufania:</label>
                <select
                  value={newTrustLevel}
                  onChange={e => setNewTrustLevel(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="INSTYTUCJA">INSTYTUCJA (Sądy, Policja, Administracja)</option>
                  <option value="WYSOKI">WYSOKI (Banki, operatorzy)</option>
                  <option value="ŚREDNI">ŚREDNI (Zaufani znajomi)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="alwaysImportantCheckbox"
                  checked={alwaysImportant}
                  onChange={e => setAlwaysImportant(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                />
                <label htmlFor="alwaysImportantCheckbox" className="text-slate-300 cursor-pointer">
                  Zawsze oznaczaj jako WAŻNE i wyróżniaj w skrzynce
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md"
                >
                  Zapisz podmiot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
