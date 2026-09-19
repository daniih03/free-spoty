import React from 'react';
import { Home, Search, Library } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'Buscar', icon: <Search className="w-5 h-5" /> },
    { id: 'library', label: 'Tu biblioteca', icon: <Library className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#0e0e11]/95 backdrop-blur-xl border-t border-white/10 z-30 flex items-center justify-around px-2 select-none pb-[env(safe-area-inset-bottom,0px)]">
      {tabs.map((tab) => {
        const isActive =
          currentView === tab.id ||
          (tab.id === 'library' && (currentView === 'liked' || currentView === 'history' || currentView.startsWith('playlist')));

        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-brand-coral drop-shadow-[0_0_8px_rgba(255,59,36,0.5)]' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-brand-coral font-bold' : ''}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
