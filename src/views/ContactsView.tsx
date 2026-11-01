import React, { useState } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Mail,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ContactProfile } from '../types';

interface ContactsViewProps {
  contacts: ContactProfile[];
  onAskJarvisAboutContact: (contact: ContactProfile) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  onAskJarvisAboutContact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const filteredContacts = contacts.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.topics.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Historia Kontaktów & Relacji
              </h2>
              <p className="text-xs text-slate-400">
                Wykaz nadawców, poruszane tematy, powiązane zadania i statusy zaufania
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Szukaj osoby, firmy, tematu..."
            className="pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Contact Cards */}
      <div className="space-y-3">
        {filteredContacts.map(contact => {
          const isExpanded = expandedEmail === contact.email;

          return (
            <div
              key={contact.email}
              className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md space-y-3 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-950 font-black text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/30 text-sm">
                    {contact.name[0] || contact.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{contact.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          contact.trustStatus === 'INSTYTUCJA'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : contact.trustStatus === 'ZAUFANY'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : contact.trustStatus === 'PODEJRZANY'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {contact.trustStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono text-[11px] mt-0.5">{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => onAskJarvisAboutContact(contact)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800/80 transition-colors cursor-pointer"
                    title="Zapytaj Jarvisa o ostatnie ustalenia z tą osobą"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Co z nim ustalałem?</span>
                  </button>

                  <button
                    onClick={() => setExpandedEmail(isExpanded ? null : contact.email)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    aria-label="Rozwiń szczegóły"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Topics Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-slate-500">Tematy:</span>
                {contact.topics.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-800 text-xs space-y-2 bg-slate-950/70 p-3.5 rounded-xl mt-2 animate-fade-in border border-slate-800/80">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Liczba wiadomości: <strong className="text-white">{contact.messageCount}</strong></div>
                    <div>Ostatni kontakt: <strong className="text-white font-mono">{contact.lastContactDate}</strong></div>
                    <div>Powiązane zadania: <strong className="text-cyan-400">{contact.linkedTasksCount}</strong></div>
                    <div>Wykryte terminy: <strong className="text-cyan-400">{contact.linkedDeadlinesCount}</strong></div>
                  </div>

                  {contact.notes && (
                    <p className="text-slate-400 italic text-[11px] pt-1">
                      Notatka: {contact.notes}
                    </p>
                  )}

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">Ostatnia korespondencja:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                      {contact.recentSubjects.map((s, idx) => (
                        <li key={idx} className="truncate">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
