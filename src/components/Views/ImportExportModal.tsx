import React, { useState } from 'react';
import {
  exportAllUserData,
  importUserData,
  saveCustomPlaylist,
  addSongToPlaylist,
} from '../../services/storageService';
import { searchSongsMetadata } from '../../services/searchService';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  Music,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'spotify' | 'backup'>('spotify');
  const [spotifyInput, setSpotifyInput] = useState('');
  const [playlistName, setPlaylistName] = useState('Mi Playlist Importada');
  const [isImportingSpotify, setIsImportingSpotify] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Spotify / Text Tracklist import
  const handleImportSpotify = async () => {
    if (!spotifyInput.trim()) return;
    setIsImportingSpotify(true);
    setImportStatus('Analizando pistas...');

    try {
      const lines = spotifyInput
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !l.startsWith('http'));

      // If user pasted a Spotify URL, attempt to fetch oembed title or parse
      let targetName = playlistName.trim() || 'Playlist Importada';
      if (spotifyInput.includes('spotify.com/playlist/')) {
        try {
          const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyInput.trim())}`);
          if (res.ok) {
            const data = await res.json();
            if (data.title) targetName = data.title;
          }
        } catch {
          // ignore
        }
      }

      const created = saveCustomPlaylist(targetName);
      let count = 0;

      // Search and add songs
      for (const line of lines) {
        setImportStatus(`Buscando: ${line.slice(0, 30)}...`);
        const found = await searchSongsMetadata(line);
        if (found && found.length > 0) {
          addSongToPlaylist(created.id, found[0]);
          count++;
        }
      }

      setImportStatus(`¡Listo! Se añadieron ${count} canciones a "${targetName}".`);
      setTimeout(() => {
        setIsImportingSpotify(false);
        onClose();
      }, 1500);
    } catch (e) {
      setImportStatus('Ocurrió un error al procesar la lista.');
      setIsImportingSpotify(false);
    }
  };

  // Export JSON Backup
  const handleDownloadBackup = () => {
    const data = exportAllUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `free-spoty-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBackup = () => {
    const data = exportAllUserData();
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestoreJson = () => {
    if (!jsonInput.trim()) return;
    const ok = importUserData(jsonInput.trim());
    if (ok) {
      setBackupStatus('¡Copia de seguridad restaurada con éxito!');
      setTimeout(() => {
        setBackupStatus(null);
        onClose();
      }, 1200);
    } else {
      setBackupStatus('Error: Formato JSON no válido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-brand-green">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Importar & Copias de Seguridad</h2>
              <p className="text-xs text-zinc-400">Migra tus canciones favoritas libremente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('spotify')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'spotify'
                ? 'bg-brand-green text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Importar desde Spotify / Lista
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'backup'
                ? 'bg-brand-green text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Copia de Seguridad JSON
          </button>
        </div>

        {/* Tab 1: Spotify / Text Importer */}
        {activeTab === 'spotify' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Nombre de la nueva playlist
              </label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Pega tu lista de canciones (un tema por línea, ej: "Artista - Canción"):
              </label>
              <textarea
                rows={5}
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
                placeholder="Ejemplo:
The Weeknd - Blinding Lights
Dua Lipa - Houdini
Coldplay - Yellow
Bad Bunny - MONACO"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green resize-none font-mono"
              />
            </div>

            {importStatus && (
              <p className="text-xs text-emerald-400 font-medium animate-pulse">{importStatus}</p>
            )}

            <button
              onClick={handleImportSpotify}
              disabled={isImportingSpotify || !spotifyInput.trim()}
              className="w-full py-2.5 rounded-xl bg-brand-green text-black font-semibold text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isImportingSpotify ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Importando y emparejando audio...
                </>
              ) : (
                'Comenzar Importación'
              )}
            </button>
          </div>
        )}

        {/* Tab 2: JSON Backup */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-brand-green" />
                Exportar mis datos
              </h4>
              <p className="text-[11px] text-zinc-400">
                Guarda una copia completa de tus listas, me gusta e historial para no perder nada.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDownloadBackup}
                  className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3 h-3" /> Descargar archivo .json
                </button>
                <button
                  onClick={handleCopyBackup}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-brand-green" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Restaurar copia de seguridad
              </h4>
              <textarea
                rows={3}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Pega el contenido JSON de tu copia de seguridad aquí..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green resize-none font-mono"
              />
              {backupStatus && (
                <p className="text-xs text-cyan-400 font-medium">{backupStatus}</p>
              )}
              <button
                onClick={handleRestoreJson}
                disabled={!jsonInput.trim()}
                className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors disabled:opacity-40"
              >
                Restaurar Backup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
