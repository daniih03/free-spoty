import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import type { ViewType } from '../../hooks/useNavigation';

interface MobileNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const TABS: { id: ViewType; label: string; icon: React.ReactNode; also?: ViewType[] }[] = [
  { id: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
  { id: 'search', label: 'Buscar', icon: <Search className="w-5 h-5" />, also: ['artist'] },
  { id: 'library', label: 'Tu biblioteca', icon: <Library className="w-5 h-5" />, also: ['liked', 'history', 'playlist'] },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 h-[calc(60px+env(safe-area-inset-bottom,0px))] bg-[#0e0e11]/95 backdrop-blur-xl border-t border-white/10 z-30 flex items-center justify-around px-2 select-none pb-[env(safe-area-inset-bottom,0px)] touch-manipulation">
    {TABS.map((tab) => {
      const isActive = currentView === tab.id || !!tab.also?.includes(currentView);
      return (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors active:scale-95 ${
            isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span
            className={`transition-transform duration-200 ${
              isActive ? 'scale-110 text-brand-coral drop-shadow-[0_0_8px_rgba(255,59,36,0.5)]' : ''
            }`}
          >
            {tab.icon}
          </span>
          <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-brand-coral font-bold' : ''}`}>{tab.label}</span>
        </button>
      );
    })}
  </nav>
);
