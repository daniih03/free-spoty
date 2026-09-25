import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { SmartDock } from './components/Navigation/SmartDock';
import { MobileNav } from './components/Navigation/MobileNav';
import { TopNavbar } from './components/TopNavbar';
import { FloatingPlayer } from './components/Player/FloatingPlayer';
import { AmbientBackground } from './components/UI/AmbientBackground';
import { Spinner } from './components/UI/Primitives';
import HomeView from './components/Views/HomeView';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNavigation, ViewType } from './hooks/useNavigation';
import { useVersionCheck } from './hooks/useVersionCheck';
import { FEATURED_PLAYLISTS } from './services/exploreData';
import { useHistory, useLikedSongs, usePlaylists } from './services/storageService';
import { useUi } from './state/ui';
import { usePlayer } from './state/player';
import type { Playlist } from './types/music';

// Vistas y paneles secundarios en chunks separados: el primer render solo
// descarga lo necesario para Inicio.
const SearchView = lazy(() => import('./components/Views/SearchView'));
const PlaylistView = lazy(() => import('./components/Views/PlaylistView'));
const LibraryView = lazy(() => import('./components/Views/LibraryView'));
const ArtistView = lazy(() => import('./components/Views/ArtistView'));
const LyricsView = lazy(() => import('./components/Player/LyricsView'));
const QueueDrawer = lazy(() => import('./components/Player/QueueDrawer'));
const EqualizerModal = lazy(() => import('./components/Player/EqualizerModal'));
const ImportExportModal = lazy(() => import('./components/Views/ImportExportModal'));
const AuthModal = lazy(() => import('./components/UI/AuthModal'));
const AddToPlaylistModal = lazy(() => import('./components/UI/AddToPlaylistModal'));

const LIKED_COVER = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80';
const HISTORY_COVER = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80';

function ViewFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner className="w-9 h-9 border-2 border-brand-coral" />
    </div>
  );
}

/** Aviso discreto: hay versión nueva y se aplicará al pausar (sin cortar la música). */
function UpdateNotice() {
  const available = useUi((s) => s.updateAvailable);
  const isPlaying = usePlayer((s) => s.isPlaying);
  if (!available || !isPlaying) return null;
  return (
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+64px)] md:top-5 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
      <button
        onClick={() => window.location.reload()}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#15151c]/95 border border-brand-red/40 text-xs text-white shadow-2xl shadow-black/60 backdrop-blur-xl animate-fadeIn"
      >
        <RefreshCw className="w-3.5 h-3.5 text-brand-coral shrink-0" />
        <span>Nueva versión lista · se aplicará al pausar</span>
        <span className="text-brand-coral font-semibold whitespace-nowrap">Actualizar ahora</span>
      </button>
    </div>
  );
}

function Overlays({ onNavigateArtist }: { onNavigateArtist: (name: string) => void }) {
  const lyricsOpen = useUi((s) => s.lyricsOpen);
  const queueOpen = useUi((s) => s.queueOpen);
  const equalizerOpen = useUi((s) => s.equalizerOpen);
  const importExportOpen = useUi((s) => s.importExportOpen);
  const authModal = useUi((s) => s.authModal);
  const addToPlaylistSong = useUi((s) => s.addToPlaylistSong);

  return (
    <Suspense fallback={null}>
      {lyricsOpen && <LyricsView onNavigateArtist={onNavigateArtist} />}
      {queueOpen && <QueueDrawer />}
      {equalizerOpen && <EqualizerModal />}
      {importExportOpen && <ImportExportModal />}
      {authModal && <AuthModal initialMode={authModal} />}
      {addToPlaylistSong && <AddToPlaylistModal key={addToPlaylistSong.id} song={addToPlaylistSong} />}
    </Suspense>
  );
}

