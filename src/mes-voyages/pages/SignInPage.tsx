// /mes-voyages/connexion : connexion et création de compte.
//   • e-mail + mot de passe (inscription avec prénom et nom, confirmation de l'adresse par e-mail) ;
//   • Google, Facebook, Apple : boutons affichés seulement pour les fournisseurs activés dans Supabase ;
//   • mot de passe oublié : lien de réinitialisation par e-mail (/mes-voyages/mot-de-passe).
// Retour après connexion : ?suite= (page de l'espace seulement). Mise en page inspirée de « clean minimal sign in ».
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, LogIn, Mail, MailCheck, UserRound, UserRoundPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { safeNext, useAuth } from '../auth';
import { authErrorMessage, enabledProviders, passwordProblem, type OAuthProvider } from '../lib/account';
import { AppleLogo, FacebookLogo, GoogleLogo } from '../components/ProviderLogos';
import { GOOGLE_CLIENT_ID, mountGoogleButton } from '../lib/googleSignIn';
import { PageLoader, cx } from '../ui';

type Mode = 'signin' | 'signup' | 'forgot' | 'confirm' | 'reset-sent';

const IS_DEV = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

/** Erreur renvoyée dans l'adresse par un lien e-mail ou par Google / Facebook */
function urlError(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const code = hash.get('error_code') ?? query.get('error_code');
  const error = hash.get('error') ?? query.get('error');
  if (!code && !error) return null;
  if (code === 'otp_expired') return 'Ce lien a expiré ou a déjà servi. Connectez-vous, ou demandez un nouveau lien.';
  if (error === 'access_denied') return 'Connexion annulée.';
  return 'La connexion n’a pas abouti. Réessayez, ou utilisez votre e-mail et votre mot de passe.';
}

