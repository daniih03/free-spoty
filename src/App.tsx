import React, { useState, useEffect } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { BottomPlayer } from './components/Player/BottomPlayer';
import { LyricsView } from './components/Player/LyricsView';
import { QueueDrawer } from './components/Player/QueueDrawer';
import { EqualizerModal } from './components/Player/EqualizerModal';
import { ImportExportModal } from './components/Views/ImportExportModal';
import { AmbientBackground } from './components/UI/AmbientBackground';
import { HomeView } from './components/Views/HomeView';
import { SearchView } from './components/Views/SearchView';
import { PlaylistView } from './components/Views/PlaylistView';
import { LibraryView } from './components/Views/LibraryView';
import { ArtistView } from './components/Views/ArtistView';
import { MobileNav } from './components/Navigation/MobileNav';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { FEATURED_PLAYLISTS } from './services/exploreData';
import { getCustomPlaylists, getLikedSongs, getPlayHistory } from './services/storageService';
import { Playlist } from './types/music';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'library' | 'liked' | 'history' | 'playlist' | 'artist'>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewHistory, setViewHistory] = useState<{ view: string; id?: string }[]>([]);

  // Auto-reload on any new deployment detected across all devices
  useEffect(() => {
    let clientVer: number | null = null;
    const checkDeploy = async () => {
      try {
        const res = await fetch(`./version.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            if (clientVer === null) {
              clientVer = data.version;
            } else if (clientVer !== data.version) {
              console.log('[Free-Spoty] Nueva versión desplegada detectada. Recargando automáticamente...');
              window.location.reload();
            }
          }
        }
      } catch {}
    };

    checkDeploy();
    const timer = setInterval(checkDeploy, 15000); // Check every 15s
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkDeploy();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Modals state
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Keyboard shortcuts integration
  useKeyboardShortcuts({
    onToggleLyrics: () => setIsLyricsOpen((prev) => !prev),
    onFocusSearch: () => {
      setCurrentView('search');
      const input = document.querySelector('header input') as HTMLInputElement | null;
      input?.focus();
    },
  });

  const navigateTo = (view: string, id?: string) => {
    const previousId =
      currentView === 'playlist'
        ? selectedPlaylistId || undefined
        : currentView === 'artist'
        ? selectedArtistName || undefined
        : undefined;

    setViewHistory((prev) => [...prev, { view: currentView, id: previousId }]);

    if (view === 'playlist') {
      setSelectedPlaylistId(id || null);
      setSelectedArtistName(null);
      setCurrentView('playlist');
    } else if (view === 'artist') {
      setSelectedArtistName(id || null);
      setSelectedPlaylistId(null);
      setCurrentView('artist');
    } else {
      setSelectedPlaylistId(null);
      setSelectedArtistName(null);
      setCurrentView(view as any);
    }
  };

  const handleGoBack = () => {
    if (viewHistory.length === 0) return;
    const last = viewHistory[viewHistory.length - 1];
    setViewHistory((prev) => prev.slice(0, -1));

    if (last.view === 'playlist') {
      setSelectedPlaylistId(last.id || null);
      setSelectedArtistName(null);
      setCurrentView('playlist');
    } else if (last.view === 'artist') {
      setSelectedArtistName(last.id || null);
      setSelectedPlaylistId(null);
      setCurrentView('artist');
    } else {
      setSelectedPlaylistId(null);
      setSelectedArtistName(null);
      setCurrentView(last.view as any);
    }
  };

  const handleNavigateArtist = (artistName: string) => {
    navigateTo('artist', artistName);
  };

  // Helper to construct virtual playlists for Liked and History views
  const getPlaylistForCurrentView = (): Playlist => {
    if (currentView === 'liked') {
      const likedSongs = getLikedSongs();
      return {
        id: 'liked-songs',
        name: 'Tus Me Gusta',
        description: 'Colección de todas las canciones que has marcado con un corazón.',
        coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
        songs: likedSongs,
        isCustom: false,
      };
    }

    if (currentView === 'history') {
      const historySongs = getPlayHistory();
      return {
        id: 'history-songs',
        name: 'Historial de Reproducción',
        description: 'Tus canciones reproducidas recientemente.',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        songs: historySongs,
        isCustom: false,
      };
    }

    if (selectedPlaylistId) {
      // Check in featured first
      const featured = FEATURED_PLAYLISTS.find((p) => p.id === selectedPlaylistId);
      if (featured) return featured;

      // Check in custom
      const custom = getCustomPlaylists().find((p) => p.id === selectedPlaylistId);
      if (custom) return custom;
    }

    // Default fallback
    return FEATURED_PLAYLISTS[0];
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-black text-white select-none">
      {/* Dynamic Ambient Background */}
      <AmbientBackground />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Sidebar (Hidden on mobile, 100% visible on desktop) */}
        <Sidebar
          currentView={currentView === 'playlist' ? `playlist_${selectedPlaylistId}` : currentView}
          onNavigate={(view, playlistId) => navigateTo(view, playlistId)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Navbar */}
          <TopNavbar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (currentView !== 'search') setCurrentView('search');
            }}
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            canGoBack={viewHistory.length > 0}
            onGoBack={handleGoBack}
          />

          {/* View Container with custom scroll & bottom padding for player/nav */}
          <div className="flex-1 overflow-y-auto pb-36 md:pb-28 scrollbar-thin">
            {currentView === 'home' && (
              <HomeView onSelectPlaylist={(id) => navigateTo('playlist', id)} />
            )}

            {currentView === 'search' && (
              <SearchView
                query={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onNavigateArtist={handleNavigateArtist}
              />
            )}

            {currentView === 'library' && (
              <LibraryView
                onSelectPlaylist={(id) => navigateTo('playlist', id)}
                onNavigateLiked={() => navigateTo('liked')}
                onNavigateHistory={() => navigateTo('history')}
                onOpenImportExport={() => setIsImportExportOpen(true)}
              />
            )}

            {(currentView === 'playlist' || currentView === 'liked' || currentView === 'history') && (
              <PlaylistView
                playlist={getPlaylistForCurrentView()}
                onNavigateHome={() => navigateTo('home')}
                onNavigateArtist={handleNavigateArtist}
              />
            )}

            {currentView === 'artist' && selectedArtistName && (
              <ArtistView
                artistName={selectedArtistName}
                onNavigateBack={handleGoBack}
                onNavigateArtist={handleNavigateArtist}
              />
            )}
          </div>
        </main>
      </div>

      {/* Bottom Player: Desktop bar on desktop, Mini-player + Sheet on mobile */}
      <BottomPlayer
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        isLyricsOpen={isLyricsOpen}
        isQueueOpen={isQueueOpen}
        onNavigateArtist={handleNavigateArtist}
      />

      {/* Mobile Bottom Navigation (Hidden on desktop) */}
      <MobileNav
        currentView={currentView}
        onNavigate={(v) => navigateTo(v)}
      />

      {/* Modals & Overlays */}
      <LyricsView
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        onNavigateArtist={handleNavigateArtist}
      />

      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
};

export default App;
