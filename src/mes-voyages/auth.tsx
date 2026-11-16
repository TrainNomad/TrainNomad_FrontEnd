// Session de l'espace « Mes voyages » : compte Supabase, connexion par code reçu par e-mail.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { track } from '../lib/analytics';
import { PageLoader } from './ui';

interface AuthValue {
  session: Session | null;
  /** Session pas encore lue depuis l'appareil */
  loading: boolean;
  signOut: () => Promise<void>;
}

/** Comptes déjà comptés pendant cette visite (l'événement de connexion peut se répéter) */
const counted = new Set<string>();

/**
 * Mesure d'audience : un compte qui vient d'être créé (première connexion dans les 10 minutes qui suivent sa
 * création, quel que soit le moyen : e-mail, Google…). Rien du compte n'est envoyé, seulement le moyen utilisé.
 */
function countNewAccount(session: Session | null) {
  const user = session?.user;
  if (!user || counted.has(user.id)) return;
  counted.add(user.id);
  if (Date.now() - Date.parse(user.created_at) < 10 * 60_000) {
    track('compte-cree', { methode: String(user.app_metadata?.provider ?? 'email') });
  }
}

const AuthContext = createContext<AuthValue>({ session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase();
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_IN') countNewAccount(next);
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Session de cet appareil seulement ; rien d'autre n'est gardé localement par l'espace
    await supabase().auth.signOut({ scope: 'local' });
  };

  return <AuthContext.Provider value={{ session, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Adresse de retour après connexion : uniquement une page de l'espace (pas de redirection vers un autre site). */
export function safeNext(value: string | null | undefined): string {
  return value && /^\/mes-voyages(\/|\?|$)/.test(value) && !value.startsWith('//') ? value : '/mes-voyages';
}

/** Page réservée aux comptes connectés : sinon, connexion puis retour à cette page avec ses paramètres. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/mes-voyages/connexion?suite=${next}`} replace />;
  }
  return <>{children}</>;
}