const AppContent: React.FC = () => {
  const { route, navigate, goBack, goForward, canGoBack, canGoForward } = useNavigation();
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const likedSongs = useLikedSongs();
  const history = useHistory();
  const playlists = usePlaylists();

  useVersionCheck();
  useKeyboardShortcuts({
    onFocusSearch: () => {
      if (route.view !== 'search') navigate('search');
      searchRef.current?.focus();
    },
  });

  // Precarga en reposo de los chunks más usados: la primera navegación es instantánea
  useEffect(() => {
    const prefetch = () => {
      void import('./components/Views/SearchView');
      void import('./components/Views/PlaylistView');
      void import('./components/Views/ArtistView');
      void import('./components/Player/LyricsView');
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(prefetch);
    else setTimeout(prefetch, 2500);
  }, []);

  // Cada vista nueva empieza arriba
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [route.view, route.id]);

  const go = useCallback((view: ViewType, id?: string) => navigate(view, id), [navigate]);
  const goArtist = useCallback((name: string) => navigate('artist', name), [navigate]);
  const goPlaylist = useCallback((id: string) => navigate('playlist', id), [navigate]);
  const goHome = useCallback(() => navigate('home'), [navigate]);

  const searchQuery = route.view === 'search' ? route.id ?? '' : '';
  const handleSearchChange = useCallback(
    (q: string) => navigate('search', q || undefined, { replace: route.view === 'search' }),
    [navigate, route.view]
  );

  const playlist = useMemo((): Playlist | null => {
    if (route.view === 'liked') {
      return {
        id: 'liked-songs',
        name: 'Tus Me Gusta',
        description: 'Todas las canciones que has marcado con un corazón.',
        coverUrl: likedSongs[0]?.coverUrl || LIKED_COVER,
        songs: likedSongs,
      };
    }
    if (route.view === 'history') {
      return {
        id: 'history-songs',
        name: 'Historial de reproducción',
        description: 'Tus canciones reproducidas recientemente.',
        coverUrl: HISTORY_COVER,
        songs: history,
      };
    }
    if (route.view === 'playlist' && route.id) {
      return FEATURED_PLAYLISTS.find((p) => p.id === route.id) || playlists.find((p) => p.id === route.id) || null;
    }
    return null;
  }, [route, likedSongs, history, playlists]);

  return (
    <div className="relative h-[100dvh] w-full max-w-full overflow-hidden flex flex-col bg-black text-white select-none">
      <AmbientBackground />

      <div className="flex-1 flex overflow-hidden z-10 w-full min-w-0">
        <SmartDock route={route} onNavigate={go} />

        <main className="flex-1 flex flex-col overflow-hidden relative md:pl-[84px] w-full min-w-0">
          <TopNavbar
            ref={searchRef}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            canGoBack={canGoBack}
            onGoBack={goBack}
            canGoForward={canGoForward}
            onGoForward={goForward}
          />

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-[calc(148px+env(safe-area-inset-bottom,0px))] md:pb-32 w-full min-w-0"
          >
            <Suspense fallback={<ViewFallback />}>
              {route.view === 'home' && <HomeView onSelectPlaylist={goPlaylist} onNavigateArtist={goArtist} />}
              {route.view === 'search' && (
                <SearchView query={searchQuery} onSearchChange={handleSearchChange} onNavigateArtist={goArtist} />
              )}
              {route.view === 'library' && (
                <LibraryView
                  onSelectPlaylist={goPlaylist}
                  onNavigateLiked={() => navigate('liked')}
                  onNavigateHistory={() => navigate('history')}
                  onNavigateArtist={goArtist}
                />
              )}
              {(route.view === 'playlist' || route.view === 'liked' || route.view === 'history') && (
                <PlaylistView key={playlist?.id} playlist={playlist} onNavigateHome={goHome} onNavigateArtist={goArtist} />
              )}
              {route.view === 'artist' && route.id && (
                <ArtistView artistName={route.id} onNavigateBack={canGoBack ? goBack : goHome} onNavigateArtist={goArtist} />
              )}
            </Suspense>
          </div>
        </main>
      </div>

      <FloatingPlayer onNavigateArtist={goArtist} />
      <MobileNav currentView={route.view} onNavigate={go} />
      <UpdateNotice />
      <Overlays onNavigateArtist={goArtist} />
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
