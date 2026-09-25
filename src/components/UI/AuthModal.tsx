import React, { useState } from 'react';
import { User as UserIcon, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ui } from '../../state/ui';
import { Sheet, Spinner, inputClass } from './Primitives';

const ERROR_MESSAGES: [string, string][] = [
  ['Invalid login credentials', 'Correo o contraseña incorrectos.'],
  ['Email not confirmed', 'Confirma tu correo electrónico antes de entrar.'],
  ['User already registered', 'Este correo ya está registrado. Prueba a iniciar sesión.'],
  ['rate limit', 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'],
];

function translate(message: string): string {
  return ERROR_MESSAGES.find(([k]) => message.toLowerCase().includes(k.toLowerCase()))?.[1] || message;
}

export default function AuthModal({ initialMode }: { initialMode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password) return setError('Completa todos los campos obligatorios.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) return setError(translate(error.message));
        setSuccess('¡Sesión iniciada! Sincronizando tu biblioteca...');
      } else {
        const { error, user } = await signUp(email, password, displayName);
        if (error) return setError(translate(error.message));
        if (user && user.identities && user.identities.length === 0) return setError('Este correo ya está registrado.');
        setSuccess(user?.confirmed_at ? '¡Cuenta creada! Sincronizando tus listas...' : '¡Cuenta creada! Revisa tu correo para confirmarla.');
      }
      setTimeout(ui.closeAuth, 1000);
    } catch (err: any) {
      setError(err?.message || 'Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const tab = (active: boolean) =>
    `flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
      active ? 'bg-paper/[0.08] text-paper shadow-md' : 'text-mute hover:text-paper'
    }`;

  return (
    <Sheet onClose={ui.closeAuth} zIndex="z-[999]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-red text-paper mb-3">
          <UserIcon className="w-6 h-6" />
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-paper">
          {mode === 'login' ? 'Bienvenido a Free-Spoty' : 'Crea tu cuenta gratis'}
        </h3>
        <p className="text-xs sm:text-sm text-mute mt-1">
          Guarda tus favoritas y playlists en la nube para escucharlas en cualquier lugar.
        </p>
      </div>

      <div className="flex rounded-2xl bg-ink/60 p-1 mb-6 border border-line">
        <button type="button" onClick={() => switchMode('login')} className={tab(mode === 'login')}>
          Iniciar sesión
        </button>
        <button type="button" onClick={() => switchMode('register')} className={tab(mode === 'register')}>
          Crear cuenta
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-brand-red/15 border border-brand-red/30 text-paper text-xs flex items-center gap-2.5 animate-fadeIn" role="alert">
          <AlertCircle className="w-4 h-4 text-brand-coral shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3.5 rounded-2xl bg-paper/[0.05] border border-paper/20 text-paper text-xs flex items-center gap-2.5 animate-fadeIn">
          <Check className="w-4 h-4 text-brand-coral shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-medium text-paper/80 mb-1.5">Nombre de usuario (opcional)</label>
            <input
              type="text"
              autoComplete="nickname"
              placeholder="Tu apodo o nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`${inputClass} py-3`}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-paper/80 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} py-3`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-paper/80 mb-1.5">Contraseña</label>
          <input
            type="password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} py-3`}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-4 bg-brand-red hover:bg-brand-lightred text-paper font-semibold rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Spinner className="w-4 h-4 border-2 border-white" />
          ) : mode === 'login' ? (
            'Entrar a Free-Spoty'
          ) : (
            'Crear mi cuenta gratis'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] text-faint">
        {mode === 'login' ? '¿No tienes cuenta aún? ' : '¿Ya tienes una cuenta? '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="text-paper/80 hover:text-paper underline font-medium"
        >
          {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
        </button>
      </p>
    </Sheet>
  );
}
