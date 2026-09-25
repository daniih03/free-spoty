import type { Song } from '../types/music';
import { createStore, useStore } from '../lib/store';

/** Estado de paneles y modales. Separado del reproductor para no provocar re-renders cruzados. */
interface UiState {
  lyricsOpen: boolean;
  queueOpen: boolean;
  equalizerOpen: boolean;
  importExportOpen: boolean;
  authModal: 'login' | 'register' | null;
  addToPlaylistSong: Song | null;
  updateAvailable: boolean;
}

export const uiStore = createStore<UiState>({
  lyricsOpen: false,
  queueOpen: false,
  equalizerOpen: false,
  importExportOpen: false,
  authModal: null,
  addToPlaylistSong: null,
  updateAvailable: false,
});

export function useUi<S>(selector: (s: UiState) => S): S {
  return useStore(uiStore, selector);
}

export const ui = {
  openLyrics: () => uiStore.set({ lyricsOpen: true }),
  closeLyrics: () => uiStore.set({ lyricsOpen: false }),
  toggleLyrics: () => uiStore.set((s) => ({ lyricsOpen: !s.lyricsOpen })),
  openQueue: () => uiStore.set({ queueOpen: true }),
  closeQueue: () => uiStore.set({ queueOpen: false }),
  openEqualizer: () => uiStore.set({ equalizerOpen: true }),
  closeEqualizer: () => uiStore.set({ equalizerOpen: false }),
  openImportExport: () => uiStore.set({ importExportOpen: true }),
  closeImportExport: () => uiStore.set({ importExportOpen: false }),
  openAuth: (mode: 'login' | 'register' = 'login') => uiStore.set({ authModal: mode }),
  closeAuth: () => uiStore.set({ authModal: null }),
  openAddToPlaylist: (song: Song) => uiStore.set({ addToPlaylistSong: song }),
  closeAddToPlaylist: () => uiStore.set({ addToPlaylistSong: null }),
};
