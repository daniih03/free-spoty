import React, { useRef, useState } from 'react';
import { Download, Upload, Copy, Check, Sparkles, FileJson } from 'lucide-react';
import {
  exportAllUserData,
  importUserData,
  saveCustomPlaylist,
  addSongToPlaylist,
} from '../../services/storageService';
import { searchSongsMetadata } from '../../services/searchService';
import { ui } from '../../state/ui';
import { Sheet, Spinner, inputClass } from '../UI/Primitives';
import type { Song } from '../../types/music';

/** Ejecuta `fn` sobre `items` con concurrencia limitada, preservando el orden. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export default function ImportExportModal() {
  const [activeTab, setActiveTab] = useState<'spotify' | 'backup'>('spotify');
  const [tracklist, setTracklist] = useState('');
  const [playlistName, setPlaylistName] = useState('Mi Playlist Importada');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    const lines = tracklist
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('http'));
    if (!lines.length && !tracklist.includes('spotify.com')) return;

    setIsImporting(true);
    setStatus('Analizando pistas...');

    let targetName = playlistName.trim() || 'Playlist Importada';
    const url = tracklist.match(/https?:\/\/open\.spotify\.com\/playlist\/\S+/)?.[0];
    if (url) {
      try {
        const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (res.ok) targetName = (await res.json()).title || targetName;
      } catch {
        /* oEmbed opcional */
      }
    }

    try {
      // Búsquedas en paralelo (4 a la vez) en lugar de una a una
      let done = 0;
      setProgress({ done: 0, total: lines.length });
      const found = await mapLimit(lines, 4, async (line) => {
        const songs = await searchSongsMetadata(line).catch(() => [] as Song[]);
        setProgress({ done: ++done, total: lines.length });
        return songs[0];
      });

      const created = saveCustomPlaylist(targetName);
      const matched = found.filter((s): s is Song => !!s);
      matched.forEach((s) => addSongToPlaylist(created.id, s));

      setStatus(`¡Listo! ${matched.length} de ${lines.length} canciones añadidas a "${targetName}".`);
      setTimeout(ui.closeImportExport, 1800);
    } catch {
      setStatus('Ocurrió un error al procesar la lista.');
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportAllUserData()], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `free-spoty-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportAllUserData());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setBackupStatus('No se pudo copiar al portapapeles.');
    }
  };

  const restore = (json: string) => {
    if (importUserData(json)) {
      setBackupStatus('¡Copia de seguridad restaurada! (combinada con tu biblioteca actual)');
      setTimeout(ui.closeImportExport, 1400);
    } else {
      setBackupStatus('Error: el formato JSON no es válido.');
    }
  };

  const tab = (active: boolean) =>
    `flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active ? 'bg-brand-red text-paper' : 'text-mute hover:text-paper'
    }`;

  return (
    <Sheet
      onClose={ui.closeImportExport}
      maxWidth="max-w-lg"
      icon={<Sparkles className="w-5 h-5" />}
      title="Importar & copias de seguridad"
      subtitle="Migra tus canciones favoritas libremente"
    >
      <div className="space-y-5">
        <div className="flex gap-2 p-1 bg-paper/[0.05] rounded-xl border border-line">
          <button onClick={() => setActiveTab('spotify')} className={tab(activeTab === 'spotify')}>
            Importar desde Spotify / lista
          </button>
          <button onClick={() => setActiveTab('backup')} className={tab(activeTab === 'backup')}>
            Copia de seguridad
          </button>
        </div>

        {activeTab === 'spotify' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-paper/80 block mb-1">Nombre de la nueva playlist</label>
              <input value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} className={`${inputClass} text-xs`} />
            </div>
            <div>
              <label className="text-xs font-medium text-paper/80 block mb-1">
                Pega tu lista (una canción por línea, ej: "Artista - Canción"):
              </label>
              <textarea
                rows={6}
                value={tracklist}
                onChange={(e) => setTracklist(e.target.value)}
                placeholder={'The Weeknd - Blinding Lights\nDua Lipa - Houdini\nColdplay - Yellow\nBad Bunny - MONACO'}
                className={`${inputClass} text-xs resize-none font-mono`}
              />
            </div>

            {progress && (
              <div className="h-1.5 rounded-full bg-paper/[0.08] overflow-hidden">
                <div
                  className="h-full bg-brand-red transition-all"
                  style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
                />
              </div>
            )}
            {status && <p className="text-xs text-brand-coral font-medium">{progress ? `Emparejando ${progress.done}/${progress.total}...` : status}</p>}

            <button
              onClick={handleImport}
              disabled={isImporting || !tracklist.trim()}
              className="w-full py-2.5 rounded-xl bg-brand-red hover:bg-brand-lightred text-paper font-semibold text-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <Spinner className="w-3.5 h-3.5 border-2 border-white" />
                  Importando y emparejando audio...
                </>
              ) : (
                'Comenzar importación'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-paper/[0.05] border border-line space-y-2">
              <h4 className="text-xs font-bold text-paper flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-brand-coral" />
                Exportar mis datos
              </h4>
              <p className="text-[11px] text-mute">Copia completa de tus listas, favoritos, historial y ajustes.</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-1.5 rounded-lg bg-paper/[0.08] hover:bg-paper/[0.12] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3 h-3" /> Descargar .json
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-paper/[0.08] hover:bg-paper/[0.12] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-brand-coral" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-paper/[0.05] border border-line space-y-2">
              <h4 className="text-xs font-bold text-paper flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-brand-rose" />
                Restaurar copia de seguridad
              </h4>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-2 rounded-lg border border-dashed border-paper/20 hover:border-brand-coral/60 text-xs text-paper/80 hover:text-paper flex items-center justify-center gap-2 transition-colors"
              >
                <FileJson className="w-3.5 h-3.5" /> Elegir archivo .json
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) restore(await file.text());
                  e.target.value = '';
                }}
              />
              <textarea
                rows={3}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="…o pega aquí el contenido JSON"
                className={`${inputClass} text-xs resize-none font-mono`}
              />
              {backupStatus && <p className="text-xs text-brand-rose font-medium">{backupStatus}</p>}
              <button
                onClick={() => restore(jsonInput.trim())}
                disabled={!jsonInput.trim()}
                className="w-full py-2 rounded-lg bg-brand-red/20 hover:bg-brand-red/30 text-brand-coral border border-brand-red/30 text-xs font-semibold transition-colors disabled:opacity-40"
              >
                Restaurar backup
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
