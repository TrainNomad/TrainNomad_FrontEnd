// /mes-voyages/mot-de-passe : arrivée depuis le lien « mot de passe oublié ». Le lien ouvre une session
// temporaire (reprise par le client Supabase depuis l'adresse) qui permet de choisir un nouveau mot de passe.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth';
import { authErrorMessage, passwordProblem } from '../lib/account';
import { PageLoader } from '../ui';
import { AuthCard, PasswordInput, PRIMARY_BUTTON } from './SignInPage';

export default function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <PageLoader />;
  if (!session) {
    return (
      <AuthCard icon={<KeyRound className="w-7 h-7 text-black" />} title="Lien expiré" subtitle="Ce lien de réinitialisation n’est plus valable.">
        <Link to="/mes-voyages/connexion?mode=oubli" className={`${PRIMARY_BUTTON} text-center`}>
          Demander un nouveau lien
        </Link>
      </AuthCard>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password, confirm);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    const { error: err } = await supabase().auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorMessage(err));
    navigate('/mes-voyages?mot-de-passe=1', { replace: true });
  };

  return (
    <AuthCard icon={<KeyRound className="w-7 h-7 text-black" />} title="Nouveau mot de passe" subtitle={`Pour le compte ${session.user.email ?? ''}`}>
      <form onSubmit={submit} className="w-full flex flex-col gap-3" noValidate>
        <PasswordInput placeholder="Nouveau mot de passe" autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordInput placeholder="Confirmer" autoComplete="new-password" maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <p className="text-[11px] text-gray-400">Au moins 8 caractères, dont une lettre et un chiffre.</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
          {busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </AuthCard>
  );
}
