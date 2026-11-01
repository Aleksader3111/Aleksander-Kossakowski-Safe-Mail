import React from 'react';
import {
  Sparkles,
  Inbox,
  Flame,
  CheckSquare,
  Menu,
} from 'lucide-react';

interface BottomNavBarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenMore: () => void;
  urgentCount: number;
  openTasksCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onSelectView,
  onOpenMore,
  urgentCount,
  openTasksCount,
}) => {
  const tabs = [
    { id: 'jarvis', label: 'Jarvis', icon: Sparkles, badge: 0 },
    { id: 'skrzynka', label: 'Skrzynka', icon: Inbox, badge: 0 },
    { id: 'priorytety', label: 'Priorytety', icon: Flame, badge: urgentCount, badgeColor: 'bg-rose-500' },
    { id: 'zadania', label: 'Zadania', icon: CheckSquare, badge: openTasksCount, badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 pb-safe-offset-1 pt-1.5 md:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectView(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[48px] rounded-xl relative transition-all active:scale-95 cursor-pointer ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-cyan-400' : 'stroke-[1.8px]'}`} />
                {tab.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2 px-1.5 min-w-[16px] h-4 rounded-full text-[10px] text-white font-bold flex items-center justify-center ${
                      tab.badgeColor || 'bg-cyan-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[48px] rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition-all cursor-pointer ${
            ['dashboard', 'kalendarz', 'kontakty', 'kwarantanna', 'zagrozenia', 'raporty', 'ustawienia', 'test-runner'].includes(currentView)
              ? 'text-cyan-400 font-bold'
              : ''
          }`}
          aria-label="Więcej modułów"
        >
          <Menu className="w-5 h-5 stroke-[1.8px]" />
          <span className="text-[11px] mt-1 tracking-tight">Więcej</span>
        </button>
      </div>
    </nav>
  );
};
