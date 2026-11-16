// /mes-voyages/compte : profil (prénom, nom), moyens de connexion, mot de passe, données, suppression du compte.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../auth';
import { supabase } from '../lib/supabase';
import { deleteAccount } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { authErrorMessage, passwordProblem, profileOf, PROVIDER_LABELS } from '../lib/account';
import { Alert, Button, Card, Field, inputClass, PageShell, SectionTitle } from '../ui';

const CONFIRM_WORD = 'SUPPRIMER';

function ProfileForm() {
  const { session } = useAuth();
  const initial = profileOf(session?.user);
  const [first, setFirst] = useState(initial.firstName);
  const [last, setLast] = useState(initial.lastName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!first.trim() || !last.trim()) return setMessage({ tone: 'error', text: 'Indiquez votre prénom et votre nom.' });
    setBusy(true);
    const f = first.trim().slice(0, 60);
    const l = last.trim().slice(0, 60);
    const { error } = await supabase().auth.updateUser({ data: { first_name: f, last_name: l, full_name: `${f} ${l}` } });
    setBusy(false);
    setMessage(error ? { tone: 'error', text: authErrorMessage(error) } : { tone: 'info', text: 'Profil enregistré.' });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Prénom" htmlFor="mv-first">
          <input id="mv-first" autoComplete="given-name" maxLength={60} value={first} onChange={(e) => setFirst(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Nom" htmlFor="mv-last">
          <input id="mv-last" autoComplete="family-name" maxLength={60} value={last} onChange={(e) => setLast(e.target.value)} className={inputClass} />
        </Field>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div>
        <Button type="submit" busy={busy}>Enregistrer</Button>
      </div>
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password, confirm);
    if (problem) return setMessage({ tone: 'error', text: problem });
    setBusy(true);
    const { error } = await supabase().auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage({ tone: 'error', text: authErrorMessage(error) });
    setPassword('');
    setConfirm('');
    setMessage({ tone: 'info', text: hasPassword ? 'Mot de passe modifié.' : 'Mot de passe créé : vous pouvez aussi vous connecter avec votre e-mail.' });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={hasPassword ? 'Nouveau mot de passe' : 'Mot de passe'} htmlFor="mv-pw">
          <input id="mv-pw" type="password" autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Confirmer" htmlFor="mv-pw2">
          <input id="mv-pw2" type="password" autoComplete="new-password" maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <p className="text-xs text-slate-400">Au moins 8 caractères, dont une lettre et un chiffre.</p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div>
        <Button type="submit" busy={busy}>{hasPassword ? 'Changer le mot de passe' : 'Créer un mot de passe'}</Button>
      </div>
    </form>
  );
}

export default function AccountPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState<'signout' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = session?.user;
  const providers = [...new Set((user?.identities ?? []).map((i) => i.provider))];
  const hasPassword = providers.includes('email');

  const doSignOut = async () => {
    setBusy('signout');
    await signOut();
    navigate('/mes-voyages', { replace: true });
  };

  const doDelete = async () => {
    setBusy('delete');
    setError(null);
    try {
      await deleteAccount();
      navigate('/mes-voyages', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  return (
    <PageShell title="Compte" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
      <div className="flex flex-col gap-10 max-w-2xl">
        <section>
          <SectionTitle>Profil</SectionTitle>
          <Card className="p-5">
            <ProfileForm />
          </Card>
        </section>

        <section>
          <SectionTitle>Connexion</SectionTitle>
          <Card className="p-5 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500">Adresse e-mail</div>
                <div className="font-bold text-slate-900 break-all">{user?.email}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Connexion avec : {providers.map((p) => PROVIDER_LABELS[p] ?? p).join(', ') || 'code reçu par e-mail'}
                </div>
              </div>
              <Button onClick={doSignOut} busy={busy === 'signout'}>
                <LogOut className="w-4 h-4" aria-hidden />
                Se déconnecter
              </Button>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-bold text-slate-900 mb-3">{hasPassword ? 'Mot de passe' : 'Ajouter un mot de passe'}</p>
              {!hasPassword && (
                <p className="text-xs text-slate-500 mb-3">Facultatif : pour pouvoir aussi vous connecter avec votre e-mail.</p>
              )}
              <PasswordForm hasPassword={hasPassword} />
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle>Vos données</SectionTitle>
          <Card className="p-5 text-sm text-slate-600 leading-relaxed space-y-3">
            <p className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-brand" aria-hidden />
              Ce que nous gardons, et comment
            </p>
            <p>
              <strong>Hébergement.</strong> Votre compte, vos trajets enregistrés, voyages et recherches sont hébergés par notre
              prestataire Supabase, sur des serveurs situés à Londres (Royaume-Uni, pays reconnu par l'Union européenne comme
              offrant une protection adéquate des données). Seul votre compte y a accès ; rien n'est vendu ni transmis.
            </p>
            <p>
              <strong>Conservation.</strong> Vos données restent tant que vous les gardez ; ce que vous supprimez est effacé.
              Aucun trajet enregistré n'est envoyé à la mesure d'audience.
            </p>
            <p>
              <strong>Suppression.</strong> La suppression du compte efface immédiatement votre profil, vos trajets, voyages et
              recherches. Détails dans la{' '}
              <Link to="/confidentialite" className="underline hover:text-brand">politique de confidentialité</Link>.
            </p>
          </Card>
        </section>

        <section id="suppression">
          <SectionTitle>Supprimer le compte</SectionTitle>
          <Card className="p-5 flex flex-col gap-4 border-red-200">
            <p className="text-sm text-slate-600">
              Votre profil, vos trajets enregistrés, voyages et recherches sauvegardées seront définitivement supprimés. Cette action est
              irréversible.
            </p>
            <Field label={`Pour confirmer, tapez ${CONFIRM_WORD}`} htmlFor="mv-delete-confirm">
              <input id="mv-delete-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="off" autoCapitalize="characters" />
            </Field>
            {error && <Alert tone="error">{error}</Alert>}
            <div>
              <Button variant="danger" busy={busy === 'delete'} disabled={confirm.trim().toUpperCase() !== CONFIRM_WORD} onClick={doDelete}>
                <Trash2 className="w-4 h-4" aria-hidden />
                Supprimer définitivement mon compte
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
