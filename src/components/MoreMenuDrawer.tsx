import React from 'react';
import {
  X,
  LayoutDashboard,
  Calendar,
  FolderLock,
  AlertOctagon,
  Users,
  History,
  ShieldCheck,
  BarChart3,
  Settings,
  FlaskConical,
  Radio,
  Building2,
  Landmark,
  UserCheck,
  ShoppingBag,
  Megaphone,
  Mail,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface MoreMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: string) => void;
  currentView: string;
  quarantineCount: number;
  threatsCount: number;
}

export const MoreMenuDrawer: React.FC<MoreMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectView,
  currentView,
  quarantineCount,
  threatsCount,
}) => {
  if (!isOpen) return null;

  const navigateTo = (view: string) => {
    onSelectView(view);
    onClose();
  };

  const sections = [
    {
      title: 'Centrum Operacyjne & Czas',
      items: [
        { id: 'dashboard', label: 'Dashboard Analityczny', icon: LayoutDashboard },
        { id: 'kalendarz', label: 'Kalendarz & Terminy', icon: Calendar },
        { id: 'kontakty', label: 'Historia Kontaktów', icon: Users },
        { id: 'raporty', label: 'Raporty & Podsumowania', icon: BarChart3 },
      ],
    },
    {
      title: 'Kategorie Poczty',
      items: [
        { id: 'instytucje', label: 'Instytucje & Sądy', icon: Building2 },
        { id: 'banki', label: 'Banki & Finanse', icon: Landmark },
        { id: 'osobiste', label: 'Poczta Osobista', icon: UserCheck },
        { id: 'zakupy', label: 'Zakupy & Dostawy', icon: ShoppingBag },
        { id: 'reklamy', label: 'Reklamy i Oferty', icon: Megaphone },
        { id: 'newslettery', label: 'Newslettery', icon: Mail },
        { id: 'spam', label: 'Spam', icon: AlertTriangle },
      ],
    },
    {
      title: 'Cyberbezpieczeństwo',
      items: [
        { id: 'kwarantanna', label: 'Kwarantanna', icon: FolderLock, badge: quarantineCount, badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-800/60' },
        { id: 'zagrozenia', label: 'Centrum Zagrożeń (A-E)', icon: AlertOctagon, badge: threatsCount, badgeColor: 'bg-rose-950/80 text-rose-300 border border-rose-800/60' },
        { id: 'zaufani', label: 'Zaufani Nadawcy', icon: ShieldCheck },
        { id: 'audyt', label: 'Historia Działań (Audyt)', icon: History },
      ],
    },
    {
      title: 'System & Diagnostyka',
      items: [
        { id: 'ustawienia', label: 'Ustawienia Jarvisa & Głos', icon: Settings },
        { id: 'test-runner', label: 'Suita Testów (60 Aspektów)', icon: FlaskConical },
        { id: 'test-gmail', label: 'Test Prawdziwego Gmail', icon: Radio },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-slate-950 text-slate-200 h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-800"
        style={{ animation: 'slideLeft 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>AlekSafeMail</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                Wszystkie moduły
              </span>
            </h3>
            <p className="text-xs text-slate-400">Wybierz moduł lub kategorię skrzynki</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Zamknij menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                {sec.title}
              </span>
              <div className="space-y-1">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/80'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center text-[11px] text-slate-500 bg-slate-900/60">
          AlekSafeMail – Jarvis Mail Intelligence v2.5
        </div>
      </div>
    </div>
  );
};
