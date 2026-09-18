import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { getCustomApiKey, setCustomApiKey } from '../../services/searchService';
import { X, Sliders, Moon, Gauge, Key, Check, Sparkles } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { id: 'flat', name: 'Plano (Default)', bass: 0, mid: 0, treble: 0 },
  { id: 'bass', name: 'Bass Boost 💥', bass: 8, mid: 2, treble: -2 },
  { id: 'vocal', name: 'Voz Clara 🎙️', bass: -3, mid: 6, treble: 3 },
  { id: 'electronic', name: 'Electrónica ⚡', bass: 6, mid: 0, treble: 5 },
  { id: 'acoustic', name: 'Acústico 🎸', bass: 3, mid: 4, treble: 4 },
];

const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5];

const TIMER_OPTIONS = [
  { label: 'Desactivado', minutes: null },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hora', minutes: 60 },
];

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const {
    playbackRate,
    setPlaybackRate,
    sleepTimerSeconds,
    setSleepTimer,
  } = usePlayer();

  const [activePreset, setActivePreset] = useState('flat');
  const [apiKeyInput, setApiKeyInput] = useState(getCustomApiKey());
  const [isKeySaved, setIsKeySaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    setCustomApiKey(apiKeyInput);
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-green/20 text-brand-green">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Ajustes & Ecualizador</h2>
              <p className="text-xs text-zinc-400">Personaliza el sonido a tu gusto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Equalizer Presets */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            Presets de Ecualización
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                    isSelected
                      ? 'border-brand-green bg-brand-green/10 text-brand-green font-semibold shadow-md'
                      : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Playback Speed */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            Velocidad de Reproducción ({playbackRate}x)
          </label>
          <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {SPEED_OPTIONS.map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  playbackRate === rate
                    ? 'bg-brand-green text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sleep Timer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              Temporizador de Apagado (Sleep Timer)
            </label>
            {sleepTimerSeconds !== null && (
              <span className="text-xs text-brand-green font-mono font-bold animate-pulse">
                {formatTimer(sleepTimerSeconds)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {TIMER_OPTIONS.map((opt) => {
              const isCurrent =
                (opt.minutes === null && sleepTimerSeconds === null) ||
                (opt.minutes !== null &&
                  sleepTimerSeconds !== null &&
                  Math.abs(sleepTimerSeconds - opt.minutes * 60) < 60);

              return (
                <button
                  key={opt.label}
                  onClick={() => setSleepTimer(opt.minutes)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isCurrent
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-500">
            * Los últimos 10 segundos realizan un fade-out suave de volumen para que no te despiertes de golpe.
          </p>
        </div>

        {/* 4. YouTube API Key (Optional) */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            API Key de YouTube (Opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Pega tu API Key de Google Cloud..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {isKeySaved ? <Check className="w-3.5 h-3.5 text-brand-green" /> : 'Guardar'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            No es obligatoria. Por defecto Free-Spoty busca de manera libre e instantánea sin necesidad de configuración.
          </p>
        </div>
      </div>
    </div>
  );
};