function InputWithIcon({ icon, right, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; right?: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
      <input
        {...props}
        className={cx(
          'w-full pl-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-black text-sm placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50',
          right ? 'pr-10' : 'pr-3',
        )}
      />
      {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <InputWithIcon
      {...props}
      type={visible ? 'text' : 'password'}
      icon={<Lock className="w-4 h-4" />}
      right={
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

export const PRIMARY_BUTTON =
  'w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 rounded-xl shadow hover:brightness-110 transition disabled:opacity-60';

/** Carte centrée du design de connexion */
export function AuthCard({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-[80vh] w-full flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg shadow-slate-200/50">{icon}</div>
        <h1 className="text-2xl font-semibold mb-2 text-center">{title}</h1>
        <p className="text-gray-500 text-sm mb-6 text-center break-words">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

const OAUTH_BUTTONS: { id: OAuthProvider; label: string; logo: ReactNode }[] = [
  { id: 'google', label: 'Google', logo: <GoogleLogo /> },
  { id: 'facebook', label: 'Facebook', logo: <FacebookLogo /> },
  { id: 'apple', label: 'Apple', logo: <AppleLogo className="w-6 h-6 text-black" /> },
];

export default function SignInPage() {
  const { session, loading } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('suite'));
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'oubli' ? 'forgot' : params.get('mode') === 'inscription' ? 'signup' : 'signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [info, setInfo] = useState<string | null>(null);
  const [providers, setProviders] = useState<Record<OAuthProvider, boolean> | null>(null);

  useEffect(() => {
    enabledProviders().then(setProviders);
  }, []);

  // Bouton Google intégré (la fenêtre Google affiche trainnomad.eu) : affiché dès que Google est activé dans Supabase
  const googleRef = useRef<HTMLDivElement>(null);
  const useGoogleButton = !!GOOGLE_CLIENT_ID && !!providers?.google && (mode === 'signin' || mode === 'signup');
  useEffect(() => {
    if (!useGoogleButton || !googleRef.current) return;
    mountGoogleButton(googleRef.current, {
      onSignedIn: () => navigate(safeNext(new URLSearchParams(window.location.search).get('suite')), { replace: true }),
      onError: (err) => setError(authErrorMessage(err)),
    }).catch(() => setError('Le bouton Google n’a pas pu être chargé. Vérifiez votre connexion ou un bloqueur de contenu.'));
  }, [useGoogleButton, mode, navigate]);

  if (loading) return <PageLoader />;
  if (session) return <Navigate to={next} replace />;

  const go = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const callbackUrl = `${window.location.origin}/mes-voyages/connexion?suite=${encodeURIComponent(next)}`;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err as { message?: string }));
    } finally {
      setBusy(false);
    }
  };

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    if (!validEmail || !password) return setError('Saisissez votre e-mail et votre mot de passe.');
    void run(async () => {
      const { error: err } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
      if (err) return setError(authErrorMessage(err));
      navigate(next, { replace: true });
    });
  };

  const signUp = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return setError('Indiquez votre prénom et votre nom.');
    if (!validEmail) return setError('Adresse e-mail invalide.');
    const problem = passwordProblem(password, confirm);
    if (problem) return setError(problem);
    void run(async () => {
      const first = firstName.trim().slice(0, 60);
      const last = lastName.trim().slice(0, 60);
      const { data, error: err } = await supabase().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { first_name: first, last_name: last, full_name: `${first} ${last}` }, emailRedirectTo: callbackUrl },
      });
      if (err) return setError(authErrorMessage(err));
      if (data.session) return navigate(next, { replace: true });
      // confirmation de l'adresse demandée : lien ou code dans l'e-mail
      setMode('confirm');
    });
  };

  const verifyCode = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { error: err } = await supabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' });
      if (err) return setError(authErrorMessage(err));
      navigate(next, { replace: true });
    });
  };

  const resendConfirmation = () =>
    run(async () => {
      const { error: err } = await supabase().auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: callbackUrl } });
      if (err) setError(authErrorMessage(err));
      else setInfo('E-mail de confirmation renvoyé.');
    });

  const forgot = (e: FormEvent) => {
    e.preventDefault();
    if (!validEmail) return setError('Saisissez l’adresse e-mail de votre compte.');
    void run(async () => {
      const { error: err } = await supabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/mes-voyages/mot-de-passe`,
      });
      if (err) return setError(authErrorMessage(err));
      setMode('reset-sent');
    });
  };

  const oauth = (provider: OAuthProvider) =>
    run(async () => {
      const { error: err } = await supabase().auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl } });
      if (err) setError(authErrorMessage(err));
      // sinon : le navigateur part chez le fournisseur, puis revient ici connecté
    });

  const titles: Record<Mode, [ReactNode, string, string]> = {
    signin: [<LogIn className="w-7 h-7 text-black" />, 'Connexion', 'Retrouvez vos trajets enregistrés sur tous vos appareils.'],
    signup: [<UserRoundPlus className="w-7 h-7 text-black" />, 'Créer un compte', 'Gratuit. Pour garder vos trajets, vos recherches et vos projets de voyage.'],
    forgot: [<KeyRound className="w-7 h-7 text-black" />, 'Mot de passe oublié', 'Recevez par e-mail un lien pour choisir un nouveau mot de passe.'],
    confirm: [<MailCheck className="w-7 h-7 text-black" />, 'Confirmez votre adresse', `Un e-mail vient d’être envoyé à ${email.trim()}.`],
    'reset-sent': [<MailCheck className="w-7 h-7 text-black" />, 'Vérifiez vos e-mails', `Si un compte existe pour ${email.trim()}, un lien vient d’être envoyé.`],
  };
  const [icon, title, subtitle] = titles[mode];

  // En ligne : seulement les fournisseurs activés. En local : tous, grisés s'ils ne sont pas activés.
  const socials = OAUTH_BUTTONS.filter(
    ({ id }) => !(id === 'google' && useGoogleButton) && (providers?.[id] || (IS_DEV && id !== 'apple')),
  );
  const showSocials = (mode === 'signin' || mode === 'signup') && (socials.length > 0 || useGoogleButton);
  const errorLine = error && <p role="alert" className="text-sm text-red-600">{error}</p>;

  return (
    <AuthCard icon={icon} title={title} subtitle={subtitle}>
      {mode === 'signin' && (
        <form onSubmit={signIn} className="w-full flex flex-col gap-3" noValidate>
          <InputWithIcon icon={<Mail className="w-4 h-4" />} type="email" placeholder="E-mail" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordInput placeholder="Mot de passe" autoComplete="current-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="w-full flex justify-end">
            <button type="button" onClick={() => go('forgot')} className="text-xs hover:underline font-medium">
              Mot de passe oublié ?
            </button>
          </div>
          {errorLine}
          <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Pas encore de compte ?{' '}
            <button type="button" onClick={() => go('signup')} className="font-semibold text-black hover:underline">
              Créer un compte
            </button>
          </p>
        </form>
      )}

      {mode === 'signup' && (
        <form onSubmit={signUp} className="w-full flex flex-col gap-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <InputWithIcon icon={<UserRound className="w-4 h-4" />} placeholder="Prénom" autoComplete="given-name" maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <InputWithIcon icon={<UserRound className="w-4 h-4" />} placeholder="Nom" autoComplete="family-name" maxLength={60} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <InputWithIcon icon={<Mail className="w-4 h-4" />} type="email" placeholder="E-mail" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordInput placeholder="Mot de passe" autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordInput placeholder="Confirmer le mot de passe" autoComplete="new-password" maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <p className="text-[11px] text-gray-400">Au moins 8 caractères, dont une lettre et un chiffre.</p>
          {errorLine}
          <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
            {busy ? 'Création…' : 'Créer mon compte'}
          </button>
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            En créant un compte, vous acceptez les <Link to="/conditions" className="underline">conditions d’utilisation</Link> et la{' '}
            <Link to="/confidentialite" className="underline">politique de confidentialité</Link>.
          </p>
          <p className="text-xs text-gray-500 text-center">
            Déjà un compte ?{' '}
            <button type="button" onClick={() => go('signin')} className="font-semibold text-black hover:underline">
              Se connecter
            </button>
          </p>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={forgot} className="w-full flex flex-col gap-3" noValidate>
          <InputWithIcon icon={<Mail className="w-4 h-4" />} type="email" placeholder="E-mail du compte" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          {errorLine}
          <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
            {busy ? 'Envoi…' : 'Recevoir le lien'}
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            Vous vous connectiez jusqu’ici avec un code reçu par e-mail ? Ce lien vous permet de choisir un mot de passe.
          </p>
          <button type="button" onClick={() => go('signin')} className="text-xs font-semibold hover:underline">
            Retour à la connexion
          </button>
        </form>
      )}

      {mode === 'confirm' && (
        <form onSubmit={verifyCode} className="w-full flex flex-col gap-3" noValidate>
          <p className="text-sm text-gray-600 text-center">Cliquez sur le lien de l’e-mail, ou saisissez le code qu’il contient. Pensez aux indésirables.</p>
          <InputWithIcon
            icon={<KeyRound className="w-4 h-4" />}
            placeholder="Code reçu"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {errorLine}
          {info && <p className="text-sm text-brand">{info}</p>}
          <button type="submit" disabled={busy || code.length < 6} className={PRIMARY_BUTTON}>
            Confirmer
          </button>
          <div className="flex justify-between text-xs">
            <button type="button" onClick={resendConfirmation} disabled={busy} className="font-semibold hover:underline disabled:opacity-50">
              Renvoyer l’e-mail
            </button>
            <button type="button" onClick={() => go('signin')} className="font-semibold hover:underline">
              Se connecter
            </button>
          </div>
        </form>
      )}

      {mode === 'reset-sent' && (
        <div className="w-full flex flex-col gap-3 text-center">
          <p className="text-sm text-gray-600">Ouvrez l’e-mail et cliquez sur le lien : vous choisirez votre nouveau mot de passe sur TrainNomad.</p>
          <button type="button" onClick={() => go('signin')} className={PRIMARY_BUTTON}>
            Retour à la connexion
          </button>
        </div>
      )}

      {showSocials && (
        <>
          <div className="flex items-center w-full my-4">
            <div className="flex-grow border-t border-dashed border-gray-200" />
            <span className="mx-2 text-xs text-gray-400">Ou continuer avec</span>
            <div className="flex-grow border-t border-dashed border-gray-200" />
          </div>
          {useGoogleButton && <div ref={googleRef} className="w-full flex justify-center min-h-[44px] mb-3" />}
          <div className="flex gap-3 w-full justify-center">
            {socials.map(({ id, label, logo }) => {
              const enabled = !!providers?.[id];
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!enabled || busy}
                  onClick={() => oauth(id)}
                  aria-label={`Continuer avec ${label}`}
                  title={enabled ? `Continuer avec ${label}` : `${label} : à activer dans Supabase (Authentication › Providers)`}
                  className="flex items-center justify-center h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition grow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {logo}
                </button>
              );
            })}
          </div>
          {IS_DEV && socials.some(({ id }) => !providers?.[id]) && (
            <p className="mt-2 text-[11px] text-amber-700 text-center">
              (Développement) Boutons grisés : fournisseur pas encore activé dans Supabase. En ligne, ils sont masqués.
            </p>
          )}
        </>
      )}
    </AuthCard>
  );
}
