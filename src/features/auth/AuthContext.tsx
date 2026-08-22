import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Linking, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type UserProfile = {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: { username?: string | null; fullName?: string | null }) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(row: {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}): UserProfile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getWebRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/resaka/profile`;
}

function extractOAuthSession(url: string) {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const query = parsed.searchParams;

  return {
    accessToken: hash.get('access_token'),
    refreshToken: hash.get('refresh_token'),
    code: query.get('code') ?? hash.get('code'),
  };
}

async function consumeAuthCallbackUrl(url: string) {
  if (!url.startsWith('resaka://')) return false;

  const oauth = extractOAuthSession(url);
  if (oauth.accessToken && oauth.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: oauth.accessToken,
      refresh_token: oauth.refreshToken,
    });
    if (error) throw error;
    return true;
  }

  if (oauth.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(oauth.code);
    if (error) throw error;
    return true;
  }

  return false;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId?: string) => {
    const id = userId ?? session?.user.id;
    if (!id) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    setProfile(mapProfile(data));
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        if (Platform.OS !== 'web') {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) await consumeAuthCallbackUrl(initialUrl);
        }

        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(initialSession);
        if (initialSession?.user.id) {
          await loadProfile(initialSession.user.id);
        }
      } catch (error) {
        console.warn('RESAKA auth initialization failed', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void initialize();

    const authSubscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.id) {
        void loadProfile(nextSession.user.id).catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    }).data.subscription;

    const linkSubscription = Platform.OS === 'web'
      ? null
      : Linking.addEventListener('url', ({ url }) => {
          void consumeAuthCallbackUrl(url).catch((error) => {
            console.warn('RESAKA auth callback failed', error);
          });
        });

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
      linkSubscription?.remove();
    };
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const redirectTo = Platform.OS === 'web' ? getWebRedirectUrl() : 'resaka://auth-callback';
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: fullName?.trim() ? { full_name: fullName.trim() } : undefined,
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      return Boolean(data.user && !data.session);
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getWebRedirectUrl(),
        },
      });
      if (error) throw error;
      return;
    }

    const redirectTo = 'resaka://auth-callback';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('Supabase no ha devuelto la URL de Google OAuth.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      showInRecents: true,
    });

    if (result.type !== 'success') return;
    const consumed = await consumeAuthCallbackUrl(result.url);
    if (!consumed) throw new Error('Google ha vuelto a RESAKA sin una sesión válida.');
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async ({ username, fullName }: { username?: string | null; fullName?: string | null }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('Necesitas iniciar sesión para editar el perfil.');

      const updates: Record<string, string | null> = {};
      if (username !== undefined) updates.username = username?.trim() || null;
      if (fullName !== undefined) updates.full_name = fullName?.trim() || null;

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
      await loadProfile(userId);
    },
    [loadProfile, session?.user.id],
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      updateProfile,
      refreshProfile,
    }),
    [
      isLoading,
      profile,
      refreshProfile,
      session,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      signUpWithEmail,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
