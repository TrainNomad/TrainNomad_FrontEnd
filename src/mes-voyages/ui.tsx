// Éléments d'interface communs aux pages « Mes voyages » (mêmes codes visuels que le reste du site).
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, LoaderCircle, TriangleAlert } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Page de l'espace : en-tête (retour, titre, actions) et contenu centré. */
export function PageShell({
  title,
  subtitle,
  back,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[70vh] bg-slate-50/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-midnight break-words">{title}</h1>
            {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('bg-white border border-slate-200 rounded-2xl shadow-sm', className)}>{children}</section>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">{children}</h2>
      {aside}
    </div>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand hover:bg-brand-dark text-white shadow-sm',
  secondary: 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-white border border-red-200 text-red-700 hover:bg-red-50',
};

export const buttonClass = (variant: Variant = 'secondary', size: 'sm' | 'md' = 'md') =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
    VARIANTS[variant],
  );

export function Button({
  variant = 'secondary',
  size = 'md',
  busy = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; busy?: boolean }) {
  return (
    <button type="button" {...props} disabled={props.disabled || busy} className={cx(buttonClass(variant, size), className)}>
      {busy && <LoaderCircle className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cx('animate-spin text-slate-400', className ?? 'w-5 h-5')} aria-label="Chargement" />;
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner className="w-7 h-7" />
    </div>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'error'; children: ReactNode }) {
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-800',
  }[tone];
  const Icon = tone === 'info' ? Info : TriangleAlert;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('flex gap-3 rounded-xl border px-4 py-3 text-sm', styles)}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="text-center px-6 py-10">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-3">{icon}</div>
      <p className="font-bold text-slate-800">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-bold text-slate-600">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300 focus:border-brand focus:ring-brand';

/**
 * Bouton de suppression en deux temps (pas de fenêtre du navigateur) : un premier clic demande confirmation,
 * qui s'annule seule après quelques secondes.
 */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = 'Confirmer la suppression',
  icon,
  size = 'sm',
}: {
  onConfirm: () => Promise<void> | void;
  label: ReactNode;
  confirmLabel?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button
      variant={armed ? 'danger' : 'ghost'}
      size={size}
      busy={busy}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
    >
      {!busy && icon}
      {armed ? confirmLabel : label}
    </Button>
  );
}

// ─── Formats ────────────────────────────────────────────────────────────────────────────────────

/** "2026-11-05" → "jeu. 5 nov. 2026" */
export function formatDay(isoDate: string, withYear = true): string {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear && { year: 'numeric' }),
    timeZone: 'UTC',
  });
}

/** Période d'un voyage : « du 15 au 18 janv. 2027 », ou une seule date */
export function formatPeriod(start: string, end: string | null): string {
  if (!end || end === start) return formatDay(start);
  return `${formatDay(start, start.slice(0, 4) !== end.slice(0, 4))} → ${formatDay(end)}`;
}

/** Instant (horodatage) dans le fuseau de l'appareil : « 5 nov. 2026 à 14:32 » */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** 89.5 → « 89,50 € » */
export function formatEuros(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/** Saisie « 89,50 » ou « 89.5 » → 89.5 ; vide → null ; invalide → NaN */
export function parseEuros(text: string): number | null {
  const t = text.trim().replace(/\s|€/g, '').replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : NaN;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}
