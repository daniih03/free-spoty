import React, { useEffect, useState } from 'react';
import { Sliders, Moon, Gauge, Key, Check, Sparkles, Server, ShieldCheck, Info } from 'lucide-react';
import { usePlayer, playerActions } from '../../state/player';
import { ui } from '../../state/ui';
import {
  EQ_PRESETS,
  getCustomApiKey,
  setCustomApiKey,
  getCustomBackendUrl,
  setCustomBackendUrl,
} from '../../services/config';
import { getSettings, updateSettings } from '../../services/storageService';
import { youtubeService } from '../../services/youtube';
import { Sheet, inputClass } from '../UI/Primitives';


const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5];

const TIMER_OPTIONS: { label: string; value: number | 'end' | null }[] = [
  { label: 'Desactivado', value: null },
  { label: 'Fin de canción', value: 'end' },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
];

function SleepCountdown({ endsAt }: { endsAt: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  return (
    <span className="text-xs text-brand-coral font-mono font-bold animate-pulse tabular-nums">
      {Math.floor(secs / 60)}:{(secs % 60).toString().padStart(2, '0')}
    </span>
  );
}

export default function EqualizerModal() {
  const playbackRate = usePlayer((s) => s.playbackRate);
  const sleepEndsAt = usePlayer((s) => s.sleepEndsAt);
  const sleepAtTrackEnd = usePlayer((s) => s.sleepAtTrackEnd);

  const [activePreset, setActivePreset] = useState(() => getSettings().eqPreset);
  const [apiKeyInput, setApiKeyInput] = useState(getCustomApiKey);
  const [backendInput, setBackendInput] = useState(getCustomBackendUrl);
  const [saved, setSaved] = useState<'key' | 'backend' | null>(null);
  const hasBackend = !!getCustomBackendUrl();

  const flashSaved = (which: 'key' | 'backend') => {
    setSaved(which);
    setTimeout(() => setSaved(null), 2000);
  };

  const selectPreset = (id: string) => {
    const preset = EQ_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(id);
    updateSettings({ eqPreset: id });
    youtubeService.setEqualizer(preset);
  };

  const timerIsActive = (value: number | 'end' | null) => {
    if (value === null) return sleepEndsAt === null && !sleepAtTrackEnd;
    if (value === 'end') return sleepAtTrackEnd;
    return sleepEndsAt !== null && Math.abs((sleepEndsAt - Date.now()) / 60000 - value) < 1;
  };

  const label = 'text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5';

  return (
    <Sheet onClose={ui.closeEqualizer} title="Ajustes & Ecualizador" subtitle="Personaliza el sonido a tu gusto" icon={<Sliders className="w-5 h-5" />}>
      <div className="space-y-6">
        {/* 1. Ecualizador */}
        <div className="space-y-3">
          <label className={label}>
            <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
            Presets de ecualización
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EQ_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPreset(p.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                  activePreset === p.id
                    ? 'border-brand-red bg-brand-red/15 text-brand-coral font-semibold shadow-md shadow-brand-red/10'
                    : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          {!hasBackend && activePreset !== 'flat' && (
            <p className="text-[11px] text-zinc-500 flex gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-brand-rose" />
              El ecualizador procesa el audio del servidor propio (0 anuncios). Con el reproductor de YouTube el audio
              no es accesible y el preset se aplicará al conectar un servidor.
            </p>
          )}
        </div>

        {/* 2. Velocidad */}
        <div className="space-y-3">
          <label className={label}>
            <Gauge className="w-3.5 h-3.5 text-brand-rose" />
            Velocidad de reproducción ({playbackRate}x)
          </label>
          <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {SPEED_OPTIONS.map((rate) => (
              <button
                key={rate}
                onClick={() => playerActions.setPlaybackRate(rate)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  playbackRate === rate
                    ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white font-bold shadow-md shadow-brand-red/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* 3. Temporizador */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={label}>
              <Moon className="w-3.5 h-3.5 text-brand-blush" />
              Temporizador de apagado
            </label>
            {sleepEndsAt !== null && <SleepCountdown endsAt={sleepEndsAt} />}
            {sleepAtTrackEnd && <span className="text-xs text-brand-coral font-bold">Al terminar</span>}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => playerActions.setSleepTimer(opt.value)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  timerIsActive(opt.value)
                    ? 'bg-brand-red/20 border-brand-red/60 text-brand-coral font-bold'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">
            Los últimos 10 segundos hacen un fundido suave de volumen para que no te despiertes de golpe.
          </p>
        </div>

        {/* 4. Servidor de audio */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className={label}>
              <Server className="w-3.5 h-3.5 text-brand-coral" />
              Servidor de audio (0 anuncios)
            </label>
            {hasBackend && (
              <span className="flex items-center gap-1 text-[11px] text-brand-coral font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Activo
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={backendInput}
              onChange={(e) => setBackendInput(e.target.value)}
              placeholder="https://tu-servidor.fly.dev"
              className={`${inputClass} !py-1.5 !rounded-lg text-xs`}
            />
            <button
              onClick={() => {
                setCustomBackendUrl(backendInput);
                setBackendInput(getCustomBackendUrl());
                flashSaved('backend');
              }}
              className="px-3 py-1.5 rounded-lg bg-brand-red/20 hover:bg-brand-red/30 text-brand-coral text-xs font-semibold flex items-center gap-1 transition-colors border border-brand-red/30"
            >
              {saved === 'backend' ? <Check className="w-3.5 h-3.5" /> : 'Guardar'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Conecta tu micro-backend (carpeta <code>server/</code>) para transmitir audio puro sin anuncios. Evita
            planes con "cold start" (p. ej. Render gratuito).
          </p>
        </div>

        {/* 5. API Key */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className={label}>
            <Key className="w-3.5 h-3.5 text-brand-blush" />
            API Key de YouTube (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Pega tu API Key de Google Cloud..."
              className={`${inputClass} !py-1.5 !rounded-lg text-xs`}
            />
            <button
              onClick={() => {
                setCustomApiKey(apiKeyInput);
                flashSaved('key');
              }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {saved === 'key' ? <Check className="w-3.5 h-3.5 text-brand-coral" /> : 'Guardar'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            No es obligatoria: por defecto Free-Spoty busca de forma libre e instantánea sin configuración.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
