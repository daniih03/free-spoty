import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import type { ViewType } from '../../hooks/useNavigation';

interface MobileNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const TABS: { id: ViewType; label: string; icon: typeof Home; also?: ViewType[] }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'search', label: 'Buscar', icon: Search, also: ['artist'] },
  { id: 'library', label: 'Biblioteca', icon: Library, also: ['liked', 'history', 'playlist'] },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-[calc(64px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-gradient-to-t from-ink via-ink/95 to-ink/80 backdrop-blur-xl flex items-stretch select-none touch-manipulation">
    {TABS.map(({ id, label, icon: Icon, also }) => {
      const active = currentView === id || !!also?.includes(currentView);
      return (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={active ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
            active ? 'text-paper' : 'text-faint'
          }`}
        >
          <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 1.8} />
          <span className="text-[11px] font-medium">{label}</span>
        </button>
      );
    })}
  </nav>
);
