import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode with props when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Correo o contraseña incorrectos.');
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMessage('Por favor confirma tu correo electrónico antes de entrar.');
          } else {
            setErrorMessage(error.message);
          }
        } else {
          setSuccessMessage('¡Sesión iniciada con éxito! Sincronizando tu biblioteca...');
          setTimeout(() => {
            closeAuthModal();
          }, 900);
        }
      } else {
        const { error, user } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('User already registered')) {
            setErrorMessage('Este correo ya está registrado. Prueba a Iniciar Sesión.');
          } else {
            setErrorMessage(error.message);
          }
        } else {
          if (user && user.identities && user.identities.length === 0) {
            setErrorMessage('Este correo ya está registrado.');
          } else {
            setSuccessMessage('¡Cuenta creada con éxito! Sincronizando tus listas...');
            setTimeout(() => {
              closeAuthModal();
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xl animate-fade-in touch-manipulation"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md bg-neutral-900/90 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/30 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' ? 'Bienvenido a Free-Spoty' : 'Crea tu cuenta gratis'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Guarda tus favoritas y playlists en la nube para escucharlas en cualquier lugar.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-black/40 p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-neutral-800 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-neutral-800 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5 animate-fade-in">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-neutral-800/80 border border-white/20 text-white text-xs flex items-center gap-2.5 animate-fade-in">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nombre de usuario (opcional)
              </label>
              <input
                type="text"
                placeholder="Tu apodo o nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-red-600/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              'Entrar a Free-Spoty'
            ) : (
              'Crear mi Cuenta Gratis'
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-neutral-500">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-neutral-300 hover:text-white underline font-medium"
                >
                  Regístrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-neutral-300 hover:text-white underline font-medium"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
