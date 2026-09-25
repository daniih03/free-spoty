import React, { memo, useEffect } from 'react';
import { X } from 'lucide-react';
import { artwork, onImageError } from '../../lib/images';

// ---------------------------------------------------------------------------
// Cover: carátula dimensionada + lazy + fallback universal
// ---------------------------------------------------------------------------

interface CoverProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | undefined;
  /** Tamaño en px a solicitar al CDN (≈ tamaño pintado × 2 por DPR). */
  size: number;
  eager?: boolean;
}

export const Cover = memo(function Cover({ src, size, eager, alt = '', className = '', ...rest }: CoverProps) {
  return (
    <img
      src={artwork(src, size)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={onImageError}
      className={`object-cover bg-lacquer ${className}`}
      {...rest}
    />
  );
});

// ---------------------------------------------------------------------------
// Record: vinilo real (disco con surcos, carátula como etiqueta, eje de latón)
// ---------------------------------------------------------------------------

interface RecordProps {
  src: string | undefined;
  /** px a pedir para la etiqueta (≈ 40% del disco × DPR). */
  size: number;
  isPlaying: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

export function Record({ src, size, isPlaying, className = '', children, onClick, title }: RecordProps) {
  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative flex-shrink-0 rounded-full ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="record absolute inset-0 vinyl-spin" data-playing={isPlaying}>
        <div className="record-label">
          <Cover src={src} size={size} eager className="w-full h-full" />
        </div>
      </div>
      <div className="record-sheen" />
      <div className="record-spindle" />
      {children}
    </div>
  );
}

/** Compatibilidad con el nombre anterior. */
export const Vinyl = Record;

// ---------------------------------------------------------------------------
// Sleeve: funda (carátula) de la que sale el vinilo al reproducir
// ---------------------------------------------------------------------------

interface SleeveProps {
  src: string | undefined;
  size: number;
  isPlaying: boolean;
  className?: string;
  coverClassName?: string;
  /** Cuánto sale el disco (CSS, relativo al ancho). */
  slide?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  title?: string;
  alt?: string;
}

export function Sleeve({
  src,
  size,
  isPlaying,
  className = '',
  coverClassName = 'rounded-lg',
  slide = '42%',
  children,
  onClick,
  title,
  alt = '',
}: SleeveProps) {
  return (
    <div
      className={`sleeve flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      data-playing={isPlaying}
      style={{ '--slide': slide } as React.CSSProperties}
      onClick={onClick}
      title={title}
    >
      <div className="sleeve-record">
        <Record src={src} size={Math.round(size * 0.5)} isPlaying={isPlaying} className="w-full h-full" />
      </div>
      <div className={`relative w-full h-full overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.9)] ${coverClassName}`}>
        <Cover src={src} size={size} eager alt={alt} className="w-full h-full" />
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------------

export function Spinner({ className = 'w-4 h-4 border-2 border-paper' }: { className?: string }) {
  return <span className={`inline-block rounded-full border-t-transparent animate-spin ${className}`} />;
}

/** Ecualizador de 3 barras (solo transform → sin reflow). */
export function SoundBars({ className = 'h-3.5 text-brand-coral' }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[2px] ${className}`} aria-label="Reproduciendo">
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sheet: modal centrado en escritorio y "bottom sheet" nativo en móvil
// ---------------------------------------------------------------------------

interface SheetProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  zIndex?: string;
  className?: string;
}

export function Sheet({
  onClose,
  children,
  maxWidth = 'max-w-md',
  title,
  subtitle,
  icon,
  zIndex = 'z-[60]',
  className = '',
}: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/70 backdrop-blur-md animate-fadeIn touch-manipulation`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} bg-lacquer border-t sm:border border-line rounded-t-[28px] sm:rounded-[24px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-7 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-7 animate-slide-up sm:animate-scale-up ${className}`}
      >
        <div className="w-10 h-1 bg-paper/20 rounded-full mx-auto mb-4 sm:hidden" />

        {(title || icon) && (
          <div className="relative flex items-center gap-3.5 mb-6 pr-10">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-brand-red/15 text-brand-coral flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="font-display text-xl font-bold text-paper tracking-tight truncate">{title}</h3>}
              {subtitle && <p className="text-[13px] text-mute">{subtitle}</p>}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-mute hover:text-paper rounded-full hover:bg-paper/10 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-2.5 bg-ink/60 border border-line rounded-xl text-sm text-paper placeholder-faint focus:outline-none focus:border-brand-coral/60 focus:ring-2 focus:ring-brand-coral/15 transition-all';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-red hover:bg-brand-lightred text-paper font-semibold text-[13px] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none';
