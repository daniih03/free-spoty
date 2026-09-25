import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { getSupabase } from '../services/supabaseClient';
import { setCloudUser } from '../services/cloudStorageService';
import { syncLocalAndCloudData, resetUserDataOnSignOut } from '../services/storageService';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function fallbackProfile(user: User): UserProfile {
  const name = (user.user_metadata?.display_name as string) || user.email?.split('@')[0] || 'Oyente';
  return { id: user.id, email: user.email ?? null, displayName: name };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let syncedUserId: string | null = null;

    const loadProfile = async (u: User) => {
      setProfile(fallbackProfile(u)); // pintado inmediato; se refina con la tabla profiles
      try {
        const sb = await getSupabase();
        const { data } = await sb.from('profiles').select('id, email, display_name').eq('id', u.id).maybeSingle();
        if (active && data) {
          setProfile({
            id: data.id,
            email: data.email || u.email || null,
            displayName: data.display_name || fallbackProfile(u).displayName,
          });
        }
      } catch {
        /* se mantiene el perfil de respaldo */
      }
    };

    getSupabase().then((sb) => {
      if (!active) return;
      // INITIAL_SESSION + cambios posteriores en un único listener
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        setCloudUser(u?.id ?? null);
        setLoading(false);
        if (!u) {
          setProfile(null);
          syncedUserId = null;
          return;
        }
        // Diferido: llamar a Supabase dentro del callback puede bloquear el cliente
        setTimeout(() => {
          if (!active) return;
          void loadProfile(u);
          if (syncedUserId !== u.id) {
            syncedUserId = u.id;
            void syncLocalAndCloudData();
          }
        }, 0);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = await getSupabase();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const sb = await getSupabase();
    const name = displayName?.trim() || email.split('@')[0];
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name } },
    });
    if (!error && data.user) {
      // Respaldo si el trigger de profiles aún no se ha ejecutado
      const { error: profileError } = await sb
        .from('profiles')
        .upsert({ id: data.user.id, email: data.user.email, display_name: name });
      if (profileError) console.warn('Aviso al crear perfil:', profileError.message);
    }
    return { error, user: data.user };
  }, []);

  const signOut = useCallback(async () => {
    const sb = await getSupabase();
    await sb.auth.signOut();
    setCloudUser(null);
    resetUserDataOnSignOut();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signIn, signUp, signOut }),
    [user, profile, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
