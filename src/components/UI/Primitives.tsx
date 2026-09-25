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
      className={`object-cover bg-zinc-900 ${className}`}
      {...rest}
    />
  );
});

// ---------------------------------------------------------------------------
// Vinyl: disco circular con orificio central (identidad "Minimalist Studio")
// ---------------------------------------------------------------------------

interface VinylProps {
  src: string | undefined;
  size: number;
  isPlaying: boolean;
  className?: string;
  /** Clases del orificio central. */
  holeClassName?: string;
  grooves?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

export function Vinyl({
  src,
  size,
  isPlaying,
  className = '',
  holeClassName = 'w-3.5 h-3.5',
  grooves = false,
  children,
  onClick,
  title,
}: VinylProps) {
  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative rounded-full overflow-hidden bg-zinc-950 transform-gpu flex-shrink-0 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <Cover src={src} size={size} eager className="w-full h-full vinyl-spin" data-playing={isPlaying} />
      {grooves && (
        <>
          <div className="absolute inset-[6%] rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-[14%] rounded-full border border-white/[0.06] pointer-events-none" />
          <div className="absolute inset-[24%] rounded-full border border-white/[0.04] pointer-events-none" />
        </>
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div
          className={`rounded-full bg-black/90 border border-white/30 flex items-center justify-center shadow-inner ${holeClassName}`}
        >
          <div className="w-1/3 h-1/3 rounded-full bg-[#101119] border border-white/40" />
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------------

export function Spinner({ className = 'w-4 h-4 border-2 border-white' }: { className?: string }) {
  return <span className={`inline-block rounded-full border-t-transparent animate-spin ${className}`} />;
}

/** Soundwave de 3 barras (transform-only → sin reflow). */
export function SoundBars({ className = 'h-3.5' }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[3px] ${className}`} aria-label="Reproduciendo">
      <span className="w-[3px] h-full rounded-full bg-brand-coral origin-bottom animate-eq" />
      <span className="w-[3px] h-full rounded-full bg-brand-red origin-bottom animate-eq [animation-delay:-0.3s]" />
      <span className="w-[3px] h-full rounded-full bg-brand-rose origin-bottom animate-eq [animation-delay:-0.6s]" />
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
      className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn touch-manipulation`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} bg-[#15151c]/95 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-2xl max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-7 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-7 animate-slide-up sm:animate-scale-up ${className}`}
      >
        <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />

        {(title || icon) && (
          <div className="relative flex items-center gap-3 mb-5 pr-10">
            {icon && (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-crimson to-brand-coral flex items-center justify-center text-white shadow-lg shadow-brand-crimson/25 shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-lg font-bold text-white tracking-tight truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
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
  'w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-coral/70 focus:ring-2 focus:ring-brand-coral/20 transition-all';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white font-semibold text-xs shadow-lg shadow-brand-red/25 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
